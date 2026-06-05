
-- =========================================================================
-- AI Tutor System Foundation
-- Scaffolds tutoring sessions, explanation engine, subject taxonomy,
-- memory, multimodal placeholders, and analytics events.
-- All tables are user-scoped via RLS. No advanced AI logic — structure only.
-- =========================================================================

-- ---------- shared updated_at trigger reused from project ----------
-- (public.touch_updated_at already exists)

-- ============== SUBJECT TAXONOMY ==============
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  color text,
  icon text,
  is_system boolean NOT NULL DEFAULT false, -- reserved for future shared catalog
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY subjects_select_own ON public.subjects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY subjects_insert_own ON public.subjects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY subjects_update_own ON public.subjects FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY subjects_delete_own ON public.subjects FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER subjects_touch BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapters TO authenticated;
GRANT ALL ON public.chapters TO service_role;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY chapters_select_own ON public.chapters FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY chapters_insert_own ON public.chapters FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY chapters_update_own ON public.chapters FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY chapters_delete_own ON public.chapters FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER chapters_touch BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE SET NULL,
  name text NOT NULL,
  difficulty smallint NOT NULL DEFAULT 1, -- 1..5
  mastery smallint NOT NULL DEFAULT 0,    -- 0..100, future use
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topics TO authenticated;
GRANT ALL ON public.topics TO service_role;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY topics_select_own ON public.topics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY topics_insert_own ON public.topics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY topics_update_own ON public.topics FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY topics_delete_own ON public.topics FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER topics_touch BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.subtopics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  name text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subtopics TO authenticated;
GRANT ALL ON public.subtopics TO service_role;
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;
CREATE POLICY subtopics_select_own ON public.subtopics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY subtopics_insert_own ON public.subtopics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY subtopics_update_own ON public.subtopics FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY subtopics_delete_own ON public.subtopics FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER subtopics_touch BEFORE UPDATE ON public.subtopics FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============== TUTOR SESSIONS ==============
-- One tutoring conversation. Resumable: users can re-open and continue.
CREATE TABLE public.tutor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New tutoring session',
  question text,                    -- original question / prompt
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  subtopic_id uuid REFERENCES public.subtopics(id) ON DELETE SET NULL,
  flow text NOT NULL DEFAULT 'concept',
    -- 'concept' | 'solve' | 'formula' | 'mistake' | 'freeform'
  status text NOT NULL DEFAULT 'active',
    -- 'active' | 'paused' | 'completed' | 'archived'
  difficulty smallint NOT NULL DEFAULT 1,
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,  -- {step, totalSteps, hints, ...}
  tags text[] NOT NULL DEFAULT '{}',
  last_message_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_sessions TO authenticated;
GRANT ALL ON public.tutor_sessions TO service_role;
ALTER TABLE public.tutor_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ts_select_own ON public.tutor_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ts_insert_own ON public.tutor_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ts_update_own ON public.tutor_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ts_delete_own ON public.tutor_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER tutor_sessions_touch BEFORE UPDATE ON public.tutor_sessions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX tutor_sessions_user_updated_idx ON public.tutor_sessions (user_id, updated_at DESC);

-- ============== TUTOR MESSAGES ==============
-- Append-only conversation + explanation history for a session.
CREATE TABLE public.tutor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NOT NULL REFERENCES public.tutor_sessions(id) ON DELETE CASCADE,
  role text NOT NULL,        -- 'user' | 'tutor' | 'system'
  kind text NOT NULL DEFAULT 'message',
    -- 'message' | 'step' | 'hint' | 'question' | 'answer' | 'correction' | 'summary'
  content text NOT NULL,
  step_index integer,        -- for step-by-step explanations
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_messages TO authenticated;
GRANT ALL ON public.tutor_messages TO service_role;
ALTER TABLE public.tutor_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tm_select_own ON public.tutor_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY tm_insert_own ON public.tutor_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY tm_update_own ON public.tutor_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY tm_delete_own ON public.tutor_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX tutor_messages_session_idx ON public.tutor_messages (session_id, created_at);

