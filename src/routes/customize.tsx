import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Check,
  Coins,
  Eye,
  Lock,
  Palette,
  Shapes,
  Shirt,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CompanionOrb } from "@/components/companion/CompanionOrb";
import { CreateCompanionFlow } from "@/components/companion/CreateCompanionFlow";
import { Button } from "@/components/ui/button";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { COMPANION_THEMES } from "@/lib/companion-themes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customize")({
  component: CustomizePage,
  head: () => ({
    meta: [
      { title: "Companion · Customize" },
      { name: "description", content: "Personalize your study companion's presence." },
    ],
  }),
});

/**
 * Customization categories. Only "Themes" and "Custom" render content
 * today — the rest are intentional placeholders that establish the IA
 * for future skins / robot silhouettes / eye styles.
 */
type CategoryId = "themes" | "skins" | "robots" | "eyes" | "custom";
const CATEGORIES: { id: CategoryId; label: string; icon: typeof Palette; soon?: boolean }[] = [
  { id: "themes", label: "Themes", icon: Palette },
  { id: "skins", label: "Skins", icon: Shirt, soon: true },
  { id: "robots", label: "Robot styles", icon: Shapes, soon: true },
  { id: "eyes", label: "Eye styles", icon: Eye, soon: true },
  { id: "custom", label: "Custom", icon: Wand2 },
];

function CustomizePage() {
  const { stats, setCompanionTheme, unlockTheme } = usePomodoro();
  const active = stats.companionTheme;
  const [category, setCategory] = useState<CategoryId>("themes");

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex flex-col items-center text-center">
          <CompanionOrb themeId={active} size={160} expression="smile" />
          <p className="mt-4 text-xs text-muted-foreground">Sync · your study companion</p>
          <h1 className="text-xl font-semibold tracking-tight">Shape your companion</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personalize Sync's presence. Earn coins from focus sessions to unlock more.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1 text-xs">
            <Coins className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-medium">{stats.coins}</span>
            <span className="text-muted-foreground">coins</span>
          </div>
        </header>

        <div className="mb-5 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const isActive = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all",
                  isActive
                    ? "bg-gradient-brand text-primary-foreground shadow-glow"
                    : "glass text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {c.label}
                {c.soon && (
                  <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide">
                    soon
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {category !== "themes" && category !== "custom" && (
          <ComingSoonPanel id={category} />
        )}

        {category === "themes" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMPANION_THEMES.map((theme, i) => {
            const unlocked = stats.unlockedThemes.includes(theme.id);
            const isActive = active === theme.id;
            const canAfford = stats.coins >= theme.cost;
            return (
              <motion.div
                key={theme.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "glass relative flex flex-col items-center rounded-3xl p-5 shadow-glow transition-all",
                  isActive && "ring-2 ring-primary",
                )}
              >
                <CompanionOrb themeId={theme.id} size={120} state="resting" />
                <p className="mt-3 text-sm font-semibold">{theme.name}</p>
                <p className="mt-1 text-center text-xs text-muted-foreground">{theme.description}</p>
                <div className="mt-4 w-full">
                  {isActive ? (
                    <Button
                      disabled
                      className="bg-gradient-brand w-full rounded-full text-primary-foreground shadow-glow"
                    >
                      <Check className="h-4 w-4" /> Active
                    </Button>
                  ) : unlocked ? (
                    <Button
                      onClick={() => setCompanionTheme(theme.id)}
                      variant="outline"
                      className="w-full rounded-full"
                    >
                      <Sparkles className="h-4 w-4" /> Use
                    </Button>
                  ) : (
                    <Button
                      onClick={() => unlockTheme(theme.id, theme.cost)}
                      disabled={!canAfford}
                      className="bg-gradient-brand w-full rounded-full text-primary-foreground shadow-glow disabled:opacity-50"
                    >
                      {canAfford ? <Coins className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      {theme.cost} coins
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        )}

        {category === "custom" && (
          <CreateCompanionFlow />
        )}
      </div>
    </DashboardShell>
  );
}

function ComingSoonPanel({ id }: { id: CategoryId }) {
  const copy: Record<string, { title: string; desc: string }> = {
    skins: {
      title: "Skins",
      desc: "Outfits and surface materials for Sync — matte, chrome, soft cotton.",
    },
    robots: {
      title: "Robot styles",
      desc: "Alternate silhouettes for Sync — antenna shapes, posture, frame.",
    },
    eyes: {
      title: "Eye styles",
      desc: "Different glows and shapes for Sync's eyes — round, pixel, crescent.",
    },
  };
  const c = copy[id] ?? { title: "Coming soon", desc: "More ways to shape Sync are on the way." };
  return (
    <div className="glass rounded-3xl p-8 text-center shadow-glow">
      <CompanionOrb size={96} state="resting" className="mx-auto" />
      <h2 className="mt-4 text-base font-semibold tracking-tight">{c.title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{c.desc}</p>
      <p className="mt-3 text-xs text-muted-foreground">In the works — Sync is growing with you.</p>
    </div>
  );
}