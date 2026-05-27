import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchGoals,
  insertGoal,
  updateGoal,
  deleteGoal,
  fetchLatestMood,
  logMood,
} from "@/lib/db";
import { toast } from "sonner";

export type Goal = { id: string; label: string; done: boolean };
export type Mood = "calm" | "focused" | "tired" | "anxious";

type AppData = {
  goals: Goal[];
  addGoal: (label: string) => void;
  toggleGoal: (id: string) => void;
  removeGoal: (id: string) => void;
  renameGoal: (id: string, label: string) => void;
  mood: Mood;
  setMood: (m: Mood) => void;
  loading: boolean;
};

const GOALS_KEY = "studysync:goals:v1";
const MOOD_KEY = "studysync:mood:v1";

const defaultGoals: Goal[] = [
  { id: "g1", label: "Review organic chemistry notes", done: true },
  { id: "g2", label: "Solve 10 calculus problems", done: true },
  { id: "g3", label: "Read chapter 4 of psychology", done: false },
  { id: "g4", label: "Practice Spanish vocab · 15 min", done: false },
];

const Ctx = createContext<AppData | null>(null);

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [mood, setMoodState] = useState<Mood>("calm");
  const [loading, setLoading] = useState(false);

  // Hydrate from localStorage immediately (guest mode + optimistic UI)
  useEffect(() => {
    setGoals(load<Goal[]>(GOALS_KEY, defaultGoals));
    setMoodState(load<Mood>(MOOD_KEY, "calm"));
  }, []);

  // When the user signs in, replace local state with their cloud data.
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchGoals(user.id), fetchLatestMood(user.id)])
      .then(([dbGoals, latestMood]) => {
        if (cancelled) return;
        setGoals(
          dbGoals.length > 0
            ? dbGoals.map((g) => ({ id: g.id, label: g.label, done: g.done }))
            : [],
        );
        if (latestMood) setMoodState(latestMood.mood as Mood);
      })
      .catch((e) => toast.error(e.message ?? "Failed to load your data"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  // Persist locally for guests + fast reload
  useEffect(() => {
    try {
      localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    } catch {
      /* noop */
    }
  }, [goals]);
  useEffect(() => {
    try {
      localStorage.setItem(MOOD_KEY, mood);
    } catch {
      /* noop */
    }
  }, [mood]);

  const addGoal = useCallback(
    (label: string) => {
      const t = label.trim();
      if (!t) return;
      const tempId = crypto.randomUUID();
      setGoals((g) => [...g, { id: tempId, label: t, done: false }]);
      if (user) {
        insertGoal(user.id, t)
          .then((row) =>
            setGoals((g) => g.map((x) => (x.id === tempId ? { id: row.id, label: row.label, done: row.done } : x))),
          )
          .catch((e) => toast.error(e.message));
      }
    },
    [user],
  );
  const toggleGoal = useCallback(
    (id: string) => {
      let nextDone = false;
      setGoals((g) =>
        g.map((x) => {
          if (x.id !== id) return x;
          nextDone = !x.done;
          return { ...x, done: nextDone };
        }),
      );
      if (user) updateGoal(id, { done: nextDone }).catch((e) => toast.error(e.message));
    },
    [user],
  );
  const removeGoal = useCallback(
    (id: string) => {
      setGoals((g) => g.filter((x) => x.id !== id));
      if (user) deleteGoal(id).catch((e) => toast.error(e.message));
    },
    [user],
  );
  const renameGoal = useCallback(
    (id: string, label: string) => {
      setGoals((g) => g.map((x) => (x.id === id ? { ...x, label } : x)));
      if (user) updateGoal(id, { label }).catch((e) => toast.error(e.message));
    },
    [user],
  );
  const setMood = useCallback(
    (m: Mood) => {
      setMoodState(m);
      if (user) logMood(user.id, m).catch((e) => toast.error(e.message));
    },
    [user],
  );

  const value = useMemo<AppData>(
    () => ({ goals, addGoal, toggleGoal, removeGoal, renameGoal, mood, setMood, loading }),
    [goals, addGoal, toggleGoal, removeGoal, renameGoal, mood, setMood, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppData must be used within AppDataProvider");
  return v;
}