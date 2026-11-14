import { formatMinutes } from "@/lib/format-time";
import { TaskStatusButton } from "@/features/steps/components/task-status-button";
import { EFFORT_LABELS } from "@/features/steps/constants";
import type { OwnedTask } from "@/features/steps/types";

/** The tasks you posted, with how many people have done each. */
export function OwnedTaskList({ tasks }: { tasks: OwnedTask[] }) {
  if (tasks.length === 0) {
    return <p className="text-muted">You have not posted a task yet.</p>;
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex flex-col gap-1 rounded-(--radius-card) shadow-card border border-border bg-surface p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold">{task.title}</h3>
            <span
              className={
                task.isOpen
                  ? "shrink-0 rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-bold text-teal-ink"
                  : "shrink-0 rounded-full bg-chip px-2.5 py-0.5 text-xs font-bold text-muted"
              }
            >
              {task.isOpen ? "Open" : "Closed"}
            </span>
          </div>
          <p className="text-sm text-muted">
            {task.groupName}, {formatMinutes(task.minutes)}, {EFFORT_LABELS[task.effort].label}
          </p>
          <p className="text-sm">
            {task.completionCount} {task.completionCount === 1 ? "person has" : "people have"} done
            this
          </p>
          <div className="mt-2">
            <TaskStatusButton taskId={task.id} isOpen={task.isOpen} />
          </div>
        </li>
      ))}
    </ul>
  );
}
