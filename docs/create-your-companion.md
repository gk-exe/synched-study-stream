# Create your companion

Premium personalization flow that lets a user render a one-of-one study companion
and make it the app-wide face of Sync.

## Flow

1. **Unlock** — costs `CREATOR_UNLOCK_COST` (500) coins, tracked in
   `user_stats.unlocked_features` via `usePomodoro().unlockFeature`.
2. **Inspiration** — optional image uploaded to the private `companion-assets`
   bucket under `<user-id>/references/`.
3. **Style** — one of `COMPANION_STYLES` (`src/lib/companion-styles.ts`); each
   style carries a prompt fragment so every render shares one visual language.
4. **Describe** — free-text name + vibe.
5. **Generate** — `POST /api/companion-image` streams from the Lovable AI image
   model; `streamImage` surfaces partial frames (blurred) until the final render.
6. **Adopt** — the render is stored at `<user-id>/renders/<concept-id>.png` and
   the concept row gets `adopted_at`. Only one concept is adopted at a time.

## Data

- `companion_concepts`: `name`, `style`, `prompt`, `reference_path`,
  `generated_asset_path`, `status` (`generating` | `ready` | `failed` | `adopted`),
  `adopted_at`, `error`.
- `user_stats.unlocked_features`: coin-gated feature keys.
- Storage: private `companion-assets` bucket, per-user folder RLS.

## Rendering everywhere

`CustomCompanionProvider` (mounted in `__root.tsx`) resolves a signed URL for the
adopted render. `CompanionOrb` reads that context by default, so dashboard, focus
mode, chat and the floating presence all switch faces at once. Pass
`useCustom={false}` to force the default Sync robot (style pickers, upsells).
