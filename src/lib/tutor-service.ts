/**
 * AI Tutor System — service layer
 * ---------------------------------------------------------------
 * Foundation for StudySync AI's tutoring pillar. This module is the
 * single boundary between the UI and the Supabase tutor schema.
 *
 * Scope of this file:
 *   - Typed CRUD wrappers for tutor_sessions, tutor_messages,
 *     tutor_explanations, tutor_attachments, tutor_memory, tutor_events
 *   - Subject / chapter / topic / subtopic taxonomy helpers
 *   - Guided-flow descriptors ("I don't understand…", "Help me solve…")
 *   - Saved Explanations bridge (promotes a tutor explanation into the
 *     existing saved_explanations library)
 *   - Memory + analytics helpers (data shape only — no AI logic yet)
 *
 * Out of scope (intentionally deferred):
 *   - Streaming AI tutoring responses (chat route handles streaming)
 *   - Real memory ranking / embeddings
 *   - Multimodal processing (OCR / vision) — only the attachment row
 *     is recorded; processing pipeline lives in a future server fn
 *
 * Tables are user-scoped via RLS, so every helper takes a userId and
 * writes it explicitly. The browser supabase client is used so RLS is
 * enforced as the signed-in user.
 */
import { localDb as supabase } from "@/lib/local-db";

// Types are not yet in the generated `Database` typings, so we cast at
// the query boundary with `any`. Public types below stay strict.
const sb = supabase as any;

/* =========================================================================
 * Types
 * ========================================================================= */

export type TutorFlow = "concept" | "solve" | "formula" | "mistake" | "freeform";
export type TutorSessionStatus = "active" | "paused" | "completed" | "archived";
export type TutorMessageRole = "user" | "tutor" | "system";
export type TutorMessageKind =
  | "message" | "step" | "hint" | "question" | "answer" | "correction" | "summary";
export type ExplanationKind =
  | "step_by_step" | "concept" | "formula" | "example" | "mistake_correction";
export type AttachmentKind = "image" | "handwriting" | "worksheet" | "pdf" | "diagram";
export type MemoryKind =
  | "recent_topic" | "weak_area" | "learning_preference" | "explanation_preference";
export type TutorEventType =
  | "question_asked" | "subject_studied" | "topic_reviewed" | "explanation_saved"
  | "session_resumed" | "mistake_logged" | "hint_requested" | "step_completed";

export type Subject = {
  id: string; user_id: string; name: string; slug: string;
  color: string | null; icon: string | null; is_system: boolean;
  created_at: string; updated_at: string;
};
export type Chapter = {
  id: string; user_id: string; subject_id: string; name: string;
  position: number; created_at: string; updated_at: string;
};
export type Topic = {
  id: string; user_id: string; subject_id: string; chapter_id: string | null;
  name: string; difficulty: number; mastery: number; position: number;
  created_at: string; updated_at: string;
};
export type Subtopic = {
  id: string; user_id: string; topic_id: string; name: string;
  position: number; created_at: string; updated_at: string;
};

export type TutorSession = {
  id: string; user_id: string; title: string; question: string | null;
  subject_id: string | null; topic_id: string | null; subtopic_id: string | null;
  flow: TutorFlow; status: TutorSessionStatus; difficulty: number;
  progress: Record<string, unknown>; tags: string[];
  last_message_at: string | null; completed_at: string | null;
  created_at: string; updated_at: string;
};

export type TutorMessage = {
  id: string; user_id: string; session_id: string;
  role: TutorMessageRole; kind: TutorMessageKind;
  content: string; step_index: number | null;
  metadata: Record<string, unknown>; created_at: string;
};

export type ExplanationStep = { index: number; title?: string; body: string; hint?: string };

export type TutorExplanation = {
  id: string; user_id: string; session_id: string | null; topic_id: string | null;
  kind: ExplanationKind; title: string; summary: string | null;
  steps: ExplanationStep[]; examples: Array<{ title?: string; body: string }>;
  formula: string | null; mistake: string | null; correction: string | null;
  saved_explanation_id: string | null; is_saved: boolean;
  created_at: string; updated_at: string;
};

export type TutorAttachment = {
  id: string; user_id: string; session_id: string;
  kind: AttachmentKind; storage_path: string | null; source_url: string | null;
  ocr_text: string | null; processing_status: "pending" | "processing" | "ready" | "failed";
  metadata: Record<string, unknown>; created_at: string; updated_at: string;
};

