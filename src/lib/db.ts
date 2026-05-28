import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type DbGoal = Database["public"]["Tables"]["daily_goals"]["Row"];
export type DbStats = Database["public"]["Tables"]["user_stats"]["Row"];
export type DbSession = Database["public"]["Tables"]["study_sessions"]["Row"];
export type DbMood = Database["public"]["Tables"]["mood_logs"]["Row"];
export type DbProfile = Database["public"]["Tables"]["profiles"]["Row"];

/* ---------- profiles ---------- */
export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/* ---------- user_stats ---------- */
export async function fetchStats(userId: string) {
  const { data, error } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertStats(
  userId: string,
  patch: Partial<Omit<DbStats, "user_id" | "created_at" | "updated_at">>,
) {
  const { data, error } = await supabase
    .from("user_stats")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ---------- daily_goals ---------- */
export async function fetchGoals(userId: string) {
  const { data, error } = await supabase
    .from("daily_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertGoal(userId: string, label: string) {
  const { data, error } = await supabase
    .from("daily_goals")
    .insert({ user_id: userId, label })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateGoal(id: string, patch: Partial<Pick<DbGoal, "label" | "done">>) {
  const { error } = await supabase.from("daily_goals").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteGoal(id: string) {
  const { error } = await supabase.from("daily_goals").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- study_sessions ---------- */
export async function logStudySession(
  userId: string,
  mode: "focus" | "short" | "long",
  durationSeconds: number,
) {
  const { error } = await supabase
    .from("study_sessions")
    .insert({ user_id: userId, mode, duration_seconds: durationSeconds });
  if (error) throw error;
}

export async function fetchRecentSessions(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/* ---------- mood_logs ---------- */
export async function logMood(userId: string, mood: "calm" | "focused" | "tired" | "anxious") {
  const { error } = await supabase.from("mood_logs").insert({ user_id: userId, mood });
  if (error) throw error;
}

export async function fetchLatestMood(userId: string) {
  const { data, error } = await supabase
    .from("mood_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/* ---------- chat_messages ---------- */
export type ChatRole = "user" | "assistant";

export async function fetchChatHistory(userId: string, limit = 100) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function insertChatMessage(
  userId: string,
  role: ChatRole,
  content: string,
  mood?: string,
) {
  const { error } = await supabase
    .from("chat_messages")
    .insert({ user_id: userId, role, content, mood: mood ?? null });
  if (error) throw error;
}

export async function clearChatHistory(userId: string) {
  const { error } = await supabase.from("chat_messages").delete().eq("user_id", userId);
  if (error) throw error;
}