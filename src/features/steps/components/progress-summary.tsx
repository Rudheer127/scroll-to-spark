import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatMinutes } from "@/lib/format-time";
import type { Progress } from "@/features/steps/progress";

const RING_SIZE = 110;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const MAX_BAR = 80;
const MIN_BAR = 8;

const cardClass =
  "flex flex-col gap-4 rounded-(--radius-card) shadow-card border border-border bg-surface p-6";

/** Two private cards about what you did. No streaks, no goals to miss. */
export function ProgressSummary({ progress }: { progress: Progress }) {
  const filled = (progress.activeDays / progress.days.length) * RING_LENGTH;
  const biggest = Math.max(...progress.days.map((day) => day.minutes), 1);
  const peak = progress.days.findIndex((day) => day.minutes === biggest);
  const stats = [
    { value: `${progress.thisWeek} ${progress.thisWeek === 1 ? "step" : "steps"}`, label: "done" },
    { value: formatMinutes(progress.minutesThisWeek), label: "given" },
    {
      value: `${progress.replies} ${progress.replies === 1 ? "reply" : "replies"}`,
      label: "received",
    },
  ];

  return (
    <section aria-label="Your progress" className="grid gap-5 md:grid-cols-2">
      <Link href="/steps" className={cn(cardClass, "hover:border-control")}>
        <h2 className="text-xl font-semibold">This week</h2>
        <div className="flex items-center gap-5">
          <div className="relative size-[6.875rem] shrink-0">
            <svg
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              aria-hidden
              className="size-full -rotate-90"
            >
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                strokeWidth={RING_STROKE}
                className="stroke-chip"
              />
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={`${filled} ${RING_LENGTH}`}
                className="stroke-coral"
              />
            </svg>
            <p className="absolute inset-0 flex items-center justify-center font-display text-2xl font-bold">
              {progress.activeDays}/7
            </p>
          </div>
          <ul className="flex flex-col gap-2">
            {stats.map(({ value, label }) => (
              <li key={label} className="flex items-baseline gap-1.5">
                <span className="font-display text-lg font-semibold">{value}</span>
                <span className="text-sm text-muted">{label}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-muted">Days with a step, out of 7. No streaks to lose.</p>
      </Link>
      <div className={cardClass}>
        <h2 className="text-xl font-semibold">Your rhythm</h2>
        <ul className="flex h-[6.875rem] items-end gap-2.5">
          {progress.days.map((day, index) => {
            const height =
              day.minutes === 0
                ? MIN_BAR
                : Math.max(MIN_BAR * 2, (day.minutes / biggest) * MAX_BAR);
            return (
              <li key={index} className="flex flex-col items-center gap-1.5">
                <span
                  aria-label={`${day.minutes} minutes`}
                  style={{ height }}
                  className={cn(
                    "block w-[1.375rem] rounded-[0.625rem]",
                    day.minutes === 0
                      ? "bg-border"
                      : index === peak
                        ? "bg-(image:--gradient-spark)"
                        : "bg-ink/80",
                  )}
                />
                <span className="text-xs font-bold text-muted">{day.letter}</span>
              </li>
            );
          })}
        </ul>
        <p className="text-sm text-muted">Minutes given each day. Rest days count too.</p>
      </div>
    </section>
  );
}
