import { motion } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroOrb from "@/assets/hero-orb.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="bg-gradient-hero absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="absolute -top-32 left-1/2 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--gradient-brand)" }}
      />

      <div className="mx-auto max-w-5xl px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-muted-foreground"
        >
          <span className="bg-gradient-brand h-1.5 w-1.5 rounded-full" />
          Your intelligent study companion
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl md:text-7xl"
        >
          Study with calm.
          <br />
          <span className="text-gradient-brand">Learn with clarity.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-6 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg"
        >
          StudySync AI turns your notes, lectures, and to-dos into a focused flow —
          quietly powered by AI, designed to feel good.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button
            size="lg"
            className="bg-gradient-brand h-12 w-full rounded-full px-6 text-primary-foreground shadow-glow hover:opacity-90 sm:w-auto"
          >
            Start studying free
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="glass h-12 w-full rounded-full px-6 sm:w-auto"
          >
            <PlayCircle className="mr-1 h-4 w-4" />
            Watch the demo
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="relative mx-auto mt-16 max-w-3xl"
        >
          <div className="glass rounded-3xl p-3 shadow-glow sm:p-4">
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src={heroOrb}
                alt="StudySync AI ambient companion orb"
                width={1280}
                height={1280}
                className="aspect-[16/10] w-full object-cover"
              />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="glass absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl px-4 py-3 text-left sm:left-6 sm:right-6"
              >
                <div>
                  <p className="text-xs text-muted-foreground">Today's focus</p>
                  <p className="text-sm font-medium">Organic Chemistry · 45 min flow</p>
                </div>
                <span className="bg-gradient-brand rounded-full px-3 py-1 text-xs font-medium text-primary-foreground">
                  In sync
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}