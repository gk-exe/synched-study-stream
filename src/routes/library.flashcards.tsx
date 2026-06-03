import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layers, Plus } from "lucide-react";
import { LibraryLayout, EmptyState, FuturePlaceholder } from "@/components/library/LibraryLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { fetchDecks, createDeck, type FlashcardDeck } from "@/lib/learning-db";
import { toast } from "sonner";

export const Route = createFileRoute("/library/flashcards")({
  component: FlashcardsPage,
  head: () => ({ meta: [{ title: "Flashcards · Learning Hub" }] }),
});

function FlashcardsPage() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [reviewing, setReviewing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchDecks(user.id).then(setDecks).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, [user]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    try {
      const d = await createDeck(user.id, title.trim());
      setDecks((prev) => [d, ...prev]);
      setTitle("");
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <LibraryLayout title="Flashcards" subtitle="Spaced-repetition decks to make it stick.">
      <form onSubmit={onCreate} className="glass mb-4 flex gap-2 rounded-2xl p-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New deck title…" className="glass h-10 rounded-full" />
        <Button type="submit" className="bg-gradient-brand h-10 rounded-full px-4 text-primary-foreground shadow-glow hover:opacity-90">
          <Plus className="h-4 w-4" /><span className="ml-1 hidden sm:inline">Deck</span>
        </Button>
      </form>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        </div>
      ) : decks.length === 0 ? (
        <EmptyState icon={Layers} title="No decks yet" description="Create your first deck above. Cards and review sessions live inside each deck." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((d) => (
            <button
              key={d.id}
              onClick={() => setReviewing(d.id)}
              className="glass flex flex-col gap-2 rounded-3xl p-5 text-left shadow-glow transition-transform hover:-translate-y-0.5"
            >
              <span className="bg-gradient-brand grid h-10 w-10 place-items-center rounded-2xl shadow-glow">
                <Layers className="h-4 w-4 text-primary-foreground" />
              </span>
              <p className="text-sm font-semibold">{d.title}</p>
              <p className="text-[11px] text-muted-foreground">{d.source === "ai" ? "AI-generated" : "Manual deck"}</p>
            </button>
          ))}
        </div>
      )}

      {reviewing && (
        <div className="glass mt-6 rounded-3xl p-6 text-center">
          <p className="text-xs text-muted-foreground">Review session</p>
          <h3 className="mt-1 text-base font-semibold">The review experience lives here.</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Spaced-repetition scheduling (SM-2) is already wired in <code>scheduleNext</code>.
            The card viewer UI will plug into this slot.
          </p>
          <Button variant="ghost" className="mt-3 rounded-full" onClick={() => setReviewing(null)}>Close</Button>
        </div>
      )}

      <FuturePlaceholder>
        AI-generated decks from your notes and PDFs will land here.
      </FuturePlaceholder>
    </LibraryLayout>
  );
}