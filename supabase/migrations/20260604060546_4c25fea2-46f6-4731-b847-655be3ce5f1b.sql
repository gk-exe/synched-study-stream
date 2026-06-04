
-- =====================================================================
-- COMPANION SYSTEM FOUNDATION
-- ---------------------------------------------------------------------
-- Architecture notes:
--   - `companion_catalog` and `companion_items` are global blueprints.
--     They are readable by every authenticated user; writes are
--     restricted to service_role (managed via seeded data / admin).
--   - `companions` represents an instance of a catalog entry owned by
--     a specific user. A user can own many; exactly one should be
--     `is_active` at a time (enforced by partial unique index).
--   - Progression: `level` + `experience` on companions. XP is granted
--     through study sessions / streaks via service-layer helpers in
--     `src/lib/companion-service.ts`. `companion_milestones` logs each
--     milestone for replay / analytics / future achievement UI.
--   - Inventory: `companion_items` is the catalog; `companion_inventory`
--     is the user-owned join (with equipped + equipped_on companion).
--   - Mood: `companion_reactions` is an append-only event stream of
--     emotional reactions. The "current mood" lives on companions.mood
--     and is updated by the service layer in response to user activity.
--   - Future generation: `companion_concepts` holds inspiration uploads
--     and generated concept metadata. Image generation itself is NOT
--     implemented yet — this table is the placeholder workflow surface.
-- =====================================================================

-- ---------- 1. Catalog: companion blueprints --------------------------
CREATE TABLE public.companion_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  species text NOT NULL DEFAULT 'orb',           -- orb | creature | spirit | custom
  rarity text NOT NULL DEFAULT 'common',         -- common | rare | epic | legendary
  description text,
  base_theme_id text NOT NULL DEFAULT 'aurora',  -- references companion-themes registry
  unlock_cost integer NOT NULL DEFAULT 0,        -- coins; 0 = free / starter
  is_starter boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.companion_catalog TO authenticated;
GRANT ALL ON public.companion_catalog TO service_role;

ALTER TABLE public.companion_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can view companion catalog"
  ON public.companion_catalog FOR SELECT TO authenticated USING (true);

CREATE TRIGGER companion_catalog_touch
  BEFORE UPDATE ON public.companion_catalog
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ---------- 2. User-owned companion instances ------------------------
CREATE TABLE public.companions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  catalog_id uuid NOT NULL REFERENCES public.companion_catalog(id) ON DELETE RESTRICT,
  nickname text,
  level integer NOT NULL DEFAULT 1,
  experience integer NOT NULL DEFAULT 0,                  -- total XP accumulated
  experience_to_next integer NOT NULL DEFAULT 100,        -- cached threshold for current level
  mood text NOT NULL DEFAULT 'calm',                      -- calm | happy | focused | anxious | tired | excited
  is_active boolean NOT NULL DEFAULT false,
  customization jsonb NOT NULL DEFAULT '{}'::jsonb,       -- equipped theme/accessory snapshot
  unlocked_via text NOT NULL DEFAULT 'starter',           -- starter | coins | milestone | generated
  last_interacted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companions TO authenticated;
GRANT ALL ON public.companions TO service_role;

ALTER TABLE public.companions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companions_select_own" ON public.companions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "companions_insert_own" ON public.companions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "companions_update_own" ON public.companions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "companions_delete_own" ON public.companions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Only one active companion per user at a time.
CREATE UNIQUE INDEX companions_one_active_per_user
  ON public.companions(user_id) WHERE is_active;

CREATE INDEX companions_user_idx ON public.companions(user_id);

CREATE TRIGGER companions_touch
  BEFORE UPDATE ON public.companions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ---------- 3. Item catalog (themes / accessories / rewards) ---------
CREATE TABLE public.companion_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  kind text NOT NULL,                            -- theme | accessory | appearance | reward
  name text NOT NULL,
  description text,
  rarity text NOT NULL DEFAULT 'common',
  cost_coins integer NOT NULL DEFAULT 0,
  unlock_rule jsonb NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"streak": 7} | {"level": 5}
  preview jsonb NOT NULL DEFAULT '{}'::jsonb,     -- colors / image refs for renderer
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.companion_items TO authenticated;
GRANT ALL ON public.companion_items TO service_role;

ALTER TABLE public.companion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can view companion items"
  ON public.companion_items FOR SELECT TO authenticated USING (true);


-- ---------- 4. User-owned inventory ----------------------------------
CREATE TABLE public.companion_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.companion_items(id) ON DELETE CASCADE,
  equipped_on uuid REFERENCES public.companions(id) ON DELETE SET NULL,
  is_equipped boolean NOT NULL DEFAULT false,
  acquired_via text NOT NULL DEFAULT 'coins',    -- coins | milestone | starter | gift
  acquired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companion_inventory TO authenticated;