export type TutorMemoryEntry = {
  id: string; user_id: string; kind: MemoryKind; key: string;
  value: Record<string, unknown>; weight: number; last_seen_at: string;
  created_at: string; updated_at: string;
};

/* =========================================================================
 * Guided Learning Flows
 * The UI presents these as primary entry points. Each maps to a `flow`
 * value on tutor_sessions and a default tutor prompt template that the
 * future AI handler can consume.
 * ========================================================================= */
export const TUTOR_FLOWS: Array<{
  id: TutorFlow;
  label: string;
  prompt: string;
  /** First reply the tutor should give to nudge the user step-by-step. */
  openingBeat: string;
}> = [
  { id: "concept", label: "I don't understand this concept",
    prompt: "Explain a concept I'm stuck on. Go slow.",
    openingBeat: "Tell me the concept in your own words first — even one line is fine." },
  { id: "solve",   label: "Help me solve this question",
    prompt: "Walk me through a problem step-by-step. Don't give the answer right away.",
    openingBeat: "Paste the question. I'll restate it and name the first move." },
  { id: "formula", label: "Explain this formula",
    prompt: "Break down a formula: what each symbol means and when to use it.",
    openingBeat: "Drop the formula. We'll go term by term." },
  { id: "mistake", label: "Where am I making a mistake?",
    prompt: "Look at my attempt and find the first thing that went wrong.",
    openingBeat: "Share your working. I'll point at the first slip — not all of them at once." },
  { id: "freeform", label: "Free chat",
    prompt: "Open conversation.", openingBeat: "I'm here. What's on your mind?" },
];

/* =========================================================================
 * Subjects / Chapters / Topics / Subtopics
 * ========================================================================= */
function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "subject";
}

