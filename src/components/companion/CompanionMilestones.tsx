/**
 * CompanionMilestones
 * ---------------------------------------------------------------------
 * A tiny, headless listener that gives the companion a *voice* across
 * the app — without ever interrupting flow. It subscribes to lightweight
 * window events that other systems already dispatch, and surfaces brief,
 * emotionally intelligent toasts attributed to the active companion.
 *
 * It deliberately rate-limits itself: at most one milestone toast every
 * ~12 seconds, so users feel acknowledged without feeling nagged.
 *
 * Events consumed:
 *   - studysync:focus-completed  (from use-pomodoro)
 *   - studysync:explanation-saved (from CompanionChat save-to-library)
 *   - studysync:goal-completed   (optional, from goals UI)
 *   - studysync:theme-unlocked   (from customize page unlock)
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useCompanion } from "@/hooks/use-companion";
import { usePomodoro } from "@/hooks/use-pomodoro";

const COOLDOWN_MS = 12_000;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function CompanionMilestones() {
  const { displayName } = useCompanion();
  const { stats } = usePomodoro();
  const lastAtRef = useRef(0);
  const nameRef = useRef(displayName);
  const statsRef = useRef(stats);

  // Keep refs fresh without re-binding listeners on every state change.
  useEffect(() => {
    nameRef.current = displayName;
  }, [displayName]);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    const say = (line: string, description?: string) => {
      const now = Date.now();
      if (now - lastAtRef.current < COOLDOWN_MS) return;
      lastAtRef.current = now;
      toast(line, { description: description ?? nameRef.current });
    };

    const onFocusDone = (e: Event) => {
      const detail = (e as CustomEvent<{ streakTicked?: boolean; streak?: number }>).detail ?? {};
      const s = statsRef.current;
      // Streak milestones first — they're the most meaningful moments.
      if (detail.streakTicked && detail.streak === 3)
        return say("Three days in a row.", `${nameRef.current} · the rhythm is forming.`);
      if (detail.streakTicked && detail.streak === 7)
        return say("A full week. You really showed up.", nameRef.current);
      if (detail.streakTicked && detail.streak && detail.streak % 14 === 0)
        return say(`${detail.streak} days strong.`, `${nameRef.current} · this is who you're becoming.`);
      // Session totals
      const total = (s.totalFocusSessions ?? 0);
      if (total > 0 && total % 25 === 0)
        return say(`${total} sessions together.`, `${nameRef.current} · steady progress.`);
      if (total > 0 && total % 10 === 0)
        return say("Momentum is building.", nameRef.current);
      // Plain session — keep it gentle and rotate copy
      if ((s.completedToday ?? 0) >= 3)
        return say(pick(["Strong day.", "You're getting closer.", "That's three today."]), nameRef.current);
      say(
        pick([
          "Nice work.",
          "That was a solid study session.",
          "You're making progress.",
        ]),
        nameRef.current,
      );
    };

    const onSaved = () =>
      say(
        pick([
          "Saved. We can come back to it.",
          "Kept for later.",
          "Tucked into your library.",
        ]),
        nameRef.current,
      );

    const onGoal = (e: Event) => {
      const detail = (e as CustomEvent<{ title?: string }>).detail ?? {};
      say(
        detail.title ? `Done: ${detail.title}.` : "Goal complete.",
        `${nameRef.current} · that's progress you can feel.`,
      );
    };

    const onUnlock = (e: Event) => {
      const detail = (e as CustomEvent<{ name?: string }>).detail ?? {};
      say(
        detail.name ? `${detail.name} is yours.` : "A new presence joins you.",
        `${nameRef.current} · we grow together.`,
      );
    };

    window.addEventListener("studysync:focus-completed", onFocusDone as EventListener);
    window.addEventListener("studysync:explanation-saved", onSaved as EventListener);
    window.addEventListener("studysync:goal-completed", onGoal as EventListener);
    window.addEventListener("studysync:theme-unlocked", onUnlock as EventListener);
    return () => {
      window.removeEventListener("studysync:focus-completed", onFocusDone as EventListener);
      window.removeEventListener("studysync:explanation-saved", onSaved as EventListener);
      window.removeEventListener("studysync:goal-completed", onGoal as EventListener);
      window.removeEventListener("studysync:theme-unlocked", onUnlock as EventListener);
    };
  }, []);

  return null;
}