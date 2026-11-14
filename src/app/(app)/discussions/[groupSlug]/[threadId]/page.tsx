import { notFound } from "next/navigation";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { formatRelativeTime } from "@/lib/format-time";
import { getCurrentUser } from "@/features/auth/queries";
import { CommentForm } from "@/features/comments/components/comment-form";
import { CommentTree } from "@/features/comments/components/comment-tree";
import { getCommentTree } from "@/features/comments/queries";
import { getGroupBySlug } from "@/features/groups/queries";
import { VoteButtons } from "@/features/threads/components/vote-buttons";
import { deleteThread } from "@/features/threads/actions";
import { getThread } from "@/features/threads/queries";

export default async function ThreadPage({
  params,
}: PageProps<"/discussions/[groupSlug]/[threadId]">) {
  const { groupSlug, threadId } = await params;
  const [group, thread, user] = await Promise.all([
    getGroupBySlug(groupSlug),
    getThread(threadId),
    getCurrentUser(),
  ]);
  if (!group || !thread || !user || thread.groupId !== group.id) notFound();

  const comments = await getCommentTree(thread.id);
  const canParticipate = group.isMember || group.isOwner;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Discussions", href: "/discussions" },
          { label: group.name, href: `/discussions/${group.slug}` },
          { label: "Thread" },
        ]}
      />
      <article className="flex flex-col gap-3 rounded-(--radius-card) shadow-card border border-border bg-surface p-6">
        <p className="text-sm text-muted">
          <span className="font-semibold text-ink">{thread.authorName}</span> in {group.name},{" "}
          {formatRelativeTime(thread.createdAt)}
        </p>
        <h1 className="max-w-4xl text-3xl font-bold">{thread.title}</h1>
        {thread.body ? <p className="max-w-3xl whitespace-pre-wrap">{thread.body}</p> : null}
        <div className="flex flex-wrap items-center gap-3">
          <VoteButtons
            threadId={thread.id}
            score={thread.voteScore}
            myVote={thread.myVote}
            canVote={canParticipate}
          />
          {thread.authorId === user.id || group.isOwner ? (
            <ConfirmDeleteButton
              label="Delete thread"
              warning="This removes the thread and every comment on it."
              onConfirm={deleteThread.bind(null, thread.id, groupSlug)}
            />
          ) : null}
        </div>
      </article>
      <section className="flex flex-col gap-6">
        <h2 className="text-xl font-bold">
          {thread.commentCount} {thread.commentCount === 1 ? "comment" : "comments"}
        </h2>
        {canParticipate ? (
          <div className="max-w-2xl">
            <CommentForm threadId={thread.id} label="Add a comment" />
          </div>
        ) : (
          <p className="text-muted">Join {group.name} to comment.</p>
        )}
        <CommentTree
          nodes={comments}
          threadId={thread.id}
          canParticipate={canParticipate}
          viewerId={user.id}
          isGroupOwner={group.isOwner}
        />
      </section>
    </div>
  );
}
