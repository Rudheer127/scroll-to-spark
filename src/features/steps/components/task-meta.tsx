import { Clock, MapPin } from "lucide-react";
import { formatMinutes } from "@/lib/format-time";
import { EFFORT_LABELS, PLACE_LABELS } from "@/features/steps/constants";
import type { TaskSummary } from "@/features/steps/types";

/** Time, place and size of a task, each in its own small element. */
export function TaskMeta({ task }: { task: TaskSummary }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
      <li className="flex items-center gap-1.5">
        <Clock aria-hidden className="size-4" />
        {formatMinutes(task.minutes)}
      </li>
      <li className="flex items-center gap-1.5">
        <MapPin aria-hidden className="size-4" />
        {PLACE_LABELS[task.place]}
      </li>
      <li>{EFFORT_LABELS[task.effort].label}</li>
    </ul>
  );
}
