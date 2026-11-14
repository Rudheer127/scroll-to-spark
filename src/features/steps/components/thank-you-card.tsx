import { Heart } from "lucide-react";
import { SampleBadge } from "@/components/shared/sample-badge";
import { formatRelativeTime } from "@/lib/format-time";
import type { CompletionSummary } from "@/features/steps/types";

/** A reply from the group. It always says who sent it: a real group, never the app. */
export function ThankYouCard({ completion }: { completion: CompletionSummary }) {
  const { thankYou } = completion;
  if (!thankYou) return null;

  return (
    <article className="flex flex-col gap-3 rounded-(--radius-card) border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-base font-bold">{completion.groupName}</h3>
        <span className="rounded-full bg-chip px-2.5 py-0.5 text-xs font-semibold">
          From a real group
        </span>
        {completion.groupIsDemo ? <SampleBadge /> : null}
        <span className="text-sm text-muted">{formatRelativeTime(thankYou.createdAt)}</span>
      </div>
      {thankYou.kind === "written" && thankYou.body ? (
        <p className="max-w-3xl">{thankYou.body}</p>
      ) : (
        <p className="flex items-center gap-2 text-muted">
          <Heart aria-hidden className="size-4" />
          They sent a thank-you for &ldquo;{completion.taskTitle}&rdquo;.
        </p>
      )}
    </article>
  );
}
