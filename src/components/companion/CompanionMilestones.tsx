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
import { pickLine, type LineTag } from "@/lib/companion-lines";

const COOLDOWN_MS = 12_000;

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
      const total = s.totalFocusSessions ?? 0;
      const hour = new Date().getHours();
      const tags: LineTag[] = [];

      // Priority 1: streak ticks — the most meaningful moments.
      if (detail.streakTicked) {
        if (detail.streak === 3) tags.push("streak.3");
        else if (detail.streak === 7) tags.push("streak.7");
        else if (detail.streak === 14) tags.push("streak.14");
        else if (detail.streak === 30) tags.push("streak.30");
        else if (detail.streak && detail.streak % 7 === 0) tags.push("streak.milestone");
        else if (detail.streak === 1) tags.push("streak.new");
      }

      // Priority 2: cumulative session milestones.
      if (total === 100) tags.push("sessions.100");
      else if (total === 50) tags.push("sessions.50");
      else if (total > 0 && total % 25 === 0) tags.push("sessions.25");
      else if (total > 0 && total % 10 === 0) tags.push("sessions.10");

      // Priority 3: contextual encouragement for the plain case.
      if (hour >= 22 || hour < 5) tags.push("focus.done.late");
      if ((s.completedToday ?? 0) === 1) tags.push("focus.done.first");
      if ((s.completedToday ?? 0) >= 3) tags.push("focus.done.strong");
      tags.push("focus.done.small");

      say(pickLine(tags), nameRef.current);
    };

    const onSaved = () => say(pickLine(["saved"]), nameRef.current);

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