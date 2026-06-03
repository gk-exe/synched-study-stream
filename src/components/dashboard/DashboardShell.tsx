import { Link, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Timer,
  Target,
  BarChart3,
  Sparkles,
  Moon,
  Sun,
  Bell,
  Palette,
  BookOpen,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppData } from "@/hooks/use-app-data";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { CompanionPresence } from "@/components/companion/CompanionPresence";

const nav = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
  { label: "Focus", to: "/focus", icon: Timer },
  { label: "Library", to: "/library", icon: BookOpen },
  { label: "Goals", to: "/goals", icon: Target },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Companion", to: "/companion", icon: Sparkles },
  { label: "Customize", to: "/customize", icon: Palette },
] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (to: string) =>
    to === "/library" ? pathname.startsWith("/library") : pathname === to;
  const { loading: dataLoading } = useAppData();
  const { loading: statsLoading } = usePomodoro();
  const syncing = dataLoading || statsLoading;

  return (
    <div className="bg-gradient-hero min-h-screen text-foreground">
      {/* Sync progress bar */}
      <AnimatePresence>
        {syncing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-gradient-brand fixed top-0 left-0 z-50 h-0.5 w-full origin-left animate-pulse"
            aria-label="Syncing your data"
          />
        )}
      </AnimatePresence>
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1400px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-2 p-4 lg:flex">
          <Link to="/" className="mb-4 flex items-center gap-2 px-2 py-3">
            <span className="bg-gradient-brand grid h-9 w-9 place-items-center rounded-xl shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="text-base font-semibold tracking-tight">StudySync AI</span>
          </Link>

          <nav className="glass flex flex-1 flex-col gap-1 rounded-2xl p-2">
            {nav.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-gradient-brand text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Streak insight</p>
            <p className="mt-1 text-sm font-medium">You focus best on Wednesdays at 4 PM.</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 pt-5 pb-36 sm:px-6 lg:px-8 lg:pb-8">
          {/* Top bar (mobile + desktop) */}
          <motion.header
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 lg:hidden">
              <span className="bg-gradient-brand grid h-8 w-8 place-items-center rounded-xl shadow-glow">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </span>
              <span className="text-sm font-semibold tracking-tight">StudySync AI</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs text-muted-foreground">Wednesday, May 27</p>
              <h1 className="text-xl font-semibold tracking-tight">Good afternoon, friend</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="glass rounded-full" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                aria-label="Toggle theme"
                className="glass rounded-full"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </motion.header>

          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-3 left-1/2 z-50 w-[min(460px,calc(100%-1.5rem))] -translate-x-1/2 lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="glass flex items-center justify-between rounded-2xl px-1.5 py-1.5 shadow-glow">
          {nav.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1 text-[10px] transition-colors active:scale-95",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg transition-all",
                    active && "bg-gradient-brand text-primary-foreground shadow-glow",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Persistent AI companion presence */}
      <CompanionPresence />
    </div>
  );
}