import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function CTA() {
  return (
    <section className="px-5 pb-24 sm:pb-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="glass relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] p-10 text-center shadow-glow sm:p-16"
      >
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-70"
          style={{ background: "var(--gradient-hero)" }}
        />
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
          Your calmest semester
          <br />
          <span className="text-gradient-brand">starts today.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Join thousands of students learning smarter with StudySync AI. Free forever, no credit card.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-gradient-brand mt-8 h-12 rounded-full px-7 text-primary-foreground shadow-glow hover:opacity-90"
        >
          <Link to="/signup">
            Start studying free
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </section>
  );
}