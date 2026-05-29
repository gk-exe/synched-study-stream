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
import { fetchStats, upsertStats, logStudySession } from "@/lib/db";

export type PomodoroMode = "focus" | "short" | "long";

export const MODE_MINUTES: Record<PomodoroMode, number> = {
  focus: 25,
  short: 5,
  long: 15,
};

export const MODE_LABEL: Record<PomodoroMode, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

const COINS_PER_FOCUS = 10;
const SESSIONS_BEFORE_LONG = 4;
const STORAGE_KEY = "studysync:pomodoro:v1";

/** Streak day milestones that grant bonus coins */
const STREAK_MILESTONES: Record<number, number> = {
  3: 15,
  7: 30,
  14: 50,
  30: 100,
  60: 150,
  100: 250,
};
/** Bonus coins every N total focus sessions */
const SESSION_MILESTONE_EVERY = 10;
const SESSION_MILESTONE_BONUS = 20;
/** Long-break overrun penalty */
const LONG_BREAK_SOFT_CAP = 2;
const OVERRUN_PENALTY = 5;

type Stats = {
  coins: number;
  streak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  completedToday: number;
  totalFocusSessions: number;
  cycleCount: number; // focus sessions since last long break
  momentumScore: number; // 0..100
  companionTheme: string;
  unlockedThemes: string[];
  currentTask: string | null;
  longBreaksToday: number;
  lastBreakDate: string | null;
};

const defaultStats: Stats = {
  coins: 0,
  streak: 0,
  lastCompletedDate: null,
  completedToday: 0,
  totalFocusSessions: 0,
  cycleCount: 0,
  momentumScore: 50,
  companionTheme: "aurora",
  unlockedThemes: ["aurora"],
  currentTask: null,
  longBreaksToday: 0,
  lastBreakDate: null,
};

type Ctx = {
  mode: PomodoroMode;
  setMode: (m: PomodoroMode) => void;
  remaining: number; // seconds
  total: number; // seconds
  running: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  stats: Stats;
  loading: boolean;
  setCurrentTask: (task: string | null) => void;
  setCompanionTheme: (id: string) => void;
  unlockTheme: (id: string, cost: number) => boolean;
};

const PomodoroCtx = createContext<Ctx | null>(null);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isYesterday(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d.toISOString().slice(0, 10) === y.toISOString().slice(0, 10);
}

