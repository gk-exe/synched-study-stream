/**
 * Visual style presets for the "Create your companion" flow.
 *
 * Each style is a prompt fragment plus a small palette used for the
 * placeholder orb while the real render is generating. Keeping the
 * prompt fragments here (not in the UI) means the creator flow, the
 * server route, and any future re-render job all speak the same
 * visual language.
 */
export type CompanionStyleId =
  | "mini-robot"
  | "soft-creature"
  | "celestial"
  | "paper-craft"
  | "pixel"
  | "aura";

export interface CompanionStyle {
  id: CompanionStyleId;
  name: string;
  blurb: string;
  /** Appended to the user's description when generating. */
  prompt: string;
  accent: string;
}

export const COMPANION_STYLES: CompanionStyle[] = [
  {
    id: "mini-robot",
    name: "Mini robot",
    blurb: "Sync's family — rounded chassis, glowing eyes, tiny antenna.",
    prompt:
      "a cute rounded mini study robot with soft glowing eyes, a small antenna and headphone-like ear bumps, friendly and calm",
    accent: "oklch(0.72 0.16 265)",
  },
  {
    id: "soft-creature",
    name: "Soft creature",
    blurb: "A gentle plush-like study buddy with big calm eyes.",
    prompt:
      "a gentle plush-like creature companion with big calm eyes, soft rounded fur shapes, warm and comforting",
    accent: "oklch(0.78 0.13 40)",
  },
  {
    id: "celestial",
    name: "Celestial",
    blurb: "Stardust, moonlight and a quiet cosmic glow.",
    prompt:
      "a small celestial spirit companion made of soft starlight and moon glow, drifting stardust, serene",
    accent: "oklch(0.75 0.14 300)",
  },
  {
    id: "paper-craft",
    name: "Paper craft",
    blurb: "Folded-paper charm with soft studio lighting.",
    prompt:
      "a folded paper-craft origami style companion character, clean pastel paper layers, soft studio lighting",
    accent: "oklch(0.8 0.09 150)",
  },
  {
    id: "pixel",
    name: "Pixel",
    blurb: "Cozy retro sprite energy, softened for late nights.",
    prompt:
      "a cozy retro pixel-art sprite companion character, chunky soft pixels, gentle glow, lo-fi study vibe",
    accent: "oklch(0.74 0.15 200)",
  },
  {
    id: "aura",
    name: "Pure aura",
    blurb: "No body — just a breathing orb of light.",
    prompt:
      "an abstract breathing orb of soft light and gradient mist, no face, calm ambient energy",
    accent: "oklch(0.76 0.12 250)",
  },
];

export function getStyle(id?: string | null): CompanionStyle {
  return COMPANION_STYLES.find((s) => s.id === id) ?? COMPANION_STYLES[0]!;
}

/** Builds the full image prompt for a concept. */
export function buildCompanionPrompt(styleId: string, description: string) {
  const style = getStyle(styleId);
  const extra = description.trim();
  return [
    `Character portrait of ${style.prompt}.`,
    extra ? `The companion should feel like: ${extra}.` : "",
    "Centered single character, head and shoulders, simple soft gradient background,",
    "premium minimal glassmorphism aesthetic, soft ambient glow, calming color palette,",
    "no text, no watermark, high detail, square composition.",
  ]
    .filter(Boolean)
    .join(" ");
}