import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthShell } from "@/components/landing/AuthShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchOnboarded, setCachedOnboarded } from "@/lib/onboarding";
import { CompanionOrb } from "@/components/companion/CompanionOrb";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({ meta: [{ title: "Onboarding — StudySync AI" }] }),
});

const GOALS = ["Ace upcoming exam", "Stay consistent", "Learn deeper", "Beat procrastination", "Improve focus"];
const SUBJECTS = ["Math", "Science", "Biology", "Chemistry", "Physics", "History", "Languages", "Programming", "Economics", "Law"];
const EXAMS = ["SAT / ACT", "AP / IB", "University finals", "GRE / GMAT", "Professional cert", "None — just learning"];
const STYLES = [
  { id: "visual", title: "Visual", desc: "Mind maps, diagrams, color." },
  { id: "auditory", title: "Auditory", desc: "Lectures, voice notes, recall." },
  { id: "reading", title: "Reading / writing", desc: "Notes, essays, summaries." },
  { id: "practice", title: "Hands-on", desc: "Practice problems, flashcards." },
];

function OnboardingPage() {
  return (
    <ThemeProvider>
      <OnboardingInner />
    </ThemeProvider>
  );
}

function OnboardingInner() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [exam, setExam] = useState<string>("");
  const [style, setStyle] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  // If the user already completed onboarding, skip straight to the dashboard.
  useEffect(() => {
    if (!user) return;
    fetchOnboarded(user.id)
      .then((done) => {
        if (done) navigate({ to: "/dashboard" });
      })
      .catch(() => {
        /* ignore — let the user proceed through onboarding */
      });
  }, [user, navigate]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, v: string) =>
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const steps = [
    {
      title: "What are your study goals?",
      sub: "Pick anything that resonates.",
      valid: goals.length > 0,
      body: (
        <ChipGrid items={GOALS} selected={goals} onToggle={(v) => toggle(goals, setGoals, v)} />
      ),
    },
    {
      title: "Which subjects are on your plate?",
      sub: "Choose all that apply.",
      valid: subjects.length > 0,
      body: (
        <ChipGrid items={SUBJECTS} selected={subjects} onToggle={(v) => toggle(subjects, setSubjects, v)} />
      ),
    },
    {
      title: "Any exam coming up?",
      sub: "We'll shape your study rhythm around it.",
      valid: !!exam,
      body: (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {EXAMS.map((e) => (
            <SelectCard key={e} active={exam === e} onClick={() => setExam(e)}>
              {e}
            </SelectCard>
          ))}
        </div>
      ),
    },
    {
      title: "How do you learn best?",
      sub: "We'll tune the tone and pace to you.",
      valid: !!style,
      body: (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {STYLES.map((s) => (
            <SelectCard key={s.id} active={style === s.id} onClick={() => setStyle(s.id)}>
              <div className="text-sm font-medium">{s.title}</div>
              <div className="text-xs text-muted-foreground">{s.desc}</div>
            </SelectCard>
          ))}
        </div>
      ),
    },
    {
      title: "Meet Sync",
      sub: "Your calm, ever-present study companion.",
      valid: true,
      body: (
        <div className="flex flex-col items-center text-center">
          <CompanionOrb size={160} state="celebrate" expression="smile" />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Sync sits quietly beside you as you study. Finish focus sessions to
            grow together, unlock new presences, and build a streak that
            actually feels like progress.
          </p>
          <ul className="mt-5 grid w-full max-w-sm gap-2 text-left text-sm">
            <li className="glass rounded-2xl px-3 py-2">
              🎯 <span className="font-medium">Focus Mode</span> — calm 25-min sessions, gently guided.
            </li>
            <li className="glass rounded-2xl px-3 py-2">
              ✨ <span className="font-medium">Sync grows with you</span> — levels, moods, and rewards.
            </li>
            <li className="glass rounded-2xl px-3 py-2">
              📚 <span className="font-medium">Library</span> — save anything Sync explains for later.
            </li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Come back tomorrow — your streak (and Sync) will be waiting.
          </p>
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        study_goals: goals,
        subjects,
        exam_type: exam,
        study_style: style,
        onboarded: true,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    setCachedOnboarded(true);
    toast.success("You're all set ✨");
    navigate({ to: "/dashboard" });
  };

  if (loading || !user) return null;

  return (
    <AuthShell title={current.title} subtitle={current.sub}>
      <div className="mb-5 flex items-center gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= step ? "bg-gradient-brand" : "bg-border",
            )}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {current.body}
        </motion.div>
      </AnimatePresence>
      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep(step - 1)} className="glass h-11 flex-1 rounded-full">
            Back
          </Button>
        )}
        <Button
          disabled={!current.valid || saving}
          onClick={() => (isLast ? finish() : setStep(step + 1))}
          className="bg-gradient-brand h-11 flex-1 rounded-full text-primary-foreground shadow-glow hover:opacity-90"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLast ? "Finish" : "Continue"}
          {!isLast && !saving && <ArrowRight className="ml-1 h-4 w-4" />}
        </Button>
      </div>
    </AuthShell>
  );
}

function ChipGrid({
  items,
  selected,
  onToggle,
}: {
  items: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = selected.includes(item);
        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={cn(
              "glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-all",
              active && "bg-gradient-brand text-primary-foreground shadow-glow",
            )}
          >
            {active && <Check className="h-3.5 w-3.5" />}
            {item}
          </button>
        );
      })}
    </div>
  );
}

function SelectCard({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "glass rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5",
        active && "ring-2 ring-primary shadow-glow",
      )}
    >
      {children}
    </button>
  );
}