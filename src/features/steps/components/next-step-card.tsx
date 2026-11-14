import { SampleBadge } from "@/components/shared/sample-badge";
import { ButtonLink } from "@/components/ui/button-link";
import { EffortTabs } from "@/features/steps/components/effort-tabs";
import { PLACE_LABELS, type Effort } from "@/features/steps/constants";
import { formatMinutes } from "@/lib/format-time";
import type { TaskSummary } from "@/features/steps/types";

type NextStepCardProps = { task: TaskSummary | null; effort?: Effort };

/** The one small thing to do next, on a clean card, with the size picker beside it. */
export function NextStepCard({ task, effort }: NextStepCardProps) {
  const another = task
    ? effort
      ? `/?effort=${effort}&skip=${task.id}`
      : `/?skip=${task.id}`
    : "/";

  return (
    <section className="relative flex flex-col gap-8 overflow-hidden rounded-(--radius-card) border border-border bg-surface p-8 shadow-card lg:flex-row">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-(image:--gradient-spark)" />
      <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-4">
        <span className="rounded-full bg-lavender-soft px-3 py-1.5 text-xs font-semibold text-lavender-ink">
          Your next small step
        </span>
        {task ? (
          <>
            <h2 className="max-w-3xl text-3xl leading-tight font-bold">{task.title}</h2>
            {task.description ? (
              <p className="max-w-2xl text-lg text-muted">{task.description}</p>
            ) : null}
            <ul className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink">
              <li className="rounded-full bg-chip px-3 py-1.5">{formatMinutes(task.minutes)}</li>
              <li className="rounded-full bg-chip px-3 py-1.5">{PLACE_LABELS[task.place]}</li>
              <li className="rounded-full bg-chip px-3 py-1.5">For {task.groupName}</li>
              {task.groupIsDemo ? (
                <li>
                  <SampleBadge />
                </li>
              ) : null}
            </ul>
            <p className="text-sm text-muted">
              A real person from the group promises to reply within {task.replyWithinHours} hours.
            </p>
          </>
        ) : (
          <>
            <h2 className="max-w-3xl text-3xl leading-tight font-bold">
              No steps to show right now
            </h2>
            <p className="max-w-2xl text-lg text-muted">
              {effort
                ? "Nothing matches that size. Try another size, or check back soon."
                : "You have done everything that is open. New steps appear when groups post them."}
            </p>
          </>
        )}
      </div>
      <div className="flex w-full shrink-0 flex-col gap-4 self-start rounded-xl border border-border bg-background p-6 text-ink lg:w-[340px]">
        <p className="font-bold">How much do you want to give today?</p>
        <EffortTabs current={effort} />
        {task ? (
          <div className="flex flex-col gap-2">
            <ButtonLink href={`/steps/${task.id}`} variant="primary">
              Let us do it
            </ButtonLink>
            <ButtonLink href={another} variant="outline">
              Show me something else
            </ButtonLink>
          </div>
        ) : null}
      </div>
    </section>
  );
}
