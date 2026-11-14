import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { formatRelativeTime } from "@/lib/format-time";
import { VoteButtons } from "@/features/threads/components/vote-buttons";
import type { ThreadSummary } from "@/features/threads/types";

type ThreadCardProps = { thread: ThreadSummary; groupSlug: string; canVote: boolean };

export function ThreadCard({ thread, groupSlug, canVote }: ThreadCardProps) {
  return (
    <article className="flex flex-col gap-3 rounded-(--radius-card) border border-border bg-surface p-5">
      <p className="text-sm text-muted">
        <span className="font-semibold text-ink">{thread.authorName}</span>{" "}
        {formatRelativeTime(thread.createdAt)}
      </p>
      <h3 className="text-lg font-bold">
        <Link href={`/discussions/${groupSlug}/${thread.id}`} className="hover:underline">
          {thread.title}
        </Link>
      </h3>
      {thread.body ? <p className="line-clamp-3 max-w-3xl">{thread.body}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <VoteButtons
          threadId={thread.id}
          score={thread.voteScore}
          myVote={thread.myVote}
          canVote={canVote}
        />
        <Link
          href={`/discussions/${groupSlug}/${thread.id}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-background active:opacity-75 md:min-h-9"
        >
          <MessageSquare aria-hidden className="size-4" />
          {thread.commentCount} {thread.commentCount === 1 ? "comment" : "comments"}
        </Link>
      </div>
    </article>
  );
}
