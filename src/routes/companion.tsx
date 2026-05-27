import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CompanionChat } from "@/components/companion/CompanionChat";

export const Route = createFileRoute("/companion")({
  component: CompanionPage,
  head: () => ({
    meta: [
      { title: "Sync · Your study companion" },
      {
        name: "description",
        content:
          "Chat with Sync, your calm and intelligent AI study companion. Get motivation, summaries, and study help.",
      },
    ],
  }),
});

function CompanionPage() {
  return (
    <DashboardShell>
      <CompanionChat />
    </DashboardShell>
  );
}