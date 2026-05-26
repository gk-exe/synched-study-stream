import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Moon, Sun, Sparkles } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
];

export function Navbar() {
  const { theme, toggle } = useTheme();
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-3 left-1/2 z-50 w-[min(1100px,calc(100%-1.5rem))] -translate-x-1/2"
    >
      <nav className="glass flex items-center justify-between rounded-2xl px-4 py-2.5 shadow-glow sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="bg-gradient-brand grid h-8 w-8 place-items-center rounded-xl shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold tracking-tight sm:text-base">StudySync AI</span>
        </Link>
        <ul className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-full"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button size="sm" className="bg-gradient-brand rounded-full px-4 text-primary-foreground shadow-glow hover:opacity-90">
            Get started
          </Button>
        </div>
      </nav>
    </motion.header>
  );
}