import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="bg-gradient-brand grid h-7 w-7 place-items-center rounded-lg">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-medium">StudySync AI</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} StudySync AI · Designed to feel good.
        </p>
      </div>
    </footer>
  );
}