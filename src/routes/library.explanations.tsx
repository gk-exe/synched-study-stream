import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, Heart, Search, Trash2 } from "lucide-react";
import { LibraryLayout, EmptyState } from "@/components/library/LibraryLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchExplanations,
  toggleExplanationFavorite,
  deleteExplanation,
  type SavedExplanation,
} from "@/lib/learning-db";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library/explanations")({
  component: ExplanationsPage,
  head: () => ({ meta: [{ title: "Saved explanations · Learning Hub" }] }),
});

function ExplanationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<SavedExplanation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchExplanations(user.id).then(setItems).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, [user]);

  const folders = useMemo(() => Array.from(new Set(items.map((i) => i.folder).filter(Boolean))) as string[], [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (folder && it.folder !== folder) return false;
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        it.content.toLowerCase().includes(q) ||
        (it.source_question ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, query, folder]);

  async function onFav(it: SavedExplanation) {
    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, favorite: !it.favorite } : x)));
    try { await toggleExplanationFavorite(it.id, !it.favorite); } catch (e: any) { toast.error(e.message); }
  }
  async function onDelete(it: SavedExplanation) {
    setItems((prev) => prev.filter((x) => x.id !== it.id));
    try { await deleteExplanation(it.id); } catch (e: any) { toast.error(e.message); }
  }

  return (
    <LibraryLayout title="Saved explanations" subtitle="What Sync taught you, saved for later review.">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search explanations…" className="glass h-10 rounded-full pl-9" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          <button onClick={() => setFolder(null)} className={cn("rounded-full px-3 py-1.5 text-xs", !folder ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass text-muted-foreground")}>All</button>
          {folders.map((f) => (
            <button key={f} onClick={() => setFolder(f)} className={cn("rounded-full px-3 py-1.5 text-xs", folder === f ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass text-muted-foreground")}>{f}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="When Sync explains something useful in Focus mode, save it and it'll show up here."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((it) => (
            <div key={it.id} className="glass flex flex-col gap-2 rounded-3xl p-4 shadow-glow">
              <div className="flex items-start gap-2">
                <p className="flex-1 text-sm font-semibold">{it.title}</p>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => onFav(it)} aria-label="Favorite">
                  <Heart className={cn("h-4 w-4", it.favorite && "fill-primary text-primary")} />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full text-destructive" onClick={() => onDelete(it)} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {it.source_question && (
                <p className="text-[11px] italic text-muted-foreground">Q: {it.source_question}</p>
              )}
              <p className="line-clamp-5 text-xs text-foreground/80">{it.content}</p>
              {it.folder && (
                <span className="self-start rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{it.folder}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </LibraryLayout>
  );
}