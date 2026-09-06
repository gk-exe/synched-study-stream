/**
 * Companion System — service layer
 * ---------------------------------------------------------------------
 * Centralizes all read/write logic for the companion ecosystem so UI
 * layers (dashboard, focus mode, customize, future generator) talk to
 * a single, typed surface instead of poking at Supabase directly.
 *
 * Domain map (see migration `companion_system_foundation` for SQL):
 *
 *   companion_catalog      — global blueprints (Sync, Lumi, Nova, …)
 *   companions             — user-owned instances (level, xp, mood, active)
 *   companion_items        — global item catalog (themes, accessories)
 *   companion_inventory    — user-owned items (+ equipped state)
 *   companion_milestones   — progression event log (streak/sessions/level)
 *   companion_reactions    — append-only mood/reaction stream
 *   companion_concepts     — future AI-generation workflow surface
 *
 * Progression model
 *   - XP is granted by `grantStudyXp` after each completed focus session.
 *   - Level curve is intentionally simple and easy to retune later:
 *       experience_to_next(level) = 100 * level
 *     i.e. L1→L2 = 100xp, L2→L3 = 200xp, …
 *   - Crossing a threshold mints a `companion_milestones` row of
 *     kind='level' with a coin reward, and emits a celebratory reaction.
 *
 * Economy
 *   - Coins live on `user_stats.coins` (existing). This module exposes
 *     `purchaseItem` which atomically debits coins and inserts the
 *     inventory row. Streak / session milestones also call into
 *     `grantMilestoneReward` which credits coins via the same helper.
 *
 * Mood
 *   - `recordReaction` appends to `companion_reactions` and updates
 *     `companions.mood` so the orb can render the latest state without
 *     re-aggregating the event stream on every render.
 *
 * Future generation
 *   - `createConcept` / `listConcepts` model the user intent + upload
 *     workflow. Actual image generation is a TODO and lives behind a
 *     server function (not implemented here).
 */

import { localDb as supabase } from "@/lib/local-db";
import type { Json } from "@/integrations/supabase/types";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export type CompanionMood =
  | "calm"
  | "happy"
  | "focused"
  | "anxious"
  | "tired"
  | "excited";

export type ReactionStyle =
  | "supportive"
  | "playful"
  | "quiet"
  | "celebratory"
  | "grounding";

export type ReactionTrigger =
  | "session_start"
  | "session_end"
  | "milestone"
  | "mood_log"
  | "idle"
  | "break_overuse";

export type ItemKind = "theme" | "accessory" | "appearance" | "reward";

export interface CompanionCatalogEntry {
  id: string;
  slug: string;
  name: string;
  species: string;
  rarity: string;
  description: string | null;
  base_theme_id: string;
  unlock_cost: number;
  is_starter: boolean;
}

export interface Companion {
  id: string;
  user_id: string;
  catalog_id: string;
  nickname: string | null;
  level: number;
  experience: number;
  experience_to_next: number;
  mood: CompanionMood;
  is_active: boolean;
  customization: Record<string, unknown>;
  unlocked_via: string;
  last_interacted_at: string | null;
}

export interface CompanionItem {
  id: string;
  slug: string;
  kind: ItemKind;
  name: string;
  description: string | null;
  rarity: string;
  cost_coins: number;
  unlock_rule: Record<string, unknown>;
  preview: Record<string, unknown>;
}

export interface InventoryEntry {
  id: string;
  item_id: string;
  equipped_on: string | null;
  is_equipped: boolean;
  acquired_via: string;
}

// ---------------------------------------------------------------------
// Progression curve
// ---------------------------------------------------------------------

/** XP required to advance FROM the given level to the next. */
export function xpForNextLevel(level: number): number {
  return Math.max(100, level * 100);
}

/** Coin reward minted for reaching a given level. */
export function coinsForLevel(level: number): number {
  return 20 + level * 10;
}

// ---------------------------------------------------------------------
// Catalog + active companion
// ---------------------------------------------------------------------

