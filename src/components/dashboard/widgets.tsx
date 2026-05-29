import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  Flame,
  Play,
  Pause,
  RotateCcw,
  Check,
  Circle,
  Quote,
  Sparkles,
  Send,
  TrendingUp,
  Clock,
  BookOpen,
  SkipForward,
  Coins,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  MODE_LABEL,
  MODE_MINUTES,
  usePomodoro,
  type PomodoroMode,
} from "@/hooks/use-pomodoro";
import { useAppData } from "@/hooks/use-app-data";
import { useMemo } from "react";
import type { DbSession } from "@/lib/db";

const card =
  "glass relative overflow-hidden rounded-3xl p-5 shadow-glow transition-all duration-300 hover:-translate-y-0.5";

function CardShell({
  children,
  className,
  delay = 0,
  href,
  hrefLabel,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={cn(card, "group", className)}
    >
      {href && (
        <Link
          to={href}
          aria-label={hrefLabel ?? "Open"}
          className="absolute top-3 right-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-foreground/5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-foreground/10 hover:text-foreground"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}
      {children}
    </motion.div>
  );
}

/* ---------- Streak ---------- */
export function StreakCard() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const { stats } = usePomodoro();
  const today = new Date().getDay(); // 0..6 (Sun..Sat)
  // map to Mon-first index
  const todayIdx = (today + 6) % 7;
  const active = days.map((_, i) => i < todayIdx || (i === todayIdx && stats.completedToday > 0));
  return (
    <CardShell delay={0.05} href="/analytics" hrefLabel="Open analytics">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Study streak</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-gradient-brand text-4xl font-semibold">{stats.streak}</span>
            <span className="mb-1 text-sm text-muted-foreground">days</span>
          </div>
        </div>
        <span className="bg-gradient-brand grid h-10 w-10 place-items-center rounded-xl shadow-glow">
          <Flame className="h-5 w-5 text-primary-foreground" />
        </span>
      </div>
      <div className="mt-5 flex items-center justify-between gap-1.5">
        {days.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full text-[10px] transition-colors",
                active[i]
                  ? "bg-gradient-brand text-primary-foreground"
                  : "bg-foreground/5 text-muted-foreground",
              )}
            >
              {active[i] ? <Check className="h-3 w-3" /> : ""}
            </div>
            <span className="text-[10px] text-muted-foreground">{d}</span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

/* ---------- Focus timer ---------- */
export function FocusTimerCard() {
  const { mode, setMode, remaining, total, running, start, pause, reset, skip } =
    usePomodoro();
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = total === 0 ? 0 : ((total - remaining) / total) * 100;
  const r = 78;
  const c = 2 * Math.PI * r;
  const modes: PomodoroMode[] = ["focus", "short", "long"];

  return (
    <CardShell delay={0.1} href="/focus" hrefLabel="Open focus timer" className="flex flex-col items-center text-center">
      <div className="flex w-full items-center justify-between">
        <p className="text-xs text-muted-foreground">Focus timer</p>
      </div>
      <div className="glass mt-2 flex w-full items-center gap-1 rounded-full p-1 text-xs">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 rounded-full px-2 py-1.5 transition-colors",
              mode === m
                ? "bg-gradient-brand text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>
      <div className="relative mt-3 grid place-items-center">
        <svg width="200" height="200" className="-rotate-90">
          <circle cx="100" cy="100" r={r} stroke="currentColor" className="text-foreground/10" strokeWidth="10" fill="none" />
          <motion.circle
            cx="100"
            cy="100"
            r={r}
            stroke="url(#focus-grad)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            animate={{ strokeDashoffset: c - (pct / 100) * c }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="focus-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.72 0.18 290)" />
              <stop offset="100%" stopColor="oklch(0.78 0.13 220)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-3xl font-semibold tabular-nums">
            {mm}:{ss}
          </span>
          <span className="mt-1 text-xs text-muted-foreground">
            {MODE_LABEL[mode]} · {MODE_MINUTES[mode]} min
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => (running ? pause() : start())}
          className="bg-gradient-brand rounded-full px-5 text-primary-foreground shadow-glow hover:opacity-90"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "Pause" : remaining === total ? "Start" : "Resume"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={reset}
          className="rounded-full"
          aria-label="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={skip}
          className="rounded-full"
          aria-label="Skip session"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </CardShell>
  );
}

