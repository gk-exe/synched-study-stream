import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { FocusMode } from "@/components/focus/FocusMode";

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
      <FocusMode />
    </DashboardShell>
  );
}