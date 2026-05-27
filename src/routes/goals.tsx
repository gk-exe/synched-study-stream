import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, Plus, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAppData } from "@/hooks/use-app-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/goals")({
  component: GoalsPage,
  head: () => ({
    meta: [
      { title: "Goals · StudySync AI" },
      { name: "description", content: "Edit and track your daily study goals." },
    ],
  }),
});

function GoalsPage() {
  const { goals, addGoal, toggleGoal, removeGoal } = useAppData();
  const [draft, setDraft] = useState("");
  const done = goals.filter((g) => g.done).length;
  const total = Math.max(goals.length, 1);
  const pct = Math.round((done / total) * 100);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    addGoal(draft);
    setDraft("");
  };

  return (
    <DashboardShell>
      <div className="mb-4">
        <p className="text-xs text-muted-foreground">Today's intentions</p>
        <h1 className="text-xl font-semibold tracking-tight">Daily goals</h1>
      </div>

      <div className="glass rounded-3xl p-5 shadow-glow">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {done} of {goals.length} complete
          </p>
          <span className="text-gradient-brand text-2xl font-semibold">{pct}%</span>
        </div>
        <Progress value={pct} className="mt-3 h-1.5" />

        <form onSubmit={submit} className="mt-5 flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a goal for today…"
            className="glass h-11 flex-1 rounded-full px-4"
          />
          <Button
            type="submit"
            className="bg-gradient-brand h-11 rounded-full px-4 text-primary-foreground shadow-glow hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </form>

        <ul className="mt-5 space-y-2">
          <AnimatePresence initial={false}>
            {goals.map((g) => (
              <motion.li
                key={g.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-foreground/5"
              >
                <button
                  onClick={() => toggleGoal(g.id)}
                  className="flex flex-1 items-center gap-3 text-left"
                  aria-label={g.done ? "Mark incomplete" : "Mark complete"}
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
                <button
                  onClick={() => removeGoal(g.id)}
                  className="rounded-full p-1.5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-foreground/10 hover:text-foreground"
                  aria-label="Remove goal"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
          {goals.length === 0 && (
            <li className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
              Nothing yet. Add your first goal above.
            </li>
          )}
        </ul>
      </div>
    </DashboardShell>
  );
}