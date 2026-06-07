/**
 * Unified Companion presence
 * ---------------------------------------------------------------------
 * This hook is the single source of truth for the user's *active* AI
 * companion across the app. It glues together three otherwise-separate
 * systems:
 *
 *   - `companions` table  → identity (nickname, level, xp, mood)
 *   - `companion-themes`  → visual presence (orb body + halo + accent)
 *   - `usePomodoro`       → study activity (focus completes, coins, streak)
 *
 * Integration contract
 *   - On sign-in we call `ensureStarterCompanion` so every user always
 *     has exactly one active companion (no UI ever needs to handle the
 *     "no companion" case).
 *   - `usePomodoro` dispatches a `studysync:focus-completed` window
 *     event after a focus session is logged. This hook listens and
 *     grants companion XP through `grantStudyXp` — that single call
 *     handles level-ups, milestone logging, and coin rewards.
 *   - All readers (`CompanionPresence`, dashboard `CompanionCard`, the
 *     chat header, the sidebar mini-profile) consume `useCompanion`
 *     instead of re-querying Supabase — keeping the companion identity
 *     consistent on every screen.
 *
 * The hook is intentionally read-mostly. Mutations belong in
 * `@/lib/companion-service`. UI only triggers `refresh()` after a
 * write to repull the latest row.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  ensureStarterCompanion,
  grantStudyXp,
  getActiveCompanion,
  recordReaction,
  type Companion,
} from "@/lib/companion-service";
import { useAppData, type Mood } from "@/hooks/use-app-data";

type CompanionCtx = {
  companion: Companion | null;
  loading: boolean;
  /** Re-fetch the active companion from Supabase. */
  refresh: () => Promise<void>;
  /** XP needed to advance from `level` to `level + 1`. */
  xpForNext: number;
  /** Convenience 0..1 of progress toward next level. */
  levelProgress: number;
  /** Display nickname (falls back to "Sync" before hydration). */
  displayName: string;
};

const Ctx = createContext<CompanionCtx | null>(null);

const FOCUS_COMPLETED_EVENT = "studysync:focus-completed";
const SESSION_XP = 25; // Per completed focus session
const STREAK_XP = 50;  // Bonus when streak ticks up

/** Map UX mood (calm/focused/tired/anxious) to companion mood vocabulary. */
function toCompanionMood(m: Mood) {
  if (m === "focused") return "focused" as const;
  if (m === "tired") return "tired" as const;
  if (m === "anxious") return "anxious" as const;
  return "calm" as const;
}

export function CompanionProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { mood } = useAppData();
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [loading, setLoading] = useState(false);
  const lastMoodRef = useRef<Mood | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const c = await getActiveCompanion(user.id);
      setCompanion(c);
    } catch {
      /* silent — keep previous state */
    }
  }, [user]);

  // Ensure starter on first sign-in; load active companion.
  useEffect(() => {
    if (authLoading || !user) {
      setCompanion(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    ensureStarterCompanion(user.id)
      .then((c) => {
        if (!cancelled) setCompanion(c);
      })
      .catch(() => {
        /* non-fatal: chat + focus still work without a row */
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Mirror mood changes onto the companion record so the orb + dashboard
  // reflect how the user feels, without spamming reactions for no-ops.
  useEffect(() => {
    if (!user || !companion) return;
    if (lastMoodRef.current === mood) return;
    lastMoodRef.current = mood;
    recordReaction(user.id, {
      companionId: companion.id,
      trigger: "mood_log",
      mood: toCompanionMood(mood),
      style: mood === "anxious" || mood === "tired" ? "grounding" : "supportive",
    })
      .then(() => refresh())
      .catch(() => {
        /* non-blocking */
      });
  }, [mood, user, companion, refresh]);

  // Listen for focus-session completions from `usePomodoro` and award
  // companion XP. Decoupling via a window event keeps the two providers
  // from importing each other and avoids circular dependencies.
  useEffect(() => {
    if (!user) return;
    const handler = async (e: Event) => {
      const detail = (e as CustomEvent<{ streakTicked?: boolean }>).detail ?? {};
      const amount = SESSION_XP + (detail.streakTicked ? STREAK_XP : 0);
      try {
        const res = await grantStudyXp(user.id, amount);
        if (res?.companion) setCompanion(res.companion);
        if (res?.leveledUp && companion) {
          toast.success(
            `${companion.nickname ?? "Sync"} reached level ${res.companion.level}`,
            { description: `+${res.coinsAwarded} coins · grow together` },
          );
        }
      } catch {
        /* silent */
      }
    };
    window.addEventListener(FOCUS_COMPLETED_EVENT, handler as EventListener);
    return () => window.removeEventListener(FOCUS_COMPLETED_EVENT, handler as EventListener);
  }, [user, companion]);

  const value = useMemo<CompanionCtx>(() => {
    const xpForNext = companion?.experience_to_next ?? 100;
    const levelProgress = companion
      ? Math.min(1, Math.max(0, companion.experience / Math.max(1, xpForNext)))
      : 0;
    return {
      companion,
      loading,
      refresh,
      xpForNext,
      levelProgress,
      displayName: companion?.nickname ?? "Sync",
    };
  }, [companion, loading, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompanion() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCompanion must be used within CompanionProvider");
  return v;
}

/** Constant exported so other modules dispatch the same event name. */
export const FOCUS_COMPLETED = FOCUS_COMPLETED_EVENT;
