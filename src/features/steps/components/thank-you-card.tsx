import { Heart } from "lucide-react";
import { SampleBadge } from "@/components/shared/sample-badge";
import { GroupAvatar } from "@/features/groups/components/group-avatar";
import { formatRelativeTime } from "@/lib/format-time";
import type { CompletionSummary } from "@/features/steps/types";

/** A reply from the group. It always says who sent it: a real group, never the app. */
export function ThankYouCard({ completion }: { completion: CompletionSummary }) {
  const { thankYou } = completion;
  if (!thankYou) return null;

  return (
    <article className="flex gap-4 rounded-[1.125rem] bg-background p-4">
      <GroupAvatar name={completion.groupName} color={completion.groupColor} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="font-sans text-base font-bold">{completion.groupName}</h3>
          <span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-bold text-teal-ink">
            From a real group
          </span>
          {completion.groupIsDemo ? <SampleBadge /> : null}
          <span className="text-sm text-muted">{formatRelativeTime(thankYou.createdAt)}</span>
        </div>
        {thankYou.kind === "written" && thankYou.body ? (
          <p className="max-w-3xl">&ldquo;{thankYou.body}&rdquo;</p>
        ) : (
          <p className="flex items-center gap-2 text-muted">
            <Heart aria-hidden className="size-4" />
            They sent a thank-you for &ldquo;{completion.taskTitle}&rdquo;.
          </p>
        )}
      </div>
    </article>
  );
}
