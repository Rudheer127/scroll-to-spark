import { notFound, redirect } from "next/navigation";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { formatRelativeTime } from "@/lib/format-time";
import { getCurrentUser } from "@/features/auth/queries";
import { CommentForm } from "@/features/comments/components/comment-form";
import { CommentTree } from "@/features/comments/components/comment-tree";
import { getCommentTree } from "@/features/comments/queries";
import { JoinLeaveButton } from "@/features/groups/components/join-leave-button";
import { getGroupBySlug } from "@/features/groups/queries";
import { PostImage } from "@/features/threads/components/thread-image";
import { ReportButton } from "@/features/threads/components/report-button";
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
  if (!user) redirect("/login");
  if (!group || !thread || thread.groupId !== group.id) notFound();

  const comments = await getCommentTree(thread.id);
  const canParticipate = group.isMember || group.isOwner;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Breadcrumb
        items={[
          { label: "Discussions", href: "/discussions" },
          { label: group.name, href: `/discussions/${group.slug}` },
          { label: "Thread" },
        ]}
      />
      <article className="flex min-w-0 flex-col gap-3 rounded-(--radius-card) shadow-card border border-border bg-surface p-6">
        <p className="text-sm text-muted [overflow-wrap:anywhere]">
          <span className="font-semibold text-ink">{thread.authorName}</span> in {group.name},{" "}
          {formatRelativeTime(thread.createdAt)}
        </p>
        <h1 className="max-w-4xl min-w-0 text-3xl font-bold [overflow-wrap:anywhere]">
          {thread.title}
        </h1>
        {thread.hidden ? (
          <p className="rounded-(--radius-input) bg-chip p-3 text-sm">
            Hidden from others after reports. Only you can see this while it is reviewed.
          </p>
        ) : null}
        {thread.body ? (
          <p className="max-w-3xl min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]">
            {thread.body}
          </p>
        ) : null}
        {thread.imageUrl ? <PostImage url={thread.imageUrl} alt={thread.imageAlt} /> : null}
        <div className="flex flex-wrap items-center gap-3">
          <VoteButtons
            threadId={thread.id}
            score={thread.voteScore}
            myVote={thread.myVote}
            canVote={canParticipate}
            isOwn={thread.authorId === user.id}
          />
          {thread.authorId === user.id ? null : (
            <ReportButton targetType="thread" targetId={thread.id} noun="thread" />
          )}
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
          <div className="flex max-w-2xl flex-wrap items-center gap-3 rounded-(--radius-card) border border-border bg-surface p-4">
            <p className="min-w-0 flex-1 text-muted [overflow-wrap:anywhere]">
              Join {group.name} to comment, reply and vote.
            </p>
            <JoinLeaveButton groupId={group.id} isMember={false} />
          </div>
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
