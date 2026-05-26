import { createFileRoute } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "StudySync AI — Your intelligent study companion" },
      {
        name: "description",
        content:
          "StudySync AI turns your notes, lectures, and goals into a calm, focused study flow. Premium, minimal, AI-powered.",
      },
      { property: "og:title", content: "StudySync AI — Your intelligent study companion" },
      {
        property: "og:description",
        content: "Calm, AI-powered study companion designed for the way Gen-Z learns.",
      },
    ],
  }),
});

function Index() {
  return (
    <ThemeProvider>
      <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
        <Navbar />
        <Hero />
        <Features />
        <CTA />
        <Footer />
      </main>
    </ThemeProvider>
  );
}
