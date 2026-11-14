import Link from "next/link";
import type { Progress } from "@/features/steps/progress";

/** A private look at what you did. No streaks and no goals to miss. */
export function ProgressSummary({ progress }: { progress: Progress }) {
  const stats = [
    { value: progress.thisWeek, label: "steps this week" },
    { value: progress.total, label: "steps in all" },
    { value: progress.replies, label: "replies from groups" },
  ];

  return (
    <section aria-label="Your progress" className="grid gap-4 sm:grid-cols-3">
      {stats.map(({ value, label }) => (
        <Link
          key={label}
          href="/steps"
          className="flex flex-col gap-1 rounded-(--radius-card) border border-border bg-surface p-5 hover:border-control"
        >
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-sm text-muted">{label}</p>
        </Link>
      ))}
    </section>
  );
}
