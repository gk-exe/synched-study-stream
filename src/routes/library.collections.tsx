import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FolderHeart, Plus } from "lucide-react";
import { LibraryLayout, EmptyState, FuturePlaceholder } from "@/components/library/LibraryLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { fetchCollections, createCollection, type LearningCollection } from "@/lib/learning-db";
import { toast } from "sonner";

export const Route = createFileRoute("/library/collections")({
  component: CollectionsPage,
  head: () => ({ meta: [{ title: "Collections · Learning Hub" }] }),
});

function CollectionsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<LearningCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchCollections(user.id).then(setItems).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, [user]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    try {
      const c = await createCollection(user.id, title.trim());
      setItems((p) => [c, ...p]);
      setTitle("");
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <LibraryLayout
      title="Study collections"
      subtitle="Group notes, PDFs, decks, quizzes and explanations into one focused set."
    >
      <form onSubmit={onCreate} className="glass mb-4 flex gap-2 rounded-2xl p-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New collection title…" className="glass h-10 rounded-full" />
        <Button type="submit" className="bg-gradient-brand h-10 rounded-full px-4 text-primary-foreground shadow-glow hover:opacity-90">
          <Plus className="h-4 w-4" /><span className="ml-1 hidden sm:inline">Collection</span>
        </Button>
      </form>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={FolderHeart} title="No collections yet" description="Create one above to start grouping your study resources." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <div key={c.id} className="glass flex flex-col gap-2 rounded-3xl p-5 shadow-glow">
              <span className="bg-gradient-brand grid h-10 w-10 place-items-center rounded-2xl shadow-glow">
                <FolderHeart className="h-4 w-4 text-primary-foreground" />
              </span>
              <p className="text-sm font-semibold">{c.title}</p>
              {c.description && <p className="text-[11px] text-muted-foreground">{c.description}</p>}
            </div>
          ))}
        </div>
      )}

      <FuturePlaceholder>
        Drag-and-drop grouping of notes, PDFs, decks and quizzes into a single study set will arrive here.
      </FuturePlaceholder>
    </LibraryLayout>
  );
}