-- ============== EXPLANATION ENGINE ==============
-- Structured explanations produced during a session. Optionally promoted
-- into the existing saved_explanations library.
CREATE TABLE public.tutor_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.tutor_sessions(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  kind text NOT NULL,
    -- 'step_by_step' | 'concept' | 'formula' | 'example' | 'mistake_correction'
  title text NOT NULL DEFAULT 'Explanation',
  summary text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{index, title, body, hint?}]
  examples jsonb NOT NULL DEFAULT '[]'::jsonb,
  formula text,
  mistake text,
  correction text,
  saved_explanation_id uuid REFERENCES public.saved_explanations(id) ON DELETE SET NULL,
  is_saved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_explanations TO authenticated;
GRANT ALL ON public.tutor_explanations TO service_role;
ALTER TABLE public.tutor_explanations ENABLE ROW LEVEL SECURITY;
CREATE POLICY te_select_own ON public.tutor_explanations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY te_insert_own ON public.tutor_explanations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY te_update_own ON public.tutor_explanations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY te_delete_own ON public.tutor_explanations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER tutor_explanations_touch BEFORE UPDATE ON public.tutor_explanations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX tutor_explanations_user_idx ON public.tutor_explanations (user_id, updated_at DESC);

-- ============== MULTIMODAL ATTACHMENTS (placeholder) ==============
CREATE TABLE public.tutor_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NOT NULL REFERENCES public.tutor_sessions(id) ON DELETE CASCADE,
  kind text NOT NULL,
    -- 'image' | 'handwriting' | 'worksheet' | 'pdf' | 'diagram'
  storage_path text,
  source_url text,
  ocr_text text,
  processing_status text NOT NULL DEFAULT 'pending',
    -- 'pending' | 'processing' | 'ready' | 'failed'
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_attachments TO authenticated;
GRANT ALL ON public.tutor_attachments TO service_role;
ALTER TABLE public.tutor_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY ta_select_own ON public.tutor_attachments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ta_insert_own ON public.tutor_attachments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ta_update_own ON public.tutor_attachments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ta_delete_own ON public.tutor_attachments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER tutor_attachments_touch BEFORE UPDATE ON public.tutor_attachments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============== TUTOR MEMORY (foundation only) ==============
-- Generic key/value memory entries. Future AI memory features build on this.
CREATE TABLE public.tutor_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
    -- 'recent_topic' | 'weak_area' | 'learning_preference' | 'explanation_preference'
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  weight real NOT NULL DEFAULT 1.0, -- recency / importance score
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_memory TO authenticated;
GRANT ALL ON public.tutor_memory TO service_role;
ALTER TABLE public.tutor_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY tmem_select_own ON public.tutor_memory FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY tmem_insert_own ON public.tutor_memory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY tmem_update_own ON public.tutor_memory FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY tmem_delete_own ON public.tutor_memory FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER tutor_memory_touch BEFORE UPDATE ON public.tutor_memory FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============== TUTOR ANALYTICS EVENTS ==============
-- Append-only feed of tutoring activity for future analytics dashboards.
CREATE TABLE public.tutor_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.tutor_sessions(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  event_type text NOT NULL,
    -- 'question_asked' | 'subject_studied' | 'topic_reviewed'
    -- | 'explanation_saved' | 'session_resumed' | 'mistake_logged'
    -- | 'hint_requested' | 'step_completed'
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_events TO authenticated;
GRANT ALL ON public.tutor_events TO service_role;
ALTER TABLE public.tutor_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tev_select_own ON public.tutor_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY tev_insert_own ON public.tutor_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY tev_delete_own ON public.tutor_events FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX tutor_events_user_idx ON public.tutor_events (user_id, created_at DESC);
