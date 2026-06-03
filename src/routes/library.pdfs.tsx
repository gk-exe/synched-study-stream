import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Files, Upload, Trash2 } from "lucide-react";
import { LibraryLayout, EmptyState, FuturePlaceholder } from "@/components/library/LibraryLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { fetchPdfs, uploadPdf, deletePdf, type Pdf } from "@/lib/learning-db";
import { toast } from "sonner";

export const Route = createFileRoute("/library/pdfs")({
  component: PdfsPage,
  head: () => ({ meta: [{ title: "PDFs · Learning Hub" }] }),
});

function PdfsPage() {
  const { user } = useAuth();
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchPdfs(user.id)
      .then(setPdfs)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !user) return;
    if (f.type !== "application/pdf") return toast.error("Only PDF files are supported.");
    setUploading(true);
    try {
      const row = await uploadPdf(user.id, f);
      setPdfs((p) => [row, ...p]);
      toast.success("Uploaded");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(p: Pdf) {
    setPdfs((prev) => prev.filter((x) => x.id !== p.id));
    try {
      await deletePdf(p);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <LibraryLayout
      title="PDF library"
      subtitle="Upload papers and textbooks. AI processing arrives later."
      actions={
        <>
          <input ref={inputRef} type="file" accept="application/pdf" onChange={onPick} className="hidden" />
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="bg-gradient-brand h-10 rounded-full px-4 text-primary-foreground shadow-glow hover:opacity-90"
          >
            <Upload className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">{uploading ? "Uploading…" : "Upload PDF"}</span>
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        </div>
      ) : pdfs.length === 0 ? (
        <EmptyState
          icon={Files}
          title="No PDFs yet"
          description="Upload your first PDF to start building your study library."
          action={
            <Button onClick={() => inputRef.current?.click()} className="bg-gradient-brand mt-2 rounded-full text-primary-foreground">
              <Upload className="mr-1 h-4 w-4" /> Upload PDF
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pdfs.map((p) => (
            <div key={p.id} className="glass flex flex-col gap-2 rounded-3xl p-4 shadow-glow">
              <div className="flex items-start gap-3">
                <span className="bg-gradient-brand grid h-10 w-10 shrink-0 place-items-center rounded-2xl shadow-glow">
                  <Files className="h-4 w-4 text-primary-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {(p.size_bytes / 1024 / 1024).toFixed(1)} MB · {p.processing_status}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full text-destructive" onClick={() => onDelete(p)} aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FuturePlaceholder>
        Automatic summaries, chapter outlines and flashcard generation from your PDFs will land here.
      </FuturePlaceholder>
    </LibraryLayout>
  );
}