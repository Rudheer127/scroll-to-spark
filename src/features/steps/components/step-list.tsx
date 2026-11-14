import Link from "next/link";
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
          className="flex flex-col gap-2 rounded-(--radius-card) border border-border bg-surface p-5"
        >
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
            <p className="rounded-(--radius-control) bg-chip p-3 text-sm">
              <span className="font-semibold">From a real group:</span>{" "}
              {item.thankYou.kind === "written" && item.thankYou.body
                ? item.thankYou.body
                : "They sent a thank-you."}
            </p>
          ) : (
            <p className="text-sm text-muted">Waiting for a reply from the group.</p>
          )}
        </li>
      ))}
    </ul>
  );
}
