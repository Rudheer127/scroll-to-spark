import { formatRelativeTime } from "@/lib/format-time";
import { ReplyControls } from "@/features/steps/components/reply-controls";
import type { WaitingCompletion } from "@/features/steps/types";

/** Steps people did for your groups that still need a reply. */
export function WaitingList({ items }: { items: WaitingCompletion[] }) {
  if (items.length === 0) {
    return (
      <p className="text-muted">
        No replies are waiting. When someone does one of your tasks, it shows up here.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-3 rounded-(--radius-card) border border-border bg-surface p-5"
        >
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold">
              {item.personName} did &ldquo;{item.taskTitle}&rdquo;
            </h3>
            <p className="text-sm text-muted">
              {item.groupName}, {formatRelativeTime(item.createdAt)}
            </p>
          </div>
          {item.note ? <p className="max-w-3xl">{item.note}</p> : null}
          <ReplyControls completionId={item.id} personName={item.personName} />
        </li>
      ))}
    </ul>
  );
}
