import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [mood, setMoodState] = useState<Mood>("calm");

  // hydrate
  useEffect(() => {
    setGoals(load<Goal[]>(GOALS_KEY, defaultGoals));
    setMoodState(load<Mood>(MOOD_KEY, "calm"));
  }, []);

  // persist
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

  const addGoal = useCallback((label: string) => {
    const t = label.trim();
    if (!t) return;
    setGoals((g) => [...g, { id: crypto.randomUUID(), label: t, done: false }]);
  }, []);
  const toggleGoal = useCallback(
    (id: string) =>
      setGoals((g) => g.map((x) => (x.id === id ? { ...x, done: !x.done } : x))),
    [],
  );
  const removeGoal = useCallback(
    (id: string) => setGoals((g) => g.filter((x) => x.id !== id)),
    [],
  );
  const renameGoal = useCallback(
    (id: string, label: string) =>
      setGoals((g) => g.map((x) => (x.id === id ? { ...x, label } : x))),
    [],
  );
  const setMood = useCallback((m: Mood) => setMoodState(m), []);

  const value = useMemo<AppData>(
    () => ({ goals, addGoal, toggleGoal, removeGoal, renameGoal, mood, setMood }),
    [goals, addGoal, toggleGoal, removeGoal, renameGoal, mood, setMood],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppData must be used within AppDataProvider");
  return v;
}