export type CompanionTheme = {
  id: string;
  name: string;
  description: string;
  cost: number; // coins to unlock; 0 = free
  /** Inner orb body gradient (oklch) */
  body: string;
  /** Outer halo gradient */
  halo: string;
  /** Accent token for rings, focus chrome */
  accent: string;
};

export const COMPANION_THEMES: CompanionTheme[] = [
  {
    id: "aurora",
    name: "Aurora",
    description: "Calm violet — your default companion.",
    cost: 0,
    body:
      "radial-gradient(circle at 35% 30%, oklch(0.92 0.06 290 / 0.95), oklch(0.72 0.18 290 / 0.95) 55%, oklch(0.55 0.18 290) 100%)",
    halo:
      "radial-gradient(circle at 50% 50%, oklch(0.78 0.18 290 / 0.55), oklch(0.72 0.14 230 / 0.25) 55%, transparent 75%)",
    accent: "oklch(0.72 0.18 290)",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool blue for deep, quiet focus.",
    cost: 80,
    body:
      "radial-gradient(circle at 35% 30%, oklch(0.94 0.05 220 / 0.95), oklch(0.7 0.15 220 / 0.95) 55%, oklch(0.5 0.16 230) 100%)",
    halo:
      "radial-gradient(circle at 50% 50%, oklch(0.78 0.14 220 / 0.55), oklch(0.7 0.1 200 / 0.25) 55%, transparent 75%)",
    accent: "oklch(0.7 0.15 220)",
  },
  {
    id: "ember",
    name: "Ember",
    description: "Warm gold for evening sessions.",
    cost: 150,
    body:
      "radial-gradient(circle at 35% 30%, oklch(0.95 0.06 80 / 0.95), oklch(0.78 0.16 60 / 0.95) 55%, oklch(0.55 0.14 40) 100%)",
    halo:
      "radial-gradient(circle at 50% 50%, oklch(0.82 0.14 60 / 0.55), oklch(0.7 0.12 40 / 0.25) 55%, transparent 75%)",
    accent: "oklch(0.78 0.16 60)",
  },
  {
    id: "moss",
    name: "Moss",
    description: "Grounded green — gentle and steady.",
    cost: 220,
    body:
      "radial-gradient(circle at 35% 30%, oklch(0.94 0.05 150 / 0.95), oklch(0.72 0.13 150 / 0.95) 55%, oklch(0.5 0.12 150) 100%)",
    halo:
      "radial-gradient(circle at 50% 50%, oklch(0.78 0.12 150 / 0.55), oklch(0.7 0.1 160 / 0.25) 55%, transparent 75%)",
    accent: "oklch(0.72 0.13 150)",
  },
  {
    id: "rose",
    name: "Rose",
    description: "Soft pink — warm encouragement.",
    cost: 320,
    body:
      "radial-gradient(circle at 35% 30%, oklch(0.95 0.05 10 / 0.95), oklch(0.78 0.14 10 / 0.95) 55%, oklch(0.55 0.14 10) 100%)",
    halo:
      "radial-gradient(circle at 50% 50%, oklch(0.82 0.12 10 / 0.55), oklch(0.7 0.1 350 / 0.25) 55%, transparent 75%)",
    accent: "oklch(0.78 0.14 10)",
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep indigo for night studies.",
    cost: 500,
    body:
      "radial-gradient(circle at 35% 30%, oklch(0.78 0.08 270 / 0.95), oklch(0.45 0.16 270 / 0.95) 55%, oklch(0.25 0.12 270) 100%)",
    halo:
      "radial-gradient(circle at 50% 50%, oklch(0.55 0.18 270 / 0.55), oklch(0.4 0.14 280 / 0.25) 55%, transparent 75%)",
    accent: "oklch(0.55 0.18 270)",
  },
];

export function getTheme(id: string | null | undefined): CompanionTheme {
  return COMPANION_THEMES.find((t) => t.id === id) ?? COMPANION_THEMES[0];
}