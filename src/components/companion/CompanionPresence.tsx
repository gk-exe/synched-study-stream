import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { useAppData } from "@/hooks/use-app-data";
import { cn } from "@/lib/utils";

/**
 * A small persistent "Sync" presence shown across the app.
 * - Floats above the mobile bottom nav and bottom-right on desktop
 * - Rotates contextual, mood-aware encouragement
 * - Tap to open the full companion chat
 */
export function CompanionPresence() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { mode, running, stats } = usePomodoro();
  const { mood } = useAppData();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [idx, setIdx] = useState(0);

  // Hide on the full chat page and auth/onboarding flows
  const hidden =
    pathname.startsWith("/companion") ||
    pathname.startsWith("/focus") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/onboarding") ||
    pathname === "/";

  const messages = useMemo(() => {
    const base: string[] = [];
    if (running && mode === "focus") {
      base.push("You're in flow — I'm right here with you.");
      base.push("Keep going. One breath, one line at a time.");
    } else if (running) {
      base.push("Rest is part of the work. Sip some water.");
      base.push("Let your mind wander for a moment.");
    } else {
      if (stats.completedToday > 0)
        base.push(`Proud of you — ${stats.completedToday} session${stats.completedToday > 1 ? "s" : ""} today.`);
      if (stats.streak >= 2)
        base.push(`${stats.streak}-day streak. That consistency is real.`);
      base.push("Ready when you are. No pressure.");
    }
    if (mood === "tired") base.push("Be gentle with yourself today.");
    if (mood === "anxious") base.push("Inhale 4 · hold 4 · exhale 6. I'll wait.");
    if (mood === "focused") base.push("You've got the room. Go deep.");
    return base;
  }, [running, mode, mood, stats.completedToday, stats.streak]);

  useEffect(() => {
    setIdx(0);
    if (messages.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % messages.length), 9000);
    return () => clearInterval(t);
  }, [messages]);

  if (hidden || dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "pointer-events-auto fixed z-40",
        // Mobile: sit just above the bottom nav
        "right-3 bottom-[5.25rem]",
        // Desktop: bottom-right
        "lg:right-6 lg:bottom-6",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          <motion.div
            key="bubble"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="glass shadow-glow flex w-[min(78vw,18rem)] items-start gap-3 rounded-2xl p-3"
          >
            <span className="bg-gradient-brand shadow-glow grid h-9 w-9 shrink-0 place-items-center rounded-xl">
              <Sparkles className="text-primary-foreground h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium">Sync</p>
                <button
                  onClick={() => setDismissed(true)}
                  aria-label="Dismiss"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={messages[idx]}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="mt-0.5 text-sm leading-snug"
                >
                  {messages[idx]}
                </motion.p>
              </AnimatePresence>
              <div className="mt-2 flex items-center gap-2">
                <Link
                  to="/companion"
                  className="bg-gradient-brand text-primary-foreground inline-flex h-7 items-center rounded-full px-3 text-[11px] font-medium"
                >
                  Talk to Sync
                </Link>
                <button
                  onClick={() => setExpanded(false)}
                  className="text-muted-foreground hover:text-foreground text-[11px]"
                >
                  Later
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="orb"
            onClick={() => setExpanded(true)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            aria-label="Open Sync companion"
            className="bg-gradient-brand shadow-glow relative grid h-12 w-12 place-items-center rounded-full"
          >
            <span className="bg-primary/40 absolute inset-0 -z-10 animate-ping rounded-full" />
            <Sparkles className="text-primary-foreground h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}