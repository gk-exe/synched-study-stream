
ALTER TABLE public.user_stats
  ADD COLUMN IF NOT EXISTS momentum_score integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS companion_theme text NOT NULL DEFAULT 'aurora',
  ADD COLUMN IF NOT EXISTS unlocked_themes text[] NOT NULL DEFAULT ARRAY['aurora']::text[],
  ADD COLUMN IF NOT EXISTS current_task text,
  ADD COLUMN IF NOT EXISTS long_breaks_today integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_break_date date;
