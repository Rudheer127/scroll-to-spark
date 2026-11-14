import { SampleBadge } from "@/components/shared/sample-badge";
import { ButtonLink } from "@/components/ui/button-link";
import { EffortTabs } from "@/features/steps/components/effort-tabs";
import { PLACE_LABELS, type Effort } from "@/features/steps/constants";
import { formatMinutes } from "@/lib/format-time";
import type { TaskSummary } from "@/features/steps/types";

type NextStepCardProps = { task: TaskSummary | null; effort?: Effort };

/** The one small thing to do next, on a big coral card, with the size picker beside it. */
export function NextStepCard({ task, effort }: NextStepCardProps) {
  const another = task
    ? effort
      ? `/?effort=${effort}&skip=${task.id}`
      : `/?skip=${task.id}`
    : "/";

  return (
    <section className="flex flex-col gap-8 rounded-[28px] bg-coral p-8 text-white shadow-card lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col items-start gap-4">
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold uppercase text-cta">
          Your next small step
        </span>
        {task ? (
          <>
            <h2 className="max-w-3xl text-3xl leading-tight font-semibold">{task.title}</h2>
            {task.description ? <p className="max-w-2xl text-lg">{task.description}</p> : null}
            <ul className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-ink">
              <li className="rounded-full bg-white/90 px-3 py-1.5">
                {formatMinutes(task.minutes)}
              </li>
              <li className="rounded-full bg-white/90 px-3 py-1.5">{PLACE_LABELS[task.place]}</li>
              <li className="rounded-full bg-white/90 px-3 py-1.5">For {task.groupName}</li>
              {task.groupIsDemo ? (
                <li>
                  <SampleBadge />
                </li>
              ) : null}
            </ul>
            <p className="text-sm">
              A real person from the group promises to reply within {task.replyWithinHours} hours.
            </p>
          </>
        ) : (
          <>
            <h2 className="max-w-3xl text-3xl leading-tight font-semibold">
              No steps to show right now
            </h2>
            <p className="max-w-2xl text-lg">
              {effort
                ? "Nothing matches that size. Try another size, or check back soon."
                : "You have done everything that is open. New steps appear when groups post them."}
            </p>
          </>
        )}
      </div>
      <div className="flex w-full shrink-0 flex-col gap-4 self-start rounded-[22px] border border-border bg-surface p-6 text-ink shadow-card lg:w-[340px]">
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
