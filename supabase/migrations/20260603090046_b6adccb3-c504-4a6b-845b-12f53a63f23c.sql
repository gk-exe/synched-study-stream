
-- Notes
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled',
  content text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY notes_select_own ON public.notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY notes_insert_own ON public.notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY notes_update_own ON public.notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY notes_delete_own ON public.notes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_notes_user ON public.notes(user_id, updated_at DESC);
CREATE INDEX idx_notes_tags ON public.notes USING GIN(tags);
CREATE TRIGGER notes_touch BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- PDFs
CREATE TABLE public.pdfs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  filename text NOT NULL,
  storage_path text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  page_count integer,
  tags text[] NOT NULL DEFAULT '{}',
  processing_status text NOT NULL DEFAULT 'pending',
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdfs TO authenticated;
GRANT ALL ON public.pdfs TO service_role;
ALTER TABLE public.pdfs ENABLE ROW LEVEL SECURITY;
CREATE POLICY pdfs_select_own ON public.pdfs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY pdfs_insert_own ON public.pdfs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY pdfs_update_own ON public.pdfs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY pdfs_delete_own ON public.pdfs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_pdfs_user ON public.pdfs(user_id, updated_at DESC);
CREATE TRIGGER pdfs_touch BEFORE UPDATE ON public.pdfs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Flashcard decks
CREATE TABLE public.flashcard_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  source text NOT NULL DEFAULT 'manual',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcard_decks TO authenticated;
GRANT ALL ON public.flashcard_decks TO service_role;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY decks_select_own ON public.flashcard_decks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY decks_insert_own ON public.flashcard_decks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY decks_update_own ON public.flashcard_decks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY decks_delete_own ON public.flashcard_decks FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER decks_touch BEFORE UPDATE ON public.flashcard_decks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Flashcards
CREATE TABLE public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  deck_id uuid NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  ease real NOT NULL DEFAULT 2.5,
  interval_days integer NOT NULL DEFAULT 0,
  repetitions integer NOT NULL DEFAULT 0,
  due_at timestamptz NOT NULL DEFAULT now(),
  last_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards TO authenticated;
GRANT ALL ON public.flashcards TO service_role;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY cards_select_own ON public.flashcards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY cards_insert_own ON public.flashcards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY cards_update_own ON public.flashcards FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY cards_delete_own ON public.flashcards FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_cards_due ON public.flashcards(user_id, due_at);
CREATE INDEX idx_cards_deck ON public.flashcards(deck_id);
CREATE TRIGGER cards_touch BEFORE UPDATE ON public.flashcards FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Quizzes
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  source text NOT NULL DEFAULT 'manual',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY quizzes_select_own ON public.quizzes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY quizzes_insert_own ON public.quizzes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY quizzes_update_own ON public.quizzes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY quizzes_delete_own ON public.quizzes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER quizzes_touch BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Quiz questions
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  choices jsonb NOT NULL DEFAULT '[]'::jsonb,
  answer text NOT NULL,
  explanation text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY qq_select_own ON public.quiz_questions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY qq_insert_own ON public.quiz_questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY qq_update_own ON public.quiz_questions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY qq_delete_own ON public.quiz_questions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_qq_quiz ON public.quiz_questions(quiz_id, position);

-- Quiz sessions
CREATE TABLE public.quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_sessions TO authenticated;
GRANT ALL ON public.quiz_sessions TO service_role;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY qs_select_own ON public.quiz_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY qs_insert_own ON public.quiz_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY qs_update_own ON public.quiz_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY qs_delete_own ON public.quiz_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_qs_user ON public.quiz_sessions(user_id, started_at DESC);

-- Saved explanations from tutor
CREATE TABLE public.saved_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Saved explanation',
  content text NOT NULL,
  source_question text,
  folder text,
  tags text[] NOT NULL DEFAULT '{}',
  favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_explanations TO authenticated;
GRANT ALL ON public.saved_explanations TO service_role;
ALTER TABLE public.saved_explanations ENABLE ROW LEVEL SECURITY;
CREATE POLICY exp_select_own ON public.saved_explanations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY exp_insert_own ON public.saved_explanations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY exp_update_own ON public.saved_explanations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY exp_delete_own ON public.saved_explanations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_exp_user ON public.saved_explanations(user_id, updated_at DESC);
CREATE TRIGGER exp_touch BEFORE UPDATE ON public.saved_explanations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Learning collections (groups of mixed items)
CREATE TABLE public.learning_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_collections TO authenticated;
GRANT ALL ON public.learning_collections TO service_role;
ALTER TABLE public.learning_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY col_select_own ON public.learning_collections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY col_insert_own ON public.learning_collections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY col_update_own ON public.learning_collections FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY col_delete_own ON public.learning_collections FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER col_touch BEFORE UPDATE ON public.learning_collections FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Collection items (polymorphic by item_type + item_id)
CREATE TABLE public.collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  collection_id uuid NOT NULL REFERENCES public.learning_collections(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (collection_id, item_type, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_items TO authenticated;
GRANT ALL ON public.collection_items TO service_role;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY ci_select_own ON public.collection_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ci_insert_own ON public.collection_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY ci_update_own ON public.collection_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY ci_delete_own ON public.collection_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_ci_collection ON public.collection_items(collection_id, position);
