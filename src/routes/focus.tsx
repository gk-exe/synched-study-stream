import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  FocusTimerCard,
  RewardsCard,
  StreakCard,
  QuoteCard,
} from "@/components/dashboard/widgets";

export const Route = createFileRoute("/focus")({
  component: FocusPage,
  head: () => ({
    meta: [
      { title: "Focus · StudySync AI" },
      { name: "description", content: "Your pomodoro focus timer and rewards." },
    ],
  }),
});

function FocusPage() {
  return (
    <DashboardShell>
      <div className="mb-4">
        <p className="text-xs text-muted-foreground">Deep work</p>
        <h1 className="text-xl font-semibold tracking-tight">Focus timer</h1>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-2 lg:row-span-2">
          <FocusTimerCard />
        </div>
        <RewardsCard />
        <StreakCard />
        <QuoteCard />
      </div>
    </DashboardShell>
  );
}