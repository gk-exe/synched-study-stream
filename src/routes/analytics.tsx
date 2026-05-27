import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  ProductivityCard,
  SubjectBreakdownCard,
  SessionHistoryCard,
  StreakCard,
  RewardsCard,
} from "@/components/dashboard/widgets";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
  head: () => ({
    meta: [
      { title: "Analytics · StudySync AI" },
      { name: "description", content: "Your focus trends, subject breakdown, and session history." },
    ],
  }),
});

function AnalyticsPage() {
  return (
    <DashboardShell>
      <div className="mb-4">
        <p className="text-xs text-muted-foreground">Your rhythm</p>
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ProductivityCard />
        <SubjectBreakdownCard />
        <StreakCard />
        <RewardsCard />
        <SessionHistoryCard />
      </div>
    </DashboardShell>
  );
}