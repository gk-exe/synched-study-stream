ALTER TABLE public.companion_concepts
  ADD COLUMN IF NOT EXISTS style text NOT NULL DEFAULT 'mini-robot',
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS reference_path text,
  ADD COLUMN IF NOT EXISTS preview_url text,
  ADD COLUMN IF NOT EXISTS variations jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS adopted_at timestamptz;

CREATE INDEX IF NOT EXISTS companion_concepts_user_adopted_idx
  ON public.companion_concepts (user_id, adopted_at DESC);

ALTER TABLE public.user_stats
  ADD COLUMN IF NOT EXISTS unlocked_features text[] NOT NULL DEFAULT '{}'::text[];