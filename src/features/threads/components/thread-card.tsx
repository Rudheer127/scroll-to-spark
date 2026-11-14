import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { CopyLinkButton } from "@/components/shared/copy-link-button";
import { formatRelativeTime } from "@/lib/format-time";
import { GroupAvatar } from "@/features/groups/components/group-avatar";
import { VoteButtons } from "@/features/threads/components/vote-buttons";
import type { ThreadSummary } from "@/features/threads/types";

type ThreadCardProps = { thread: ThreadSummary; canVote: boolean };

/** A thread in a feed: who posted it, where, the words, and the ways to react. */
export function ThreadCard({ thread, canVote }: ThreadCardProps) {
  const path = `/discussions/${thread.groupSlug}/${thread.id}`;

  return (
    <article className="flex flex-col gap-3 rounded-(--radius-card) border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center gap-3">
        <GroupAvatar name={thread.groupName} color={thread.groupColor} size="sm" />
        <p className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-sm">
          <Link
            href={`/discussions/${thread.groupSlug}`}
            className="font-extrabold hover:underline"
          >
            {thread.groupName}
          </Link>
          <span className="text-muted">
            {thread.authorName}, {formatRelativeTime(thread.createdAt)}
          </span>
        </p>
      </div>
      <h3 className="text-xl leading-snug font-semibold">
        <Link href={path} className="hover:underline">
          {thread.title}
        </Link>
      </h3>
      {thread.body ? <p className="line-clamp-3 max-w-3xl">{thread.body}</p> : null}
      <div className="flex flex-wrap items-center gap-2.5">
        <VoteButtons
          threadId={thread.id}
          score={thread.voteScore}
          myVote={thread.myVote}
          canVote={canVote}
        />
        <Link
          href={path}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-chip px-4 text-sm font-extrabold active:opacity-75 md:min-h-9"
        >
          <MessageCircle aria-hidden className="size-4" />
          {thread.commentCount}
          <span className="sr-only">{thread.commentCount === 1 ? "comment" : "comments"}</span>
        </Link>
        <CopyLinkButton path={path} />
      </div>
    </article>
  );
}
