import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import {
  Pause,
  Play,
  RotateCcw,
  Send,
  SkipForward,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MODE_LABEL,
  MODE_MINUTES,
  usePomodoro,
  type PomodoroMode,
} from "@/hooks/use-pomodoro";
import { useAppData } from "@/hooks/use-app-data";
import { CompanionOrb, type OrbState } from "@/components/companion/CompanionOrb";

const TUTOR_PROMPTS = [
  "Walk me through this step-by-step",
  "I'm stuck — where should I start?",
  "Explain this like I'm new to it",
  "Quiz me gently on what I just read",
];

function getText(parts: { type: string; text?: string }[]) {
  return parts.filter((p) => p.type === "text").map((p) => p.text ?? "").join("");
}

export function FocusMode() {
  const {
    mode,
    setMode,
    remaining,
    total,
    running,
    start,
    pause,
    reset,
    skip,
    stats,
    setCurrentTask,
  } = usePomodoro();
  const { mood } = useAppData();
  const [panelOpen, setPanelOpen] = useState(false);
  const [input, setInput] = useState("");
  const [taskInput, setTaskInput] = useState(stats.currentTask ?? "");
  const [editingTask, setEditingTask] = useState(false);

  // Keep local input in sync when stats hydrate from cloud
  useEffect(() => {
    if (!editingTask) setTaskInput(stats.currentTask ?? "");
  }, [stats.currentTask, editingTask]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = total === 0 ? 0 : ((total - remaining) / total) * 100;
  const r = 92;
  const c = 2 * Math.PI * r;
  const modes: PomodoroMode[] = ["focus", "short", "long"];

  const moodRef = useRef(mood);
  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, id, body }) => ({
          body: { ...body, id, messages, mood: moodRef.current, tutor: true },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport,
  });

  const busy = status === "submitted" || status === "streaming";

  const orbState: OrbState = busy
    ? "speaking"
    : panelOpen
      ? "listening"
      : running && mode === "focus"
        ? "idle"
        : "resting";

  const handleAsk = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || busy) return;
    if (!panelOpen) setPanelOpen(true);
    sendMessage({ text: value });
    setInput("");
  };

  const handleClose = () => {
    setPanelOpen(false);
    stop();
    setTimeout(() => setMessages([]), 300);
  };

  return (
    <div className="relative -mt-2">
      {/* Ambient gradient backdrop */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 30%, oklch(0.72 0.18 290 / 0.18), transparent 70%), radial-gradient(50% 40% at 70% 80%, oklch(0.72 0.14 230 / 0.15), transparent 70%)",
        }}
      />

      <div
        className={cn(
          "grid gap-6 transition-all duration-500",
          panelOpen ? "lg:grid-cols-[1fr_minmax(0,420px)]" : "lg:grid-cols-1",
        )}
      >
        {/* Companion scene */}
        <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center text-center">
          {/* Mode pills */}
          <div className="glass mb-6 flex items-center gap-1 rounded-full p-1 text-xs">
            {modes.map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-full px-3 py-1.5 transition-colors",
                  mode === m
                    ? "bg-gradient-brand text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>

          {/* Current task — persistent across sessions */}
          <div className="mb-6 w-full max-w-md">
            {editingTask || !stats.currentTask ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setCurrentTask(taskInput);
                  setEditingTask(false);
                }}
                className="glass flex items-center gap-2 rounded-full p-1.5"
              >
                <input
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="What are you working on?"
                  autoFocus={editingTask}
                  className="flex-1 bg-transparent px-4 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-xs"
                >
                  Set
                </Button>
              </form>
            ) : (
              <button
                onClick={() => setEditingTask(true)}
                className="glass flex w-full items-center justify-between rounded-full px-4 py-2 text-left text-sm"
              >
                <span className="text-muted-foreground">Studying</span>
                <span className="mx-2 truncate font-medium">{stats.currentTask}</span>
                <span className="text-[11px] text-muted-foreground hover:text-foreground">Edit</span>
              </button>
            )}
          </div>

          {/* Orb + ring */}
          <div className="relative grid place-items-center">
            <svg width="260" height="260" className="-rotate-90">
              <circle
                cx="130"
                cy="130"
                r={r}
                stroke="currentColor"
                className="text-foreground/10"
                strokeWidth="4"
                fill="none"
              />
              <motion.circle
                cx="130"
                cy="130"
                r={r}
                stroke="url(#focus-ring-grad)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={c}
                animate={{ strokeDashoffset: c - (pct / 100) * c }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="focus-ring-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.72 0.18 290)" />
                  <stop offset="100%" stopColor="oklch(0.78 0.13 220)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute">
              <CompanionOrb state={orbState} themeId={stats.companionTheme} size={180} />
            </div>
          </div>

          {/* Timer */}
          <div className="mt-8">
            <div className="font-mono text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
              {mm}:{ss}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {MODE_LABEL[mode]} · {MODE_MINUTES[mode]} min
            </p>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center gap-2">
            <Button
              onClick={() => (running ? pause() : start())}
              className="bg-gradient-brand rounded-full px-6 text-primary-foreground shadow-glow hover:opacity-90"
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? "Pause" : remaining === total ? "Begin" : "Resume"}
            </Button>
            <Button
              variant="ghost"
              onClick={reset}
              className="rounded-full"
              aria-label="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={skip}
              className="rounded-full"
              aria-label="Skip"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Calm ask bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="glass mt-10 flex w-full max-w-md items-center gap-2 rounded-full p-1.5 shadow-glow"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Sync — quietly, anytime"
              className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || busy}
              className="bg-gradient-brand h-9 w-9 shrink-0 rounded-full text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-40"
              aria-label="Ask"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {!panelOpen && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {TUTOR_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleAsk(p)}
                  className="glass rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-all hover:-translate-y-0.5 hover:text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tutoring panel */}
        <AnimatePresence>
          {panelOpen && (
            <motion.aside
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="glass flex h-[calc(100vh-10rem)] flex-col rounded-3xl p-4 shadow-glow"
            >
              <header className="mb-3 flex items-center gap-2 px-1">
                <span className="bg-gradient-brand grid h-8 w-8 place-items-center rounded-xl shadow-glow">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Guided explanation</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    Step-by-step · stays beside your focus
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto px-1 pb-2">
                {messages.map((m: UIMessage) => (
                  <MessageRow key={m.id} message={m} />
                ))}
                {status === "submitted" && <ThinkingRow />}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAsk();
                }}
                className="mt-2 flex items-center gap-2 rounded-2xl bg-foreground/5 p-1.5"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Where are you stuck?"
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || busy}
                  className="bg-gradient-brand h-8 w-8 shrink-0 rounded-xl text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------- Progressive word-by-word rendering ---------- */

