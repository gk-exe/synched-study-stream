import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Search, Trash2, Pin, PinOff } from "lucide-react";
import { LibraryLayout, EmptyState, FuturePlaceholder } from "@/components/library/LibraryLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
  type Note,
} from "@/lib/learning-db";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library/notes")({
  component: NotesPage,
  head: () => ({ meta: [{ title: "Notes · Learning Hub" }] }),
});

function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchNotes(user.id)
      .then((rows) => {
        setNotes(rows);
        setActiveId(rows[0]?.id ?? null);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [notes, query]);

  const active = notes.find((n) => n.id === activeId) ?? null;

  async function handleCreate() {
    if (!user) return;
    try {
      const n = await createNote(user.id, { title: "Untitled note" });
      setNotes((prev) => [n, ...prev]);
      setActiveId(n.id);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function patchActive(patch: Partial<Note>) {
    if (!active) return;
    setNotes((prev) => prev.map((n) => (n.id === active.id ? { ...n, ...patch } : n)));
    try {
      await updateNote(active.id, patch as any);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleDelete(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(null);
    try {
      await deleteNote(id);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <LibraryLayout
      title="Notes"
      subtitle="Write, tag and revisit your study notes."
      actions={
        <Button onClick={handleCreate} className="bg-gradient-brand h-10 rounded-full px-4 text-primary-foreground shadow-glow hover:opacity-90">
          <Plus className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">New note</span>
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="glass flex flex-col gap-3 rounded-3xl p-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes…"
              className="glass h-10 rounded-full pl-9 text-sm"
            />
          </div>
          <div className="-mr-1 flex flex-col gap-1 overflow-y-auto pr-1" style={{ maxHeight: "60vh" }}>
            {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            {!loading && filtered.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">No notes match.</p>
            )}
            <AnimatePresence initial={false}>
              {filtered.map((n) => (
                <motion.button
                  key={n.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setActiveId(n.id)}
                  className={cn(
                    "rounded-xl border border-transparent p-3 text-left transition-colors",
                    activeId === n.id
                      ? "border-primary/30 bg-primary/10"
                      : "hover:bg-foreground/5",
                  )}
                >
                  <div className="flex items-center gap-1 text-sm font-medium">
                    {n.pinned && <Pin className="h-3 w-3 text-primary" />}
                    <span className="truncate">{n.title || "Untitled"}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                    {n.content || "Empty note"}
                  </p>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </aside>

        <section className="glass rounded-3xl p-5">
          {!active ? (
            <EmptyState
              icon={FileText}
              title="No note selected"
              description="Create a new note or pick one from the list to start writing."
              action={
                <Button onClick={handleCreate} className="bg-gradient-brand mt-2 rounded-full text-primary-foreground">
                  <Plus className="mr-1 h-4 w-4" /> New note
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Input
                  value={active.title}
                  onChange={(e) => patchActive({ title: e.target.value })}
                  placeholder="Title"
                  className="h-11 flex-1 border-0 bg-transparent px-0 text-lg font-semibold focus-visible:ring-0"
                />
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => patchActive({ pinned: !active.pinned })} aria-label="Pin">
                  {active.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full text-destructive" onClick={() => handleDelete(active.id)} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={active.tags.join(", ")}
                onChange={(e) =>
                  patchActive({
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  })
                }
                placeholder="Tags (comma separated)"
                className="glass h-9 rounded-full text-xs"
              />
              <Textarea
                value={active.content}
                onChange={(e) => patchActive({ content: e.target.value })}
                placeholder="Start writing…"
                className="glass min-h-[40vh] resize-none rounded-2xl text-sm"
              />
              <FuturePlaceholder>
                AI summaries, auto-flashcards and quiz generation from this note will arrive here.
              </FuturePlaceholder>
            </div>
          )}
        </section>
      </div>
    </LibraryLayout>
  );
}