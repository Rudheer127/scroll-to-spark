"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format-time";
import { CommentForm } from "@/features/comments/components/comment-form";
import { ReactionBar } from "@/features/comments/components/reaction-bar";
import { MAX_INDENT_DEPTH } from "@/features/comments/constants";
import type { CommentNode } from "@/features/comments/tree";

type CommentItemProps = {
  node: CommentNode;
  threadId: string;
  depth: number;
  canParticipate: boolean;
};

/** One comment, its reactions, a reply box, and its replies. Replies can be collapsed. */
export function CommentItem({ node, threadId, depth, canParticipate }: CommentItemProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const hasReplies = node.children.length > 0;
  const replyDepth = Math.min(depth + 1, MAX_INDENT_DEPTH);

  return (
    <li className="flex flex-col gap-2">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold">{node.authorName}</span>
          <span className="text-muted">{formatRelativeTime(node.createdAt)}</span>
        </div>
        <p className="max-w-3xl whitespace-pre-wrap">{node.body}</p>
        <ReactionBar commentId={node.id} reactions={node.reactions} canReact={canParticipate} />
        <div className="flex flex-wrap items-center gap-3">
          {canParticipate ? (
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
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
