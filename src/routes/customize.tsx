import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Coins, Lock, Sparkles } from "lucide-react";
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
      </div>
    </DashboardShell>
  );
}