export async function fetchSubjects(userId: string): Promise<Subject[]> {
  const { data, error } = await sb.from("subjects").select("*")
    .eq("user_id", userId).order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createSubject(userId: string, name: string, extras: Partial<Subject> = {}) {
  const { data, error } = await sb.from("subjects")
    .insert({ user_id: userId, name, slug: slugify(name),
      color: extras.color ?? null, icon: extras.icon ?? null })
    .select().single();
  if (error) throw error;
  return data as Subject;
}

export async function ensureSubject(userId: string, name: string) {
  const slug = slugify(name);
  const { data: existing } = await sb.from("subjects").select("*")
    .eq("user_id", userId).eq("slug", slug).maybeSingle();
  if (existing) return existing as Subject;
  return createSubject(userId, name);
}

export async function fetchChapters(userId: string, subjectId: string): Promise<Chapter[]> {
  const { data, error } = await sb.from("chapters").select("*")
    .eq("user_id", userId).eq("subject_id", subjectId).order("position");
  if (error) throw error;
  return data ?? [];
}

export async function fetchTopics(userId: string, subjectId?: string): Promise<Topic[]> {
  let q = sb.from("topics").select("*").eq("user_id", userId);
  if (subjectId) q = q.eq("subject_id", subjectId);
  const { data, error } = await q.order("position");
  if (error) throw error;
  return data ?? [];
}

export async function fetchSubtopics(userId: string, topicId: string): Promise<Subtopic[]> {
  const { data, error } = await sb.from("subtopics").select("*")
    .eq("user_id", userId).eq("topic_id", topicId).order("position");
  if (error) throw error;
  return data ?? [];
}

/* =========================================================================
 * Tutor Sessions
 * Sessions are resumable: a session is just an `active`/`paused` row that
 * can be re-opened later. Completing a session sets `completed_at`.
 * ========================================================================= */
export type CreateSessionInput = {
  question?: string;
  flow?: TutorFlow;
  subjectId?: string | null;
  topicId?: string | null;
  subtopicId?: string | null;
  title?: string;
  difficulty?: number;
  tags?: string[];
};

export async function createTutorSession(userId: string, input: CreateSessionInput = {}) {
  const flow = input.flow ?? "concept";
  const title = input.title ?? input.question?.slice(0, 80) ?? TUTOR_FLOWS.find((f) => f.id === flow)!.label;
  const { data, error } = await sb.from("tutor_sessions")
    .insert({
      user_id: userId, title, question: input.question ?? null,
      subject_id: input.subjectId ?? null, topic_id: input.topicId ?? null,
      subtopic_id: input.subtopicId ?? null, flow, status: "active",
      difficulty: input.difficulty ?? 1, tags: input.tags ?? [],
    })
    .select().single();
  if (error) throw error;
  await logTutorEvent(userId, "question_asked", { sessionId: data.id, flow });
  return data as TutorSession;
}

export async function fetchTutorSessions(userId: string, opts: { status?: TutorSessionStatus; limit?: number } = {}) {
  let q = sb.from("tutor_sessions").select("*").eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (opts.status) q = q.eq("status", opts.status);
  if (opts.limit)  q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as TutorSession[];
}

export async function fetchTutorSession(sessionId: string) {
  const { data, error } = await sb.from("tutor_sessions").select("*").eq("id", sessionId).single();
  if (error) throw error;
  return data as TutorSession;
}

export async function updateTutorSession(sessionId: string, patch: Partial<Pick<TutorSession,
  "title" | "status" | "progress" | "tags" | "difficulty" | "subject_id" | "topic_id" | "subtopic_id" | "completed_at">>) {
  const { error } = await sb.from("tutor_sessions").update(patch).eq("id", sessionId);
  if (error) throw error;
}

export async function resumeTutorSession(userId: string, sessionId: string) {
  await updateTutorSession(sessionId, { status: "active" });
  await logTutorEvent(userId, "session_resumed", { sessionId });
}

export async function completeTutorSession(userId: string, sessionId: string) {
  await updateTutorSession(sessionId, { status: "completed", completed_at: new Date().toISOString() });
  await logTutorEvent(userId, "topic_reviewed", { sessionId });
}

export async function deleteTutorSession(sessionId: string) {
  const { error } = await sb.from("tutor_sessions").delete().eq("id", sessionId);
  if (error) throw error;
}

/* =========================================================================
 * Tutor Messages (conversation + explanation history)
 * ========================================================================= */
export async function fetchTutorMessages(sessionId: string): Promise<TutorMessage[]> {
  const { data, error } = await sb.from("tutor_messages").select("*")
    .eq("session_id", sessionId).order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function appendTutorMessage(userId: string, sessionId: string, msg: {
  role: TutorMessageRole; content: string; kind?: TutorMessageKind;
  stepIndex?: number; metadata?: Record<string, unknown>;
}) {
  const { data, error } = await sb.from("tutor_messages")
    .insert({
      user_id: userId, session_id: sessionId, role: msg.role,
      kind: msg.kind ?? "message", content: msg.content,
      step_index: msg.stepIndex ?? null, metadata: msg.metadata ?? {},
    })
    .select().single();
  if (error) throw error;
  // touch parent session's last_message_at
  await sb.from("tutor_sessions").update({ last_message_at: new Date().toISOString() }).eq("id", sessionId);
  return data as TutorMessage;
}

/* =========================================================================
 * Explanation Engine
 * Structured explanations are stored independently of free-text messages
 * so the UI can render them as cards, save them, or replay step-by-step.
 * Future AI handler fills in the `steps` / `examples` / `formula` fields.
 * ========================================================================= */
export type CreateExplanationInput = {
  sessionId?: string | null; topicId?: string | null;
  kind: ExplanationKind; title?: string; summary?: string;
  steps?: ExplanationStep[]; examples?: Array<{ title?: string; body: string }>;
  formula?: string; mistake?: string; correction?: string;
};

export async function createExplanation(userId: string, input: CreateExplanationInput) {
  const { data, error } = await sb.from("tutor_explanations")
    .insert({
      user_id: userId, session_id: input.sessionId ?? null, topic_id: input.topicId ?? null,
      kind: input.kind, title: input.title ?? "Explanation", summary: input.summary ?? null,
      steps: input.steps ?? [], examples: input.examples ?? [],
      formula: input.formula ?? null, mistake: input.mistake ?? null,
      correction: input.correction ?? null,
    })
    .select().single();
  if (error) throw error;
  return data as TutorExplanation;
}

export async function fetchExplanationsForSession(sessionId: string) {
  const { data, error } = await sb.from("tutor_explanations").select("*")
    .eq("session_id", sessionId).order("created_at");
  if (error) throw error;
  return (data ?? []) as TutorExplanation[];
}

/**
 * Promotes a tutor explanation into the existing saved_explanations
 * library so users can favorite / organize / search it alongside other
 * saved content. Idempotent — if already saved, returns the linked id.
 */
export async function saveExplanationToLibrary(userId: string, explanationId: string, opts: {
  folder?: string; tags?: string[]; favorite?: boolean;
} = {}) {
  const { data: exp, error: e1 } = await sb.from("tutor_explanations")
    .select("*").eq("id", explanationId).single();
  if (e1) throw e1;
  if (exp.saved_explanation_id && exp.is_saved) return exp.saved_explanation_id as string;

  const content = renderExplanationToMarkdown(exp as TutorExplanation);
  const { data: saved, error: e2 } = await sb.from("saved_explanations")
    .insert({
      user_id: userId, title: exp.title, content,
      source_question: null, folder: opts.folder ?? null,
      tags: opts.tags ?? [], favorite: opts.favorite ?? false,
    })
    .select().single();
  if (e2) throw e2;

  await sb.from("tutor_explanations")
    .update({ saved_explanation_id: saved.id, is_saved: true })
    .eq("id", explanationId);
  await logTutorEvent(userId, "explanation_saved", { explanationId, savedId: saved.id });
  return saved.id as string;
}

function renderExplanationToMarkdown(exp: TutorExplanation): string {
  const parts: string[] = [];
  if (exp.summary) parts.push(exp.summary);
  if (exp.formula) parts.push(`**Formula:** \`${exp.formula}\``);
  if (exp.steps?.length) {
    parts.push("**Steps:**");
    exp.steps.forEach((s, i) => parts.push(`${i + 1}. ${s.title ? `**${s.title}** — ` : ""}${s.body}`));
  }
  if (exp.examples?.length) {
    parts.push("**Examples:**");
    exp.examples.forEach((ex) => parts.push(`- ${ex.title ? `*${ex.title}* — ` : ""}${ex.body}`));
  }
  if (exp.mistake)    parts.push(`**Mistake:** ${exp.mistake}`);
  if (exp.correction) parts.push(`**Correction:** ${exp.correction}`);
  return parts.join("\n\n");
}

/* =========================================================================
 * Multimodal attachments (placeholder workflow)
 * Record-only for now. A future server fn will read pending rows,
 * run OCR / vision, and update `ocr_text` + `processing_status`.
 * ========================================================================= */
export async function registerAttachment(userId: string, sessionId: string, input: {
  kind: AttachmentKind; storagePath?: string; sourceUrl?: string;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await sb.from("tutor_attachments")
    .insert({
      user_id: userId, session_id: sessionId, kind: input.kind,
      storage_path: input.storagePath ?? null, source_url: input.sourceUrl ?? null,
      metadata: input.metadata ?? {}, processing_status: "pending",
    })
    .select().single();
  if (error) throw error;
  return data as TutorAttachment;
}

/* =========================================================================
 * Tutor Memory (foundation only — no ranking / embeddings yet)
 * Upsert-style helpers. Reading code can use these to gather light
 * context for the AI prompt (e.g. "Recent topics: …").
 * ========================================================================= */
export async function rememberTutorFact(userId: string, kind: MemoryKind, key: string, value: Record<string, unknown> = {}, weight = 1) {
  const { error } = await sb.from("tutor_memory")
    .upsert({
      user_id: userId, kind, key, value, weight,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "user_id,kind,key" });
  if (error) throw error;
}

export async function fetchTutorMemory(userId: string, kind?: MemoryKind, limit = 50) {
  let q = sb.from("tutor_memory").select("*").eq("user_id", userId)
    .order("last_seen_at", { ascending: false }).limit(limit);
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as TutorMemoryEntry[];
}

/* =========================================================================
 * Analytics events
 * Append-only. Future analytics dashboards aggregate over this stream
 * (questions asked, subjects studied, topics reviewed, saves, patterns).
 * ========================================================================= */
export async function logTutorEvent(
  userId: string, eventType: TutorEventType, payload: Record<string, unknown> = {},
) {
  const { error } = await sb.from("tutor_events").insert({
    user_id: userId, event_type: eventType, payload,
    session_id: (payload as any).sessionId ?? null,
    subject_id: (payload as any).subjectId ?? null,
    topic_id:   (payload as any).topicId   ?? null,
  });
  if (error) {
    // Analytics must never break the user flow — log and swallow.
    // eslint-disable-next-line no-console
    console.warn("[tutor-events] failed:", error.message);
  }
}