/* ---------- Rewards ---------- */
export function RewardsCard() {
  const { stats } = usePomodoro();
  return (
    <CardShell delay={0.12} href="/focus" hrefLabel="Open focus">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Reward coins</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-gradient-brand text-4xl font-semibold">{stats.coins}</span>
            <span className="mb-1 text-sm text-muted-foreground">earned</span>
          </div>
        </div>
        <span className="bg-gradient-brand grid h-10 w-10 place-items-center rounded-xl shadow-glow">
          <Coins className="h-5 w-5 text-primary-foreground" />
        </span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="bg-foreground/5 rounded-2xl p-3">
          <p className="text-[11px] text-muted-foreground">Today</p>
          <p className="mt-1 text-lg font-semibold">{stats.completedToday}</p>
          <p className="text-[11px] text-muted-foreground">sessions</p>
        </div>
        <div className="bg-foreground/5 rounded-2xl p-3">
          <p className="text-[11px] text-muted-foreground">Total</p>
          <p className="mt-1 text-lg font-semibold">{stats.totalFocusSessions}</p>
          <p className="text-[11px] text-muted-foreground">all-time</p>
        </div>
        <div className="bg-foreground/5 rounded-2xl p-3">
          <p className="text-[11px] text-muted-foreground">Momentum</p>
          <p className="mt-1 text-lg font-semibold">{stats.momentumScore}</p>
          <p className="text-[11px] text-muted-foreground">/ 100</p>
        </div>
      </div>
    </CardShell>
  );
}

/* ---------- Daily goals ---------- */
export function DailyGoalsCard() {
  const { goals, toggleGoal } = useAppData();
  const done = goals.filter((g) => g.done).length;
  const total = Math.max(goals.length, 1);
  return (
    <CardShell delay={0.15} href="/goals" hrefLabel="Edit goals">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Today's goals</p>
          <p className="mt-1 text-sm font-medium">
            {done} of {goals.length} complete
          </p>
        </div>
        <span className="text-gradient-brand text-2xl font-semibold">
          {Math.round((done / total) * 100)}%
        </span>
      </div>
      <Progress value={(done / total) * 100} className="mt-3 h-1.5" />
      <ul className="mt-4 space-y-2">
        {goals.slice(0, 5).map((g) => (
          <li key={g.id}>
            <button
              onClick={() => toggleGoal(g.id)}
              className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-foreground/5"
            >
              {g.done ? (
                <span className="bg-gradient-brand grid h-5 w-5 place-items-center rounded-full">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </span>
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/50" />
              )}
              <span
                className={cn(
                  "text-sm transition-colors",
                  g.done ? "text-muted-foreground line-through" : "text-foreground",
                )}
              >
                {g.label}
              </span>
            </button>
          </li>
        ))}
        {goals.length === 0 && (
          <li className="text-sm text-muted-foreground">No goals yet — add some in the Goals tab.</li>
        )}
      </ul>
    </CardShell>
  );
}

/* ---------- Quote ---------- */
export function QuoteCard() {
  return (
    <CardShell delay={0.2} className="bg-gradient-brand text-primary-foreground">
      <Quote className="h-6 w-6 opacity-70" />
      <p className="mt-3 text-lg leading-snug font-medium">
        "Small steps every day compound into the future you imagine."
      </p>
      <p className="mt-3 text-xs opacity-80">Daily reflection · 5:30 AM</p>
    </CardShell>
  );
}

/* ---------- AI companion preview ---------- */
export function CompanionCard() {
  return (
    <CardShell delay={0.25} href="/companion" hrefLabel="Open companion">
      <div className="flex items-center gap-2">
        <span className="bg-gradient-brand grid h-8 w-8 place-items-center rounded-xl shadow-glow">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </span>
        <div>
          <p className="text-sm font-semibold">Sync</p>
          <p className="text-[11px] text-muted-foreground">Your study companion</p>
        </div>
        <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="bg-foreground/5 max-w-[85%] rounded-2xl rounded-bl-md px-3 py-2 text-sm">
          Want me to summarize the chapter you just finished?
        </div>
        <div className="bg-gradient-brand ml-auto max-w-[80%] rounded-2xl rounded-br-md px-3 py-2 text-sm text-primary-foreground">
          Yes, in 3 bullets please.
        </div>
        <div className="bg-foreground/5 max-w-[90%] rounded-2xl rounded-bl-md px-3 py-2 text-sm">
          On it — drafting your summary now ✨
        </div>
      </div>
      <div className="glass mt-4 flex items-center gap-2 rounded-2xl px-3 py-2">
        <input
          placeholder="Ask Sync anything…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <Button size="icon" className="bg-gradient-brand h-7 w-7 rounded-full text-primary-foreground">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </CardShell>
  );
}

/* ---------- Productivity graph ---------- */
function useWeekData(sessions: DbSession[]) {
  return useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const days: { d: string; h: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      const seconds = sessions
        .filter((s) => s.mode === "focus" && s.completed_at.slice(0, 10) === key)
        .reduce((a, s) => a + s.duration_seconds, 0);
      days.push({
        d: labels[(day.getDay() + 6) % 7],
        h: Math.round((seconds / 3600) * 10) / 10,
      });
    }
    return days;
  }, [sessions]);
}