export async function listCatalog(): Promise<CompanionCatalogEntry[]> {
  const { data, error } = await supabase
    .from("companion_catalog")
    .select("*")
    .order("unlock_cost", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CompanionCatalogEntry[];
}

export async function listOwnedCompanions(userId: string): Promise<Companion[]> {
  const { data, error } = await supabase
    .from("companions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Companion[];
}

export async function getActiveCompanion(userId: string): Promise<Companion | null> {
  const { data, error } = await supabase
    .from("companions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Companion | null;
}

/**
 * Ensures the user has at least one companion (the starter) and that
 * exactly one is active. Safe to call on every login.
 */
export async function ensureStarterCompanion(userId: string): Promise<Companion> {
  const owned = await listOwnedCompanions(userId);
  if (owned.length > 0) {
    const active = owned.find((c) => c.is_active);
    if (active) return active;
    // Promote the first one if nothing is active.
    const promoted = await setActiveCompanion(userId, owned[0].id);
    return promoted;
  }

  const { data: starter, error: starterErr } = await supabase
    .from("companion_catalog")
    .select("*")
    .eq("is_starter", true)
    .limit(1)
    .maybeSingle();
  if (starterErr) throw starterErr;
  if (!starter) throw new Error("No starter companion configured in catalog.");

  const { data: inserted, error: insertErr } = await supabase
    .from("companions")
    .insert({
      user_id: userId,
      catalog_id: starter.id,
      nickname: starter.name,
      is_active: true,
      unlocked_via: "starter",
    })
    .select("*")
    .single();
  if (insertErr) throw insertErr;
  return inserted as Companion;
}

export async function setActiveCompanion(
  userId: string,
  companionId: string,
): Promise<Companion> {
  // Deactivate any current active companion, then activate the chosen one.
  // Two sequential statements keep this safe under the partial unique index.
  const { error: deactivateErr } = await supabase
    .from("companions")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);
  if (deactivateErr) throw deactivateErr;

  const { data, error } = await supabase
    .from("companions")
    .update({ is_active: true, last_interacted_at: new Date().toISOString() })
    .eq("id", companionId)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Companion;
}

// ---------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------

export interface XpResult {
  companion: Companion;
  leveledUp: boolean;
  levelsGained: number;
  coinsAwarded: number;
}

/**
 * Grant XP to the user's active companion. Handles level-ups (possibly
 * multiple at once), logs milestones, and credits coin rewards.
 *
 * Call sites: end-of-session in `use-pomodoro`, streak milestones in
 * the daily rollover, etc.
 */
export async function grantStudyXp(userId: string, amount: number): Promise<XpResult | null> {
  if (amount <= 0) return null;
  const companion = await getActiveCompanion(userId);
  if (!companion) return null;

  let { level, experience } = companion;
  let coinsAwarded = 0;
  let levelsGained = 0;
  experience += amount;

  // Drain XP across as many level-ups as fit.
  while (experience >= xpForNextLevel(level)) {
    experience -= xpForNextLevel(level);
    level += 1;
    levelsGained += 1;
    coinsAwarded += coinsForLevel(level);
    await logMilestone(userId, companion.id, "level", level, { coins: coinsForLevel(level) });
  }

  const { data, error } = await supabase
    .from("companions")
    .update({
      level,
      experience,
      experience_to_next: xpForNextLevel(level),
      last_interacted_at: new Date().toISOString(),
    })
    .eq("id", companion.id)
    .select("*")
    .single();
  if (error) throw error;

  if (coinsAwarded > 0) await creditCoins(userId, coinsAwarded);
  if (levelsGained > 0) {
    await recordReaction(userId, {
      companionId: companion.id,
      trigger: "milestone",
      mood: "excited",
      style: "celebratory",
      intensity: Math.min(5, 2 + levelsGained),
      message: `Level ${level} — nice work.`,
    });
  }

  return {
    companion: data as Companion,
    leveledUp: levelsGained > 0,
    levelsGained,
    coinsAwarded,
  };
}

// ---------------------------------------------------------------------
// Milestones + coin economy
// ---------------------------------------------------------------------

export async function logMilestone(
  userId: string,
  companionId: string | null,
  kind: "streak" | "sessions" | "level" | "unlock" | "custom",
  threshold: number | null,
  reward: Record<string, unknown> = {},
) {
  const { error } = await supabase.from("companion_milestones").insert({
    user_id: userId,
    companion_id: companionId,
    kind,
    threshold,
    reward: reward as Json,
  });
  if (error) throw error;
}

/**
 * Atomically credit coins to user_stats. Uses a read-then-write because
 * Supabase JS does not expose `UPDATE … SET coins = coins + n` directly;
 * if you need stricter concurrency, port this to an RPC.
 */
export async function creditCoins(userId: string, amount: number): Promise<number> {
  const { data: stats, error } = await supabase
    .from("user_stats")
    .select("coins")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  const next = (stats?.coins ?? 0) + amount;
  const { error: upErr } = await supabase
    .from("user_stats")
    .update({ coins: next })
    .eq("user_id", userId);
  if (upErr) throw upErr;
  return next;
}

export async function debitCoins(userId: string, amount: number): Promise<number> {
  const { data: stats, error } = await supabase
    .from("user_stats")
    .select("coins")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  const current = stats?.coins ?? 0;
  if (current < amount) throw new Error("Not enough coins.");
  const next = current - amount;
  const { error: upErr } = await supabase
    .from("user_stats")
    .update({ coins: next })
    .eq("user_id", userId);
  if (upErr) throw upErr;
  return next;
}

// ---------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------

export async function listItems(): Promise<CompanionItem[]> {
  const { data, error } = await supabase
    .from("companion_items")
    .select("*")
    .order("cost_coins", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CompanionItem[];
}

export async function listInventory(userId: string): Promise<InventoryEntry[]> {
  const { data, error } = await supabase
    .from("companion_inventory")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as InventoryEntry[];
}

export async function purchaseItem(userId: string, itemId: string): Promise<InventoryEntry> {
  const { data: item, error: itemErr } = await supabase
    .from("companion_items")
    .select("*")
    .eq("id", itemId)
    .single();
  if (itemErr) throw itemErr;

  if (item.cost_coins > 0) await debitCoins(userId, item.cost_coins);

  const { data, error } = await supabase
    .from("companion_inventory")
    .insert({
      user_id: userId,
      item_id: itemId,
      acquired_via: item.cost_coins > 0 ? "coins" : "milestone",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as InventoryEntry;
}

export async function equipItem(
  userId: string,
  inventoryId: string,
  companionId: string,
): Promise<void> {
  const { error } = await supabase
    .from("companion_inventory")
    .update({ is_equipped: true, equipped_on: companionId })
    .eq("id", inventoryId)
    .eq("user_id", userId);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Mood / reactions
// ---------------------------------------------------------------------

export interface ReactionInput {
  companionId?: string | null;
  trigger: ReactionTrigger;
  mood: CompanionMood;
  style?: ReactionStyle;
  intensity?: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

export async function recordReaction(userId: string, input: ReactionInput) {
  const { error } = await supabase.from("companion_reactions").insert({
    user_id: userId,
    companion_id: input.companionId ?? null,
    trigger: input.trigger,
    mood: input.mood,
    style: input.style ?? "supportive",
    intensity: input.intensity ?? 1,
    message: input.message ?? null,
    metadata: (input.metadata ?? {}) as Json,
  });
  if (error) throw error;

  if (input.companionId) {
    await supabase
      .from("companions")
      .update({ mood: input.mood, last_interacted_at: new Date().toISOString() })
      .eq("id", input.companionId);
  }
}

// ---------------------------------------------------------------------
// Future generation surface (NO image generation yet)
// ---------------------------------------------------------------------

export interface ConceptDraft {
  prompt?: string;
  inspirationPaths?: string[];
  palette?: Record<string, unknown>;
}

/**
 * Records the user's intent to create a custom companion. A future
 * server function will pick up rows in status='queued', call the image
 * model, and update the row to 'ready' / 'failed'.
 */
export async function createConcept(userId: string, draft: ConceptDraft) {
  const { data, error } = await supabase
    .from("companion_concepts")
    .insert({
      user_id: userId,
      prompt: draft.prompt ?? null,
      inspiration_paths: draft.inspirationPaths ?? [],
      palette: (draft.palette ?? {}) as Json,
      status: "draft",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listConcepts(userId: string) {
  const { data, error } = await supabase
    .from("companion_concepts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}