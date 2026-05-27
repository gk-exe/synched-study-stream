import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  StreakCard,
  FocusTimerCard,
  DailyGoalsCard,
  QuoteCard,
  CompanionCard,
  ProductivityCard,
  SubjectBreakdownCard,
  SessionHistoryCard,
} from "@/components/dashboard/widgets";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard · StudySync AI" },
      { name: "description", content: "Your calm, intelligent study dashboard." },
    ],
  }),
});

function DashboardPage() {
  return (
    <DashboardShell>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StreakCard />
        <FocusTimerCard />
        <QuoteCard />

        <ProductivityCard />
        <SubjectBreakdownCard />

        <DailyGoalsCard />
        <CompanionCard />

        <SessionHistoryCard />
      </div>
    </DashboardShell>
  );
}