GRANT ALL ON public.companion_inventory TO service_role;

ALTER TABLE public.companion_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_select_own" ON public.companion_inventory
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "inv_insert_own" ON public.companion_inventory
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "inv_update_own" ON public.companion_inventory
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "inv_delete_own" ON public.companion_inventory
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- ---------- 5. Milestone log ----------------------------------------
CREATE TABLE public.companion_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  companion_id uuid REFERENCES public.companions(id) ON DELETE SET NULL,
  kind text NOT NULL,                            -- streak | sessions | level | unlock | custom
  threshold integer,                             -- e.g. streak=7, sessions=50, level=5
  reward jsonb NOT NULL DEFAULT '{}'::jsonb,     -- {coins?, item_id?, theme_id?}
  acknowledged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companion_milestones TO authenticated;
GRANT ALL ON public.companion_milestones TO service_role;

ALTER TABLE public.companion_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ms_select_own" ON public.companion_milestones
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ms_insert_own" ON public.companion_milestones
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ms_update_own" ON public.companion_milestones
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ms_delete_own" ON public.companion_milestones
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX companion_milestones_user_idx ON public.companion_milestones(user_id, created_at DESC);


-- ---------- 6. Mood / reaction event stream --------------------------
CREATE TABLE public.companion_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  companion_id uuid REFERENCES public.companions(id) ON DELETE SET NULL,
  trigger text NOT NULL,                         -- session_start | session_end | milestone | mood_log | idle | break_overuse
  mood text NOT NULL,                            -- emotional state at the time
  style text NOT NULL DEFAULT 'supportive',      -- supportive | playful | quiet | celebratory | grounding
  intensity smallint NOT NULL DEFAULT 1,         -- 1..5
  message text,                                  -- optional canned/generated line
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.companion_reactions TO authenticated;
GRANT ALL ON public.companion_reactions TO service_role;

ALTER TABLE public.companion_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rx_select_own" ON public.companion_reactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "rx_insert_own" ON public.companion_reactions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rx_delete_own" ON public.companion_reactions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX companion_reactions_user_idx
  ON public.companion_reactions(user_id, created_at DESC);


-- ---------- 7. Future generation: inspiration + concepts -------------
-- Placeholder workflow surface. No generation runs yet — rows here
-- represent user intent, uploads, and (eventually) generated previews.
CREATE TABLE public.companion_concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prompt text,
  inspiration_paths text[] NOT NULL DEFAULT '{}'::text[], -- storage paths
  generated_asset_path text,                              -- filled when generation is implemented
  palette jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',                   -- draft | queued | generating | ready | failed | adopted
  adopted_companion_id uuid REFERENCES public.companions(id) ON DELETE SET NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companion_concepts TO authenticated;
GRANT ALL ON public.companion_concepts TO service_role;

ALTER TABLE public.companion_concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cc_select_own" ON public.companion_concepts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "cc_insert_own" ON public.companion_concepts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cc_update_own" ON public.companion_concepts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "cc_delete_own" ON public.companion_concepts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER companion_concepts_touch
  BEFORE UPDATE ON public.companion_concepts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ---------- 8. Seed catalog -----------------------------------------
INSERT INTO public.companion_catalog (slug, name, species, rarity, description, base_theme_id, unlock_cost, is_starter)
VALUES
  ('sync',  'Sync',  'orb',     'common', 'Your calm everyday study companion.',          'aurora', 0,   true),
  ('lumi',  'Lumi',  'spirit',  'rare',   'A warmer, encouraging presence for long days.', 'ember',  150, false),
  ('nova',  'Nova',  'creature','epic',   'A focused, high-energy companion for sprints.', 'ocean',  300, false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.companion_items (slug, kind, name, description, rarity, cost_coins, unlock_rule, preview)
VALUES
  ('theme-aurora',   'theme',      'Aurora',     'Soft violet aurora glow.',         'common', 0,   '{}'::jsonb, '{"accent":"oklch(0.72 0.18 290)"}'::jsonb),
  ('theme-ocean',    'theme',      'Ocean',      'Cool deep-water gradient.',        'rare',   80,  '{}'::jsonb, '{"accent":"oklch(0.7 0.15 220)"}'::jsonb),
  ('theme-ember',    'theme',      'Ember',      'Warm late-night ember tone.',      'rare',   80,  '{}'::jsonb, '{"accent":"oklch(0.7 0.18 40)"}'::jsonb),
  ('halo-soft',      'accessory',  'Soft Halo',  'A gentle ring around your orb.',   'common', 50,  '{}'::jsonb, '{"effect":"halo"}'::jsonb),
  ('crown-streak7',  'accessory',  'Streak Crown', 'Earned at a 7-day streak.',      'epic',   0,   '{"streak":7}'::jsonb, '{"effect":"crown"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;
