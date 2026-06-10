import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Bookmark, Mic, RefreshCw, Send, Square, Trash2 } from "lucide-react";
import { CompanionOrb } from "@/components/companion/CompanionOrb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAppData, type Mood } from "@/hooks/use-app-data";
import { useAuth } from "@/hooks/use-auth";
import { useCompanion } from "@/hooks/use-companion";
import { usePomodoro } from "@/hooks/use-pomodoro";
import {
  fetchChatHistory,
  insertChatMessage,
  clearChatHistory,
} from "@/lib/db";
import { saveExplanation } from "@/lib/learning-db";

const MOOD_PLACEHOLDERS: Record<string, string[]> = {
  calm: [
    "What feels light enough to start with today?",
    "Want to revisit anything you learned yesterday?",
    "Tell me what's on your mind — we'll take it gently.",
  ],
  focused: [
    "Ready to dive in. What are we tackling?",
    "Drop the topic — I'll break it down with you.",
    "Which subject deserves your sharpest hour today?",
  ],
  tired: [
    "Low energy is okay. Want a 5-minute mini-session?",
    "Let's pick the smallest possible next step.",
    "Tired brain? I can read, you can rest. Try me.",
  ],
  anxious: [
    "Take a breath. What's the loudest worry right now?",
    "We can shrink this together. Where do we start?",
    "I'm here. Tell me what's weighing on you.",
  ],
};

const MOOD_OPTIONS: { id: Mood; label: string; emoji: string }[] = [
  { id: "calm", label: "Calm", emoji: "🌿" },
  { id: "focused", label: "Focused", emoji: "🎯" },
  { id: "tired", label: "Tired", emoji: "🌙" },
  { id: "anxious", label: "Anxious", emoji: "🫧" },
];

const SUGGESTIONS = [
  "Quiz me on my notes",
  "Make a 30-min study plan",
  "Explain a tough concept simply",
  "Help me calm exam nerves",
  "Summarize what I just read",
  "Help me start when I can't",
];

