import Link from "next/link";
import { GroupAvatar } from "@/features/groups/components/group-avatar";
import { SampleBadge } from "@/components/shared/sample-badge";
import { formatRelativeTime } from "@/lib/format-time";
import type { CompletionSummary } from "@/features/steps/types";

/** Your steps, newest first, each with the state of the reply. */
export function StepList({ completions }: { completions: CompletionSummary[] }) {
  return (
    <ul className="flex flex-col gap-4">
      {completions.map((item) => (
        <li
          key={item.id}
          className="flex gap-4 rounded-(--radius-card) shadow-card border border-border bg-surface p-5"
        >
          <GroupAvatar name={item.groupName} color={item.groupColor} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold">{item.taskTitle}</h2>
              {item.groupIsDemo ? <SampleBadge /> : null}
            </div>
            <p className="text-sm text-muted">
              <Link
                href={`/discussions/${item.groupSlug}`}
                className="font-semibold text-action hover:underline"
              >
                {item.groupName}
              </Link>{" "}
              {formatRelativeTime(item.createdAt)}
            </p>
            {item.note ? <p className="max-w-3xl">{item.note}</p> : null}
            {item.thankYou ? (
              <p className="rounded-(--radius-input) bg-teal-soft p-3 text-sm text-ink">
                <span className="font-bold text-teal-ink">From a real group:</span>{" "}
                {item.thankYou.kind === "written" && item.thankYou.body
                  ? item.thankYou.body
                  : "They sent a thank-you."}
              </p>
            ) : (
              <p className="w-fit rounded-full bg-lavender-soft px-3 py-1 text-sm font-bold text-lavender-ink">
                Waiting for a reply from the group
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
