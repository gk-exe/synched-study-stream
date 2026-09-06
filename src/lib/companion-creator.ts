/**
 * Create-your-companion service
 * ---------------------------------------------------------------------
 * Owns everything behind the premium "make your own companion" flow:
 *
 *   - reference image uploads      → private `companion-assets` bucket
 *   - concept rows                 → `companion_concepts`
 *   - generated render persistence → bucket + signed preview URLs
 *   - adoption                     → the concept becomes the app-wide face
 *
 * Image generation itself streams through `/api/companion-image`; this
 * module only persists the result so every screen can read it back.
 */
import { localDb as supabase } from "@/lib/local-db";

/** Coin price to unlock the creator. Mirrors the copy in the UI. */
export const CREATOR_UNLOCK_COST = 500;
export const CREATOR_FEATURE_ID = "companion-creator";

const BUCKET = "companion-assets";
const SIGNED_TTL = 60 * 60; // 1 hour

export interface CompanionConcept {
  id: string;
  user_id: string;
  name: string | null;
  prompt: string | null;
  style: string;
  status: string;
  reference_path: string | null;
  inspiration_paths: string[];
  generated_asset_path: string | null;
  preview_url: string | null;
  adopted_at: string | null;
  error: string | null;
  created_at: string;
}

function table() {
  // Generated types lag behind the newest columns; the runtime shape is
  // validated by RLS + the CompanionConcept interface above.
  return supabase.from("companion_concepts") as any;
}

/* ---------- storage ---------- */

export async function uploadReference(userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/references/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

export async function signedUrl(path: string | null) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_TTL);
  if (error) return null;
  return data?.signedUrl ?? null;
}

async function uploadRender(userId: string, conceptId: string, dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${userId}/renders/${conceptId}.png`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/png", upsert: true });
  if (error) throw error;
  return path;
}

/* ---------- concepts ---------- */

export async function createConceptDraft(
  userId: string,
  input: { name?: string; prompt?: string; style: string; referencePath?: string | null },
): Promise<CompanionConcept> {
  const { data, error } = await table()
    .insert({
      user_id: userId,
      name: input.name?.trim() || null,
      prompt: input.prompt?.trim() || null,
      style: input.style,
      reference_path: input.referencePath ?? null,
      inspiration_paths: input.referencePath ? [input.referencePath] : [],
      status: "generating",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as CompanionConcept;
}

export async function attachRender(
  userId: string,
  conceptId: string,
  dataUrl: string,
): Promise<CompanionConcept> {
  const path = await uploadRender(userId, conceptId, dataUrl);
  const { data, error } = await table()
    .update({ generated_asset_path: path, status: "ready", error: null })
    .eq("id", conceptId)
    .select("*")
    .single();
  if (error) throw error;
  return data as CompanionConcept;
}

export async function markConceptFailed(conceptId: string, message: string) {
  await table().update({ status: "failed", error: message }).eq("id", conceptId);
}

export async function listConcepts(userId: string): Promise<CompanionConcept[]> {
  const { data, error } = await table()
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CompanionConcept[];
}

/** Makes a concept the active face of the app (only one at a time). */
export async function adoptConcept(userId: string, conceptId: string) {
  await table().update({ adopted_at: null }).eq("user_id", userId).not("adopted_at", "is", null);
  const { data, error } = await table()
    .update({ adopted_at: new Date().toISOString(), status: "adopted" })
    .eq("id", conceptId)
    .select("*")
    .single();
  if (error) throw error;
  return data as CompanionConcept;
}

export async function retireAdopted(userId: string) {
  await table().update({ adopted_at: null }).eq("user_id", userId).not("adopted_at", "is", null);
}

export async function getAdoptedConcept(userId: string): Promise<CompanionConcept | null> {
  const { data, error } = await table()
    .select("*")
    .eq("user_id", userId)
    .not("adopted_at", "is", null)
    .order("adopted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as CompanionConcept) ?? null;
}

export async function deleteConcept(conceptId: string) {
  const { error } = await table().delete().eq("id", conceptId);
  if (error) throw error;
}