function loadStats(): Stats {
  if (typeof window === "undefined") return defaultStats;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStats;
    const parsed = { ...defaultStats, ...JSON.parse(raw) } as Stats;
    // Reset completedToday if day rolled over
    if (parsed.lastCompletedDate && parsed.lastCompletedDate !== todayKey()) {
      parsed.completedToday = 0;
    }
    // Reset long-breaks counter if day rolled over
    if (parsed.lastBreakDate && parsed.lastBreakDate !== todayKey()) {
      parsed.longBreaksToday = 0;
    }
    // Gentle momentum decay if missed a day
    if (parsed.lastCompletedDate && parsed.lastCompletedDate !== todayKey() && !isYesterday(parsed.lastCompletedDate)) {
      parsed.momentumScore = Math.max(20, (parsed.momentumScore ?? 50) - 10);
    }
    return parsed;
  } catch {
    return defaultStats;
  }
}

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [mode, setModeState] = useState<PomodoroMode>("focus");
  const [remaining, setRemaining] = useState(MODE_MINUTES.focus * 60);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [loading, setLoading] = useState(false);
  const hydratedFromCloud = useRef(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydrate from localStorage (instant, works for guests)
  useEffect(() => {
    setStats(loadStats());
  }, []);

  // When signed in, replace stats with cloud copy
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    setLoading(true);
    fetchStats(user.id)
      .then((row) => {
        if (cancelled) return;
        if (row) {
          const today = todayKey();
          setStats({
            coins: row.coins,
            streak: row.streak,
            lastCompletedDate: row.last_completed_date,
            completedToday:
              row.last_completed_date === today ? row.completed_today : 0,
            totalFocusSessions: row.total_focus_sessions,
            cycleCount: row.cycle_count,
            momentumScore: (row as any).momentum_score ?? 50,
            companionTheme: (row as any).companion_theme ?? "aurora",
            unlockedThemes: ((row as any).unlocked_themes as string[] | null) ?? ["aurora"],
            currentTask: (row as any).current_task ?? null,
            longBreaksToday:
              (row as any).last_break_date === today ? ((row as any).long_breaks_today ?? 0) : 0,
            lastBreakDate: (row as any).last_break_date ?? null,
          });
        }
        hydratedFromCloud.current = true;
      })
      .catch((e) => toast.error(e.message ?? "Failed to load stats"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Persist locally always; mirror to cloud when signed in & hydrated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      /* noop */
    }
    if (user && hydratedFromCloud.current) {
      upsertStats(user.id, {
        coins: stats.coins,
        streak: stats.streak,
        last_completed_date: stats.lastCompletedDate,
        completed_today: stats.completedToday,
        total_focus_sessions: stats.totalFocusSessions,
        cycle_count: stats.cycleCount,
        momentum_score: stats.momentumScore,
        companion_theme: stats.companionTheme,
        unlocked_themes: stats.unlockedThemes,
        current_task: stats.currentTask,
        long_breaks_today: stats.longBreaksToday,
        last_break_date: stats.lastBreakDate,
      }).catch(() => {
        /* silent — local copy is source of truth */
      });
    }
  }, [stats, user]);

  const total = MODE_MINUTES[mode] * 60;

  const completeSession = useCallback(() => {
    setRunning(false);
    const completedMode = mode;
    const completedDuration = MODE_MINUTES[mode] * 60;
    if (user) {
      logStudySession(user.id, completedMode, completedDuration).catch(() => {
        /* non-blocking */
      });
    }
    if (mode === "focus") {
      setStats((prev) => {
        const today = todayKey();
        let streak = prev.streak;
        if (prev.lastCompletedDate === today) {
          // same day, keep streak
        } else if (prev.lastCompletedDate && isYesterday(prev.lastCompletedDate)) {
          streak = prev.streak + 1;
        } else {
          streak = 1;
        }
        const completedToday =
          prev.lastCompletedDate === today ? prev.completedToday + 1 : 1;
        const cycleCount = prev.cycleCount + 1;
        const totalFocus = prev.totalFocusSessions + 1;

        // ---- Coin economy ----
        let earned = COINS_PER_FOCUS;
        const bonuses: string[] = [];
        const streakBonus = STREAK_MILESTONES[streak];
        if (streakBonus && streak !== prev.streak) {
          earned += streakBonus;
          bonuses.push(`+${streakBonus} for ${streak}-day streak`);
        }
        if (totalFocus % SESSION_MILESTONE_EVERY === 0) {
          earned += SESSION_MILESTONE_BONUS;
          bonuses.push(`+${SESSION_MILESTONE_BONUS} for ${totalFocus} sessions`);
        }

        const momentumScore = Math.min(100, prev.momentumScore + 3);

        toast.success(`Focus complete · +${earned} coins`, {
          description: bonuses.length ? bonuses.join(" · ") : "Take a well-earned break.",
        });
        return {
          ...prev,
          coins: prev.coins + COINS_PER_FOCUS,
          streak,
          lastCompletedDate: today,
          completedToday,
          totalFocusSessions: totalFocus,
          cycleCount,
          momentumScore,
          coins: prev.coins + earned,
        };
      });
      // auto-switch to break
      setStats((prev) => {
        const nextMode: PomodoroMode =
          prev.cycleCount % SESSIONS_BEFORE_LONG === 0 ? "long" : "short";
        setModeState(nextMode);
        setRemaining(MODE_MINUTES[nextMode] * 60);
        return prev;
      });
    } else {
      // ---- Long break consequences ----
      if (completedMode === "long") {
        setStats((prev) => {
          const today = todayKey();
          const sameDay = prev.lastBreakDate === today;
          const next = sameDay ? prev.longBreaksToday + 1 : 1;
          let coins = prev.coins;
          let momentum = prev.momentumScore;
          if (next > LONG_BREAK_SOFT_CAP) {
            coins = Math.max(0, prev.coins - OVERRUN_PENALTY);
            momentum = Math.max(0, prev.momentumScore - 5);
            const messages = [
              "That break became a little too long.",
              "Let's get back into rhythm.",
              "Small steps still count.",
            ];
            toast(messages[Math.floor(Math.random() * messages.length)], {
              description: `Gentle reset · −${OVERRUN_PENALTY} coins`,
            });
          } else {
            toast("Break over", { description: "Ready for another focus session?" });
          }
          return {
            ...prev,
            coins,
            momentumScore: momentum,
            longBreaksToday: next,
            lastBreakDate: today,
          };
        });
      } else {
        toast("Break over", { description: "Ready for another focus session?" });
      }
      setModeState("focus");
      setRemaining(MODE_MINUTES.focus * 60);
    }
  }, [mode, user]);

  // tick
  useEffect(() => {
    if (!running) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    tickRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          // schedule completion after state settles
          queueMicrotask(completeSession);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [running, completeSession]);

  const setMode = useCallback((m: PomodoroMode) => {
    setModeState(m);
    setRemaining(MODE_MINUTES[m] * 60);
    setRunning(false);
  }, []);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => {
    setRunning(false);
    setRemaining(MODE_MINUTES[mode] * 60);
  }, [mode]);
  const skip = useCallback(() => {
    completeSession();
  }, [completeSession]);

  const setCurrentTask = useCallback((task: string | null) => {
    setStats((prev) => ({ ...prev, currentTask: task && task.trim() ? task.trim() : null }));
  }, []);

  const setCompanionTheme = useCallback((id: string) => {
    setStats((prev) =>
      prev.unlockedThemes.includes(id) ? { ...prev, companionTheme: id } : prev,
    );
  }, []);

  const unlockTheme = useCallback((id: string, cost: number) => {
    let ok = false;
    setStats((prev) => {
      if (prev.unlockedThemes.includes(id)) {
        ok = true;
        return { ...prev, companionTheme: id };
      }
      if (prev.coins < cost) return prev;
      ok = true;
      toast.success("Companion unlocked", { description: "A new presence joins you." });
      return {
        ...prev,
        coins: prev.coins - cost,
        unlockedThemes: [...prev.unlockedThemes, id],
        companionTheme: id,
      };
    });
    return ok;
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      mode, setMode, remaining, total, running,
      start, pause, reset, skip, stats, loading,
      setCurrentTask, setCompanionTheme, unlockTheme,
    }),
    [mode, setMode, remaining, total, running, start, pause, reset, skip, stats, loading, setCurrentTask, setCompanionTheme, unlockTheme],
  );

  return <PomodoroCtx.Provider value={value}>{children}</PomodoroCtx.Provider>;
}

export function usePomodoro() {
  const ctx = useContext(PomodoroCtx);
  if (!ctx) throw new Error("usePomodoro must be used within PomodoroProvider");
  return ctx;
}