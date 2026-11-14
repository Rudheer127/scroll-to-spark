import { SampleBadge } from "@/components/shared/sample-badge";
import { ButtonLink } from "@/components/ui/button-link";
import { TaskMeta } from "@/features/steps/components/task-meta";
import type { Effort } from "@/features/steps/constants";
import type { TaskSummary } from "@/features/steps/types";

type NextStepCardProps = { task: TaskSummary | null; effort?: Effort };

/** The one small thing to do next. It has one main action and one quiet way to see another. */
export function NextStepCard({ task, effort }: NextStepCardProps) {
  if (!task) {
    return (
      <section className="flex flex-col gap-2 rounded-(--radius-card) border border-border bg-surface p-6">
        <h2 className="text-xl font-bold">No steps to show right now</h2>
        <p className="text-muted">
          {effort
            ? "Nothing matches that size. Try another size, or check back soon."
            : "You have done everything that is open. New steps appear when groups post them."}
        </p>
      </section>
    );
  }

  const another = effort ? `/?effort=${effort}&skip=${task.id}` : `/?skip=${task.id}`;

  return (
    <section className="flex flex-col gap-4 rounded-(--radius-card) border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-muted">
          Your next small step, from {task.groupName}
        </h2>
        {task.groupIsDemo ? <SampleBadge /> : null}
      </div>
      <h3 className="max-w-3xl text-2xl font-bold">{task.title}</h3>
      {task.description ? <p className="max-w-3xl text-muted">{task.description}</p> : null}
      <TaskMeta task={task} />
      <p className="text-sm text-muted">
        A real person from the group promises to reply within {task.replyWithinHours} hours.
      </p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href={`/steps/${task.id}`} variant="brand">
          Let us do it
        </ButtonLink>
        <ButtonLink href={another} variant="outline">
          Show me something else
        </ButtonLink>
      </div>
    </section>
  );
}
