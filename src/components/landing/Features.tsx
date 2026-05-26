import { motion } from "framer-motion";
import { Brain, NotebookPen, Sparkles, Timer, Waves, MessagesSquare } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Smart recall",
    desc: "Adaptive flashcards that learn what you forget — and quietly bring it back.",
  },
  {
    icon: NotebookPen,
    title: "Notes that think",
    desc: "Drop in lectures or PDFs. Get summaries, mind maps, and Q&A instantly.",
  },
  {
    icon: Timer,
    title: "Flow sessions",
    desc: "Ambient focus timers tuned to your energy. No anxiety, just rhythm.",
  },
  {
    icon: MessagesSquare,
    title: "Always-on tutor",
    desc: "Ask anything, anytime. A calm AI companion that explains, not overwhelms.",
  },
  {
    icon: Waves,
    title: "Mood-aware breaks",
    desc: "Gentle nudges to breathe, stretch, and reset before burnout hits.",
  },
  {
    icon: Sparkles,
    title: "One synced space",
    desc: "Notes, tasks, and goals — beautifully connected across every device.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-gradient-brand text-sm font-medium uppercase tracking-widest">
            Features
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Built to keep you in the flow.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every feature is shaped around how Gen-Z actually studies — soft, smart, and never shouty.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="glass group relative overflow-hidden rounded-3xl p-6 transition-transform hover:-translate-y-1"
            >
              <div
                aria-hidden
                className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-60"
                style={{ background: "var(--gradient-brand)" }}
              />
              <div className="bg-gradient-brand mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl text-primary-foreground shadow-glow">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}