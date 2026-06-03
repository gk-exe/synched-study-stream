import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ListChecks, Plus } from "lucide-react";
import { LibraryLayout, EmptyState, FuturePlaceholder } from "@/components/library/LibraryLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { fetchQuizzes, createQuiz, type Quiz } from "@/lib/learning-db";
import { toast } from "sonner";

export const Route = createFileRoute("/library/quizzes")({
  component: QuizzesPage,
  head: () => ({ meta: [{ title: "Quizzes · Learning Hub" }] }),
});

function QuizzesPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchQuizzes(user.id).then(setQuizzes).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, [user]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    try {
      const q = await createQuiz(user.id, title.trim());
      setQuizzes((p) => [q, ...p]);
      setTitle("");
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <LibraryLayout title="Quizzes" subtitle="Quick self-checks. Questions, sessions and scoring will fill in here.">
      <form onSubmit={onCreate} className="glass mb-4 flex gap-2 rounded-2xl p-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New quiz title…" className="glass h-10 rounded-full" />
        <Button type="submit" className="bg-gradient-brand h-10 rounded-full px-4 text-primary-foreground shadow-glow hover:opacity-90">
          <Plus className="h-4 w-4" /><span className="ml-1 hidden sm:inline">Quiz</span>
        </Button>
      </form>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        </div>
      ) : quizzes.length === 0 ? (
        <EmptyState icon={ListChecks} title="No quizzes yet" description="Create a quiz above. Question editor and session player will plug in here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((q) => (
            <div key={q.id} className="glass flex flex-col gap-2 rounded-3xl p-5 shadow-glow">
              <span className="bg-gradient-brand grid h-10 w-10 place-items-center rounded-2xl shadow-glow">
                <ListChecks className="h-4 w-4 text-primary-foreground" />
              </span>
              <p className="text-sm font-semibold">{q.title}</p>
              <p className="text-[11px] text-muted-foreground">{q.source === "ai" ? "AI-generated" : "Manual"}</p>
            </div>
          ))}
        </div>
      )}

      <FuturePlaceholder>
        AI-generated quizzes from your notes, PDFs and saved explanations will land here.
      </FuturePlaceholder>
    </LibraryLayout>
  );
}