import { useState } from "react";
import { motion } from "framer-motion";
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

const card =
  "glass relative overflow-hidden rounded-3xl p-5 shadow-glow transition-all duration-300 hover:-translate-y-0.5";

function CardShell({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={cn(card, className)}
    >
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
    <CardShell delay={0.05}>
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
    <CardShell delay={0.1} className="flex flex-col items-center text-center">
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
    <CardShell delay={0.12}>
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
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="bg-foreground/5 rounded-2xl p-3">
          <p className="text-[11px] text-muted-foreground">Today</p>
          <p className="mt-1 text-lg font-semibold">{stats.completedToday}</p>
          <p className="text-[11px] text-muted-foreground">focus sessions</p>
        </div>
        <div className="bg-foreground/5 rounded-2xl p-3">
          <p className="text-[11px] text-muted-foreground">All time</p>
          <p className="mt-1 text-lg font-semibold">{stats.totalFocusSessions}</p>
          <p className="text-[11px] text-muted-foreground">completed</p>
        </div>
      </div>
    </CardShell>
  );
}

/* ---------- Daily goals ---------- */
const goalList = [
  { label: "Review organic chemistry notes", done: true },
  { label: "Solve 10 calculus problems", done: true },
  { label: "Read chapter 4 of psychology", done: false },
  { label: "Practice Spanish vocab · 15 min", done: false },
];

export function DailyGoalsCard() {
  const [goals, setGoals] = useState(goalList);
  const done = goals.filter((g) => g.done).length;
  return (
    <CardShell delay={0.15}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Today's goals</p>
          <p className="mt-1 text-sm font-medium">
            {done} of {goals.length} complete
          </p>
        </div>
        <span className="text-gradient-brand text-2xl font-semibold">
          {Math.round((done / goals.length) * 100)}%
        </span>
      </div>
      <Progress value={(done / goals.length) * 100} className="mt-3 h-1.5" />
      <ul className="mt-4 space-y-2">
        {goals.map((g, i) => (
          <li key={i}>
            <button
              onClick={() =>
                setGoals((prev) => prev.map((p, idx) => (idx === i ? { ...p, done: !p.done } : p)))
              }
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
    <CardShell delay={0.25}>
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
const weekData = [
  { d: "Mon", h: 2.4 },
  { d: "Tue", h: 3.1 },
  { d: "Wed", h: 4.2 },
  { d: "Thu", h: 2.8 },
  { d: "Fri", h: 3.6 },
  { d: "Sat", h: 1.6 },
  { d: "Sun", h: 2.9 },
];

export function ProductivityCard() {
  return (
    <CardShell delay={0.1} className="lg:col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Focus this week</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-2xl font-semibold">20.6h</span>
            <span className="mb-0.5 inline-flex items-center gap-1 text-xs text-emerald-500">
              <TrendingUp className="h-3 w-3" /> +18%
            </span>
          </div>
        </div>
        <div className="hidden gap-2 sm:flex">
          {["Week", "Month", "Year"].map((t, i) => (
            <button
              key={t}
              className={cn(
                "rounded-full px-3 py-1 text-xs transition-colors",
                i === 0
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-foreground/5",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-48">
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
      </div>
    </CardShell>
  );
}

const subjectData = [
  { s: "Math", v: 8 },
  { s: "Chem", v: 5 },
  { s: "Psych", v: 4 },
  { s: "Span", v: 3 },
];

export function SubjectBreakdownCard() {
  return (
    <CardShell delay={0.15}>
      <p className="text-xs text-muted-foreground">By subject</p>
      <p className="mt-1 text-sm font-medium">Hours this week</p>
      <div className="mt-3 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={subjectData} margin={{ top: 6, right: 0, left: -28, bottom: 0 }}>
            <XAxis dataKey="s" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }} />
            <Tooltip
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
              formatter={(v) => [`${v}h`, "Focus"]}
            />
            <Bar dataKey="v" radius={[8, 8, 4, 4]} fill="oklch(0.72 0.14 230)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  );
}

/* ---------- Session history ---------- */
const sessions = [
  { subject: "Calculus", topic: "Integration by parts", duration: "45 min", when: "Today, 2:15 PM", focus: 94 },
  { subject: "Chemistry", topic: "Organic reactions", duration: "30 min", when: "Today, 11:00 AM", focus: 88 },
  { subject: "Psychology", topic: "Memory & attention", duration: "1 h 10 min", when: "Yesterday", focus: 76 },
  { subject: "Spanish", topic: "Subjunctive mood", duration: "20 min", when: "Yesterday", focus: 82 },
];

export function SessionHistoryCard() {
  return (
    <CardShell delay={0.2} className="lg:col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Recent sessions</p>
          <p className="mt-1 text-sm font-medium">Your last study blocks</p>
        </div>
        <Button variant="ghost" size="sm" className="rounded-full text-xs">
          View all
        </Button>
      </div>
      <ul className="mt-4 divide-y divide-border/40">
        {sessions.map((s, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            className="flex items-center gap-3 py-3"
          >
            <span className="bg-foreground/5 grid h-9 w-9 shrink-0 place-items-center rounded-xl">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.subject}</p>
              <p className="truncate text-xs text-muted-foreground">{s.topic}</p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium">{s.duration}</p>
              <p className="text-[11px] text-muted-foreground">{s.when}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground sm:hidden" />
              <span className="bg-foreground/5 rounded-full px-2 py-0.5 text-[11px] font-medium">
                {s.focus}%
              </span>
            </div>
          </motion.li>
        ))}
      </ul>
    </CardShell>
  );
}