import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// NOTE: These tables exist in the database (notes, pdfs, flashcard_decks,
// flashcards, quizzes, quiz_questions, quiz_sessions, saved_explanations,
// learning_collections, collection_items). They will appear in the generated
// Supabase types after the next type regeneration; until then we cast through
// `any` at the query boundary to keep the foundation usable.
type Db = Database["public"];
const db = supabase as unknown as ReturnType<typeof getTypedClient>;
function getTypedClient() {
  return supabase;
}

/* ---------------- Notes ---------------- */
export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export async function fetchNotes(userId: string): Promise<Note[]> {
  const { data, error } = await (supabase as any)
    .from("notes").select("*").eq("user_id", userId)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function createNote(userId: string, patch: Partial<Note> = {}): Promise<Note> {
  const { data, error } = await (supabase as any)
    .from("notes")
    .insert({ user_id: userId, title: patch.title ?? "Untitled", content: patch.content ?? "", tags: patch.tags ?? [] })
    .select().single();
  if (error) throw error;
  return data;
}
export async function updateNote(id: string, patch: Partial<Pick<Note, "title" | "content" | "tags" | "pinned">>) {
  const { error } = await (supabase as any).from("notes").update(patch).eq("id", id);
  if (error) throw error;
}
export async function deleteNote(id: string) {
  const { error } = await (supabase as any).from("notes").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- PDFs ---------------- */
export type Pdf = {
  id: string;
  user_id: string;
  title: string;
  filename: string;
  storage_path: string;
  size_bytes: number;
  page_count: number | null;
  tags: string[];
  processing_status: "pending" | "processing" | "ready" | "failed";
  summary: string | null;
  created_at: string;
  updated_at: string;
};
export async function fetchPdfs(userId: string): Promise<Pdf[]> {
  const { data, error } = await (supabase as any)
    .from("pdfs").select("*").eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function uploadPdf(userId: string, file: File): Promise<Pdf> {
  const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
  const up = await supabase.storage.from("pdfs").upload(path, file, { contentType: file.type });
  if (up.error) throw up.error;
  const { data, error } = await (supabase as any)
    .from("pdfs")
    .insert({
      user_id: userId,
      title: file.name.replace(/\.pdf$/i, ""),
      filename: file.name,
      storage_path: path,
      size_bytes: file.size,
      processing_status: "pending",
    })
    .select().single();
  if (error) throw error;
  return data;
}
export async function deletePdf(p: Pdf) {
  await supabase.storage.from("pdfs").remove([p.storage_path]);
  const { error } = await (supabase as any).from("pdfs").delete().eq("id", p.id);
  if (error) throw error;
}

/* ---------------- Flashcards ---------------- */
export type FlashcardDeck = {
  id: string; user_id: string; title: string; description: string | null;
  source: string; tags: string[]; created_at: string; updated_at: string;
};
export type Flashcard = {
  id: string; user_id: string; deck_id: string; front: string; back: string;
  ease: number; interval_days: number; repetitions: number;
  due_at: string; last_reviewed_at: string | null;
  created_at: string; updated_at: string;
};
export async function fetchDecks(userId: string): Promise<FlashcardDeck[]> {
  const { data, error } = await (supabase as any)
    .from("flashcard_decks").select("*").eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function createDeck(userId: string, title: string): Promise<FlashcardDeck> {
  const { data, error } = await (supabase as any)
    .from("flashcard_decks").insert({ user_id: userId, title }).select().single();
  if (error) throw error;
  return data;
}
export async function fetchCards(deckId: string): Promise<Flashcard[]> {
  const { data, error } = await (supabase as any)
    .from("flashcards").select("*").eq("deck_id", deckId)
    .order("due_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
/** SM-2 inspired update — quality 0..5 */
export function scheduleNext(card: Pick<Flashcard, "ease" | "interval_days" | "repetitions">, quality: number) {
  const q = Math.max(0, Math.min(5, quality));
  let { ease, interval_days, repetitions } = card;
  if (q < 3) { repetitions = 0; interval_days = 1; }
  else {
    repetitions += 1;
    interval_days = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(interval_days * ease);
  }
  ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  const due_at = new Date(Date.now() + interval_days * 86400_000).toISOString();
  return { ease, interval_days, repetitions, due_at };
}

/* ---------------- Quizzes ---------------- */
export type Quiz = {
  id: string; user_id: string; title: string; description: string | null;
  source: string; tags: string[]; created_at: string; updated_at: string;
};
export async function fetchQuizzes(userId: string): Promise<Quiz[]> {
  const { data, error } = await (supabase as any)
    .from("quizzes").select("*").eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function createQuiz(userId: string, title: string): Promise<Quiz> {
  const { data, error } = await (supabase as any)
    .from("quizzes").insert({ user_id: userId, title }).select().single();
  if (error) throw error;
  return data;
}

/* ---------------- Saved explanations ---------------- */
export type SavedExplanation = {
  id: string; user_id: string; title: string; content: string;
  source_question: string | null; folder: string | null;
  tags: string[]; favorite: boolean;
  created_at: string; updated_at: string;
};
export async function fetchExplanations(userId: string): Promise<SavedExplanation[]> {
  const { data, error } = await (supabase as any)
    .from("saved_explanations").select("*").eq("user_id", userId)
    .order("favorite", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function saveExplanation(userId: string, patch: Partial<SavedExplanation> & { content: string }) {
  const { data, error } = await (supabase as any)
    .from("saved_explanations")
    .insert({ user_id: userId, content: patch.content, title: patch.title ?? "Saved explanation",
      source_question: patch.source_question ?? null, folder: patch.folder ?? null,
      tags: patch.tags ?? [], favorite: patch.favorite ?? false })
    .select().single();
  if (error) throw error;
  return data;
}
export async function toggleExplanationFavorite(id: string, favorite: boolean) {
  const { error } = await (supabase as any).from("saved_explanations").update({ favorite }).eq("id", id);
  if (error) throw error;
}
export async function deleteExplanation(id: string) {
  const { error } = await (supabase as any).from("saved_explanations").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- Collections ---------------- */
export type LearningCollection = {
  id: string; user_id: string; title: string; description: string | null;
  color: string | null; created_at: string; updated_at: string;
};
export type CollectionItem = {
  id: string; user_id: string; collection_id: string;
  item_type: "note" | "pdf" | "deck" | "quiz" | "explanation";
  item_id: string; position: number; created_at: string;
};
export async function fetchCollections(userId: string): Promise<LearningCollection[]> {
  const { data, error } = await (supabase as any)
    .from("learning_collections").select("*").eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function createCollection(userId: string, title: string): Promise<LearningCollection> {
  const { data, error } = await (supabase as any)
    .from("learning_collections").insert({ user_id: userId, title }).select().single();
  if (error) throw error;
  return data;
}