"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format-time";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { deleteComment } from "@/features/comments/actions";
import { CommentForm } from "@/features/comments/components/comment-form";
import { BlockUserButton } from "@/features/threads/components/block-user-button";
import { PostImage } from "@/features/threads/components/thread-image";
import { ReportButton } from "@/features/threads/components/report-button";
import { CommentVotes } from "@/features/comments/components/comment-votes";
import { ReactionBar } from "@/features/comments/components/reaction-bar";
import { MAX_INDENT_DEPTH } from "@/features/comments/constants";
import type { CommentNode } from "@/features/comments/tree";

type CommentItemProps = {
  node: CommentNode;
  threadId: string;
  depth: number;
  canParticipate: boolean;
  viewerId: string;
  isGroupOwner: boolean;
};

/** One comment, its reactions, a reply box, and its replies. Replies can be collapsed. */
export function CommentItem({
  node,
  threadId,
  depth,
  canParticipate,
  viewerId,
  isGroupOwner,
}: CommentItemProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const hasReplies = node.children.length > 0;
  const canDelete = node.authorId === viewerId || isGroupOwner;
  const isOwn = node.authorId === viewerId;
  const concealed = node.blocked || (node.hidden && !isOwn);
  const replyDepth = Math.min(depth + 1, MAX_INDENT_DEPTH);

  return (
    <li className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="min-w-0 font-bold [overflow-wrap:anywhere]">{node.authorName}</span>
          <span className="text-muted">{formatRelativeTime(node.createdAt)}</span>
        </div>
        {concealed ? (
          <p className="max-w-3xl text-sm text-muted italic">
            {node.blocked
              ? `You blocked ${node.authorName}. Their comment is hidden.`
              : "This comment was hidden after reports and is being reviewed."}
          </p>
        ) : (
          <>
            {node.hidden ? (
              <p className="rounded-(--radius-input) bg-chip p-3 text-sm">
                Hidden from others after reports. Only you can see this while it is reviewed.
              </p>
            ) : null}
            {node.body ? (
              <p className="max-w-3xl min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]">
                {node.body}
              </p>
            ) : null}
            {node.imageUrl ? <PostImage url={node.imageUrl} alt={node.imageAlt} /> : null}
            <ReactionBar commentId={node.id} reactions={node.reactions} canReact={canParticipate} />
          </>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {concealed ? null : (
            <CommentVotes
              commentId={node.id}
              likes={node.likes}
              dislikes={node.dislikes}
              myVote={node.myVote}
              canVote={canParticipate}
              isOwn={isOwn}
            />
          )}
          {canParticipate && !concealed ? (
            <Button variant="ghost" onClick={() => setReplying((value) => !value)} className="px-2">
              <Reply aria-hidden className="size-4" />
              Reply
            </Button>
          ) : null}
          {hasReplies ? (
            <Button
              variant="ghost"
              aria-expanded={!collapsed}
              onClick={() => setCollapsed((value) => !value)}
              className="px-2"
            >
              {collapsed ? (
                <ChevronRight aria-hidden className="size-4" />
              ) : (
                <ChevronDown aria-hidden className="size-4" />
              )}
              {collapsed
                ? `Show ${node.children.length} ${node.children.length === 1 ? "reply" : "replies"}`
                : "Hide replies"}
            </Button>
          ) : null}
          {!isOwn && !node.blocked ? (
            <>
              <ReportButton targetType="comment" targetId={node.id} noun="comment" />
              <BlockUserButton userId={node.authorId} name={node.authorName} />
            </>
          ) : null}
          {canDelete ? (
            <ConfirmDeleteButton
              label="Delete"
              warning={hasReplies ? "This also removes its replies." : "Delete this comment?"}
              onConfirm={() => deleteComment(node.id)}
            />
          ) : null}
        </div>
        {replying ? (
          <div className="max-w-2xl">
            <CommentForm
              threadId={threadId}
              parentId={node.id}
              label={`Reply to ${node.authorName}`}
              onDone={() => setReplying(false)}
            />
          </div>
        ) : null}
      </div>
      {hasReplies && !collapsed ? (
        <ul
          className={cn(
            "flex flex-col gap-4 border-l-2 border-border",
            depth < MAX_INDENT_DEPTH ? "ml-3 pl-5" : "pl-0",
          )}
        >
          {node.children.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              threadId={threadId}
              depth={replyDepth}
              canParticipate={canParticipate}
              viewerId={viewerId}
              isGroupOwner={isGroupOwner}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
