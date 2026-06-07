import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LIBRARY_SECTIONS } from "@/components/library/LibraryLayout";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { useCompanion } from "@/hooks/use-companion";

export const Route = createFileRoute("/library")({
  component: LibraryRoute,
  head: () => ({
    meta: [
      { title: "Learning Hub · StudySync AI" },
      { name: "description", content: "Your notes, PDFs, flashcards, quizzes and saved explanations." },
    ],
  }),
});

function LibraryRoute() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  // Only render the hub overview when we're exactly at /library.
  // Child routes render via <Outlet />.
  if (pathname !== "/library") return <Outlet />;
  return <LibraryHub />;
}

function LibraryHub() {
  const { displayName } = useCompanion();
  return (
    <DashboardShell>
      <div className="mb-5">
        <p className="text-xs text-muted-foreground">Learning Hub</p>
        <h1 className="text-xl font-semibold tracking-tight">Everything you study, in one calm place</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Notes, PDFs, flashcards, quizzes and the explanations you've saved from {displayName}.
        </p>
        <Link
          to="/companion"
          className="bg-gradient-brand mt-3 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-primary-foreground shadow-glow"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Ask {displayName}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LIBRARY_SECTIONS.filter((s) => s.to !== "/library").map((s) => (
          <Link
            key={s.to}
            to={s.to as "/library/notes"}
            className={cn(
              "glass group flex flex-col gap-3 rounded-3xl p-5 shadow-glow transition-transform hover:-translate-y-0.5",
            )}
          >
            <span className="bg-gradient-brand grid h-10 w-10 place-items-center rounded-2xl shadow-glow">
              <s.icon className="h-4 w-4 text-primary-foreground" />
            </span>
            <div>
              <h2 className="text-base font-semibold">{s.label}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {DESCRIPTIONS[s.to] ?? "Open"}
              </p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-80 group-hover:opacity-100">
              <Sparkles className="h-3 w-3" /> Open
            </span>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}

const DESCRIPTIONS: Record<string, string> = {
  "/library/notes": "Write, tag and revisit your study notes.",
  "/library/pdfs": "Upload papers and textbooks for later study.",
  "/library/flashcards": "Spaced-repetition decks to make it stick.",
  "/library/quizzes": "Practice with quick self-checks.",
  "/library/explanations": "Save what Sync taught you for later.",
  "/library/collections": "Group resources into focused study sets.",
};