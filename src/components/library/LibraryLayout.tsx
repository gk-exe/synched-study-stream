import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, FileText, Files, Layers, ListChecks, Bookmark, FolderHeart } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { cn } from "@/lib/utils";

export const LIBRARY_SECTIONS = [
  { to: "/library", label: "Hub", icon: BookOpen, exact: true },
  { to: "/library/notes", label: "Notes", icon: FileText },
  { to: "/library/pdfs", label: "PDFs", icon: Files },
  { to: "/library/flashcards", label: "Flashcards", icon: Layers },
  { to: "/library/quizzes", label: "Quizzes", icon: ListChecks },
  { to: "/library/explanations", label: "Explanations", icon: Bookmark },
  { to: "/library/collections", label: "Collections", icon: FolderHeart },
] as const;

export function LibraryLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <DashboardShell>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Learning Hub</p>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </div>

      <nav className="glass mb-5 flex gap-1 overflow-x-auto rounded-2xl p-1.5">
        {LIBRARY_SECTIONS.map((s) => {
          const active = isActive(s.to, s.exact);
          return (
            <Link
              key={s.to}
              to={s.to}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
                active
                  ? "bg-gradient-brand text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </DashboardShell>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass flex flex-col items-center gap-3 rounded-3xl p-10 text-center">
      <span className="bg-gradient-brand grid h-12 w-12 place-items-center rounded-2xl shadow-glow">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function FuturePlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-foreground/[0.02] p-4 text-xs text-muted-foreground">
      <span className="mr-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
        Coming soon
      </span>
      {children}
    </div>
  );
}