export function ProductivityCard() {
  const { recentSessions } = useAppData();
  const weekData = useWeekData(recentSessions);
  const totalHours = weekData.reduce((a, d) => a + d.h, 0);
  const focusToday = weekData[weekData.length - 1]?.h ?? 0;
  return (
    <CardShell delay={0.1} href="/analytics" hrefLabel="Open analytics" className="lg:col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Focus this week</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-2xl font-semibold">{totalHours.toFixed(1)}h</span>
            {focusToday > 0 && (
              <span className="mb-0.5 inline-flex items-center gap-1 text-xs text-emerald-500">
                <TrendingUp className="h-3 w-3" /> {focusToday.toFixed(1)}h today
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 h-48">
      {totalHours === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <Activity className="h-6 w-6 text-muted-foreground/60" />
          <p className="mt-2 text-sm text-muted-foreground">No focus time yet this week.</p>
          <p className="text-xs text-muted-foreground/70">Start a session — every minute counts.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weekData} margin={{ top: 10, right: 0, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.72 0.18 290)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="oklch(0.72 0.18 290)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-foreground/5" vertical={false} />
            <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }} />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--muted-foreground)" }}
              formatter={(v) => [`${v}h`, "Focus"]}
            />
            <Area type="monotone" dataKey="h" stroke="oklch(0.65 0.2 290)" strokeWidth={2.5} fill="url(#area-grad)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
      </div>
    </CardShell>
  );
}

export function SubjectBreakdownCard() {
  const { recentSessions } = useAppData();
  const data = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 86400_000;
    const within = recentSessions.filter((s) => new Date(s.completed_at).getTime() >= sevenDaysAgo);
    const bucket = { focus: 0, short: 0, long: 0 } as Record<string, number>;
    within.forEach((s) => (bucket[s.mode] = (bucket[s.mode] ?? 0) + s.duration_seconds));
    return [
      { s: "Focus", v: Math.round((bucket.focus / 3600) * 10) / 10 },
      { s: "Short", v: Math.round((bucket.short / 3600) * 10) / 10 },
      { s: "Long", v: Math.round((bucket.long / 3600) * 10) / 10 },
    ];
  }, [recentSessions]);
  const empty = data.every((d) => d.v === 0);
  return (
    <CardShell delay={0.15} href="/analytics" hrefLabel="Open analytics">
      <p className="text-xs text-muted-foreground">Time balance</p>
      <p className="mt-1 text-sm font-medium">Focus vs breaks · 7 days</p>
      <div className="mt-3 h-40">
      {empty ? (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          No sessions logged yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 0, left: -28, bottom: 0 }}>
            <XAxis dataKey="s" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }} />
            <Tooltip
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
              formatter={(v) => [`${v}h`, "Time"]}
            />
            <Bar dataKey="v" radius={[8, 8, 4, 4]} fill="oklch(0.72 0.14 230)" />
          </BarChart>
        </ResponsiveContainer>
      )}
      </div>
    </CardShell>
  );
}

/* ---------- Session history ---------- */
function formatRelative(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function formatDuration(seconds: number) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

const MODE_LABEL_MAP: Record<string, string> = {
  focus: "Focus session",
  short: "Short break",
  long: "Long break",
};

export function SessionHistoryCard() {
  const { recentSessions } = useAppData();
  const sessions = recentSessions.slice(0, 6);
  return (
    <CardShell delay={0.2} href="/analytics" hrefLabel="Open analytics" className="lg:col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Recent sessions</p>
          <p className="mt-1 text-sm font-medium">
            {sessions.length > 0 ? "Your last study blocks" : "Nothing here yet"}
          </p>
        </div>
        <Link to="/analytics" className="text-xs text-muted-foreground hover:text-foreground">
          View all
        </Link>
      </div>
      {sessions.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-1 py-6 text-center">
          <BookOpen className="h-6 w-6 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Your timeline starts with your first session.</p>
        </div>
      ) : (
      <ul className="mt-4 divide-y divide-border/40">
        {sessions.map((s, i) => (
          <motion.li
            key={s.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            className="flex items-center gap-3 py-3"
          >
            <span className="bg-foreground/5 grid h-9 w-9 shrink-0 place-items-center rounded-xl">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{MODE_LABEL_MAP[s.mode] ?? s.mode}</p>
              <p className="truncate text-xs text-muted-foreground">{formatRelative(s.completed_at)}</p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium">{formatDuration(s.duration_seconds)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground sm:hidden" />
              <span className="bg-foreground/5 rounded-full px-2 py-0.5 text-[11px] font-medium sm:hidden">
                {formatDuration(s.duration_seconds)}
              </span>
            </div>
          </motion.li>
        ))}
      </ul>
      )}
    </CardShell>
  );
}