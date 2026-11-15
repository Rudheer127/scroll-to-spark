import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { CopyLinkButton } from "@/components/shared/copy-link-button";
import { formatRelativeTime } from "@/lib/format-time";
import { GroupAvatar } from "@/features/groups/components/group-avatar";
import { PostImage } from "@/features/threads/components/thread-image";
import { ReportButton } from "@/features/threads/components/report-button";
import { VoteButtons } from "@/features/threads/components/vote-buttons";
import type { ThreadSummary } from "@/features/threads/types";

type ThreadCardProps = { thread: ThreadSummary; canVote: boolean; viewerId: string };

/** A thread in a feed: who posted it, where, the words, and the ways to react. */
export function ThreadCard({ thread, canVote, viewerId }: ThreadCardProps) {
  const path = `/discussions/${thread.groupSlug}/${thread.id}`;
  const isOwn = thread.authorId === viewerId;

  return (
    <article className="flex flex-col gap-3 min-w-0 rounded-(--radius-card) border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center gap-3">
        <GroupAvatar name={thread.groupName} color={thread.groupColor} size="sm" />
        <div className="flex min-w-0 flex-col text-sm [overflow-wrap:anywhere]">
          <Link href={`/discussions/${thread.groupSlug}`} className="font-bold hover:underline">
            {thread.groupName}
          </Link>
          <p className="text-muted">
            {thread.authorName} <span aria-hidden>·</span> {formatRelativeTime(thread.createdAt)}
          </p>
        </div>
      </div>
      <h3 className="min-w-0 text-xl leading-snug font-semibold [overflow-wrap:anywhere]">
        <Link href={path} className="hover:underline">
          {thread.title}
        </Link>
      </h3>
      {thread.hidden ? (
        <p className="rounded-(--radius-input) bg-chip p-3 text-sm">
          Hidden from others after reports. Only you can see this while it is reviewed.
        </p>
      ) : null}
      {thread.body ? (
        <p className="line-clamp-3 max-w-3xl min-w-0 [overflow-wrap:anywhere]">{thread.body}</p>
      ) : null}
      {thread.imageUrl ? <PostImage url={thread.imageUrl} alt={thread.imageAlt} /> : null}
      <div className="flex flex-wrap items-center gap-2.5">
        <VoteButtons
          threadId={thread.id}
          score={thread.voteScore}
          myVote={thread.myVote}
          canVote={canVote}
          isOwn={isOwn}
        />
        <Link
          href={path}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-chip px-4 text-sm font-bold active:opacity-75 md:min-h-9"
        >
          <MessageCircle aria-hidden className="size-4" />
          {thread.commentCount}
          <span className="sr-only">{thread.commentCount === 1 ? "comment" : "comments"}</span>
        </Link>
        <CopyLinkButton path={path} />
        {isOwn ? null : (
          <ReportButton targetType="thread" targetId={thread.id} noun="thread" className="px-3" />
        )}
      </div>
    </article>
  );
}
