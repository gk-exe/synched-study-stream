import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Coins, ImagePlus, Lock, Sparkles, Wand2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CompanionOrb } from "@/components/companion/CompanionOrb";
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

function CustomizePage() {
  const { stats, setCompanionTheme, unlockTheme } = usePomodoro();
  const active = stats.companionTheme;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex flex-col items-center text-center">
          <CompanionOrb themeId={active} size={160} />
          <p className="mt-4 text-xs text-muted-foreground">Your companion</p>
          <h1 className="text-xl font-semibold tracking-tight">Choose a presence</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personalize the atmosphere. Earn coins from focus sessions to unlock more.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1 text-xs">
            <Coins className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-medium">{stats.coins}</span>
            <span className="text-muted-foreground">coins</span>
          </div>
        </header>

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

        {/* ----------------------------------------------------------------
            Personal Companion (foundation only — generation not wired yet).
            This section is the placeholder UI for the future flow where
            users can upload inspiration and describe a one-of-one companion.
            Inputs are disabled so we don't collect data we can't act on.
        ----------------------------------------------------------------- */}
        <section className="glass mt-8 rounded-3xl p-6 shadow-glow">
          <div className="flex items-start gap-3">
            <span className="bg-gradient-brand grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-glow">
              <Wand2 className="text-primary-foreground h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight">
                  Your own companion
                </h2>
                <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Coming soon
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Soon you'll be able to shape a one-of-one companion — upload
                inspiration, describe a vibe, and we'll generate a stylized
                study partner just for you.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-border/70 bg-foreground/[0.02] p-5 text-center">
              <ImagePlus className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Inspiration images</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Drop a mood board to guide the style.
              </p>
              <Button
                disabled
                variant="outline"
                className="mt-3 rounded-full opacity-70"
              >
                Upload (soon)
              </Button>
            </div>
            <div className="rounded-2xl border border-dashed border-border/70 bg-foreground/[0.02] p-5">
              <p className="text-sm font-medium">Describe your companion</p>
              <p className="mt-1 text-xs text-muted-foreground">
                A name, a feeling, a color — anything that fits.
              </p>
              <textarea
                disabled
                placeholder="e.g. A calm fox with soft moonlight glow, named Luma…"
                className="mt-3 h-20 w-full resize-none rounded-xl border border-border/70 bg-background/50 p-2.5 text-sm placeholder:text-muted-foreground/70 disabled:opacity-70"
              />
              <Button
                disabled
                className="bg-gradient-brand mt-3 rounded-full text-primary-foreground opacity-70"
              >
                <Sparkles className="h-4 w-4" /> Generate (soon)
              </Button>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Unlocks at <span className="font-medium text-foreground">500 coins</span>{" "}
            of study earned. Keep showing up — your companion is growing with you.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}