function MessageRow({ message }: { message: UIMessage }) {
  const text = getText(message.parts);
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-gradient-brand max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2 text-sm text-primary-foreground shadow-glow">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <span className="bg-gradient-brand mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg shadow-glow">
        <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
      </span>
      <div className="bg-foreground/5 max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2 text-sm leading-relaxed">
        <ProgressiveMarkdown text={text} />
      </div>
    </div>
  );
}

/**
 * Renders streamed assistant text with a quiet word-by-word fade.
 * Markdown is rendered for the full text; the word fade is a thin overlay
 * effect applied per-word as new tokens arrive.
 */
function ProgressiveMarkdown({ text }: { text: string }) {
  // Split tokens, preserving whitespace
  const tokens = useMemo(() => text.split(/(\s+)/), [text]);
  // Track last-rendered count to only animate newly arrived words
  const seenRef = useRef(0);
  const firstSeen = seenRef.current;
  useEffect(() => {
    seenRef.current = tokens.length;
  });

  if (!text) return null;

  // If the content contains markdown blocks (lists, headings, code), render plain markdown
  const hasBlocks = /(^|\n)\s*(#{1,6}\s|[-*+]\s|\d+\.\s|```)/.test(text);
  if (hasBlocks) {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    );
  }

  return (
    <p className="whitespace-pre-wrap">
      {tokens.map((t, i) => {
        if (/^\s+$/.test(t)) return <span key={i}>{t}</span>;
        const isNew = i >= firstSeen;
        return (
          <motion.span
            key={i}
            initial={isNew ? { opacity: 0, y: 2 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {t}
          </motion.span>
        );
      })}
    </p>
  );
}

function ThinkingRow() {
  return (
    <div className="flex gap-2">
      <span className="bg-gradient-brand mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg shadow-glow">
        <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
      </span>
      <div className="bg-foreground/5 flex items-center gap-1.5 rounded-2xl rounded-bl-md px-3.5 py-2.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-foreground/50"
            animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}