function getMessageText(parts: { type: string; text?: string }[]) {
  return parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

export function CompanionChat() {
  const { mood, setMood } = useAppData();
  const { user } = useAuth();
  const { displayName } = useCompanion();
  const { stats } = usePomodoro();
  const [input, setInput] = useState("");
  const [voiceUiActive, setVoiceUiActive] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Keep latest mood available to the transport without rebuilding it.
  const moodRef = useRef<Mood>(mood);
  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  // Track last user message so we can persist + retry.
  const lastUserTextRef = useRef<string | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, id, body }) => ({
          body: { ...body, id, messages, mood: moodRef.current },
        }),
      }),
    [],
  );

  // Hydrate history for signed-in users.
  useEffect(() => {
    if (!user) {
      setInitialMessages([]);
      return;
    }
    let cancelled = false;
    setHistoryLoading(true);
    fetchChatHistory(user.id)
      .then((rows) => {
        if (cancelled) return;
        setInitialMessages(
          rows.map((r) => ({
            id: r.id,
            role: r.role as "user" | "assistant",
            parts: [{ type: "text", text: r.content }],
          })) as UIMessage[],
        );
      })
      .catch((e) => toast.error(e.message ?? "Couldn't load chat history"))
      .finally(() => !cancelled && setHistoryLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const { messages, sendMessage, status, stop, error, regenerate, setMessages } = useChat({
    transport,
    messages: initialMessages ?? [],
    onFinish: ({ message }) => {
      if (!user || message.role !== "assistant") return;
      const text = getMessageText(message.parts);
      if (!text) return;
      insertChatMessage(user.id, "assistant", text, moodRef.current).catch(() => {
        /* non-blocking */
      });
    },
  });

  // When history finishes loading after the hook is mounted, sync it in.
  useEffect(() => {
    if (initialMessages && initialMessages.length && messages.length === 0) {
      setMessages(initialMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessages]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [status]);

  useEffect(() => {
    if (error) toast.error(error.message || "Something went wrong");
  }, [error]);

  const placeholders = MOOD_PLACEHOLDERS[mood];
  const placeholder = placeholders[messages.length % placeholders.length];
  const busy = status === "submitted" || status === "streaming";

  const handleSend = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || busy) return;
    lastUserTextRef.current = value;
    sendMessage({ text: value });
    setInput("");
    if (user) {
      insertChatMessage(user.id, "user", value, moodRef.current).catch(() => {
        /* non-blocking */
      });
    }
  };

  const handleRetry = () => {
    if (busy) return;
    regenerate();
  };

  const handleClear = async () => {
    setMessages([]);
    if (user) {
      try {
        await clearChatHistory(user.id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Couldn't clear history";
        toast.error(msg);
      }
    }
  };

  const handleVoiceClick = () => {
    setVoiceUiActive((v) => !v);
    toast("Voice input coming soon", {
      description: "We're tuning it to your study vibe.",
    });
    setTimeout(() => setVoiceUiActive(false), 1400);
  };

  // Bridge: any assistant reply can become a saved explanation in the
  // Learning Hub. This is what makes Tutor ↔ Companion ↔ Library feel
  // like one workflow rather than three separate features.
  const handleSaveExplanation = async (message: UIMessage) => {
    if (!user) {
      toast("Sign in to save explanations to your library.");
      return;
    }
    const content = getMessageText(message.parts);
    if (!content.trim()) return;
    // Use the immediately preceding user message as the source question.
    const idx = messages.findIndex((m) => m.id === message.id);
    const prior = idx > 0 ? messages[idx - 1] : null;
    const source = prior && prior.role === "user" ? getMessageText(prior.parts) : null;
    const title = source ? source.slice(0, 80) : "Saved from companion";
    try {
      await saveExplanation(user.id, { content, source_question: source, title });
      setSavedIds((s) => new Set(s).add(message.id));
      toast.success("Saved to your library", { description: "Find it under Explanations." });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("studysync:explanation-saved", { detail: { title } }),
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass mb-4 flex items-center gap-3 rounded-3xl p-4 shadow-glow"
      >
        <div className="relative">
          <CompanionOrb
            size={52}
            state={busy ? "speaking" : "resting"}
            themeId={stats?.companionTheme}
          />
          <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">
            Your calm study partner
          </p>
        </div>
        <div className="hidden gap-1 sm:flex">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs transition-all",
                mood === m.id
                  ? "bg-gradient-brand text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-foreground/5",
              )}
            >
              <span className="mr-1">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="ml-1 grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition-all hover:bg-foreground/5 hover:text-foreground"
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </motion.header>

      {/* Mood pills - mobile */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto sm:hidden">
        {MOOD_OPTIONS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMood(m.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs transition-all",
              mood === m.id
                ? "bg-gradient-brand text-primary-foreground shadow-glow"
                : "glass text-muted-foreground",
            )}
          >
            <span className="mr-1">{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="glass flex-1 overflow-y-auto rounded-3xl p-4 sm:p-6"
      >
        {historyLoading && messages.length === 0 ? (
          <HistorySkeleton />
        ) : messages.length === 0 ? (
          <EmptyState mood={mood} onPick={handleSend} />
        ) : (
          <ul className="space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((m: UIMessage) => (
                <motion.li
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex gap-3",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {m.role === "assistant" && (
                    <CompanionOrb
                      size={36}
                      state="resting"
                      themeId={stats?.companionTheme}
                      className="mt-1 shrink-0"
                    />
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[75%]",
                      m.role === "user"
                        ? "bg-gradient-brand rounded-br-md text-primary-foreground shadow-glow"
                        : "bg-foreground/5 rounded-bl-md text-foreground",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{getMessageText(m.parts)}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{getMessageText(m.parts)}</p>
                    )}
                    {m.role === "assistant" && getMessageText(m.parts).length > 24 && (
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => handleSaveExplanation(m)}
                          disabled={savedIds.has(m.id)}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:opacity-60"
                          aria-label="Save to library"
                        >
                          <Bookmark className="h-3 w-3" />
                          {savedIds.has(m.id) ? "Saved" : "Save to library"}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>

            {status === "submitted" && <TypingBubble themeId={stats?.companionTheme} />}

            {error && !busy && (
              <motion.li
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center"
              >
                <button
                  onClick={handleRetry}
                  className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs text-muted-foreground transition-all hover:-translate-y-0.5 hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Couldn't reach Sync. Retry?
                </button>
              </motion.li>
            )}
          </ul>
        )}
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="glass rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-all hover:-translate-y-0.5 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="glass mt-3 flex items-end gap-2 rounded-3xl p-2 shadow-glow"
      >
        <button
          type="button"
          onClick={handleVoiceClick}
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-2xl transition-all",
            voiceUiActive
              ? "bg-gradient-brand text-primary-foreground shadow-glow"
              : "bg-foreground/5 text-muted-foreground hover:text-foreground",
          )}
          aria-label="Voice input"
        >
          <Mic className={cn("h-4 w-4", voiceUiActive && "animate-pulse")} />
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          placeholder={placeholder}
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        {busy ? (
          <Button
            type="button"
            onClick={stop}
            size="icon"
            className="bg-foreground/10 h-10 w-10 shrink-0 rounded-2xl text-foreground hover:bg-foreground/15"
            aria-label="Stop"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            className="bg-gradient-brand h-10 w-10 shrink-0 rounded-2xl text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}

function TypingBubble({ themeId }: { themeId?: string | null }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <CompanionOrb size={36} state="speaking" themeId={themeId} className="mt-1 shrink-0" />
      <div className="bg-foreground/5 flex items-center gap-1.5 rounded-2xl rounded-bl-md px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-foreground/50"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.li>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn("flex gap-3", i % 2 === 0 ? "justify-start" : "justify-end")}
        >
          <div
            className={cn(
              "bg-foreground/5 h-12 animate-pulse rounded-2xl",
              i % 2 === 0 ? "w-2/3" : "w-1/2",
            )}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  mood,
  onPick,
}: {
  mood: keyof typeof MOOD_PLACEHOLDERS;
  onPick: (s: string) => void;
}) {
  const greetings: Record<string, string> = {
    calm: "Hi, I'm here whenever you are.",
    focused: "Let's make this a great session.",
    tired: "Soft start today. No pressure.",
    anxious: "Breathe. We'll go one tiny step at a time.",
  };
  return (
    <div className="grid h-full place-items-center">
      <div className="max-w-md text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-brand mx-auto grid h-16 w-16 place-items-center rounded-3xl shadow-glow"
        >
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </motion.div>
        <motion.h2
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-xl font-semibold tracking-tight"
        >
          {greetings[mood]}
        </motion.h2>
        <motion.p
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-1 text-sm text-muted-foreground"
        >
          Ask anything — a concept, a plan, or just how you feel.
        </motion.p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.slice(0, 4).map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="glass rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-all hover:-translate-y-0.5 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}