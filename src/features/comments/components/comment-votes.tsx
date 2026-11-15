"use client";

import { useState, useTransition } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { voteComment } from "@/features/comments/actions";

type CommentVotesProps = {
  commentId: string;
  likes: number;
  dislikes: number;
  myVote: -1 | 0 | 1;
  canVote: boolean;
  /** Authors cannot vote on their own comment. */
  isOwn: boolean;
};

/** Like and dislike with a count beside each. When voting is off, tapping says why. */
export function CommentVotes({
  commentId,
  likes,
  dislikes,
  myVote,
  canVote,
  isOwn,
}: CommentVotesProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const reason = isOwn
    ? "You can't vote on your own comment."
    : !canVote
      ? "Join this group to vote."
      : null;

  function vote(value: 1 | -1) {
    if (reason) {
      setMessage(reason);
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await voteComment(commentId, value);
      if (!result.ok) setMessage(result.error);
    });
  }

  const buttons = [
    { value: 1 as const, Icon: ThumbsUp, count: likes, label: "Like" },
    { value: -1 as const, Icon: ThumbsDown, count: dislikes, label: "Dislike" },
  ];

  return (
    <div
      className="inline-flex flex-wrap items-center gap-1"
      role="group"
      aria-label="Rate this comment"
    >
      {buttons.map(({ value, Icon, count, label }) => {
        const active = myVote === value;
        return (
          <button
            key={value}
            type="button"
            aria-label={`${label}, ${count}`}
            aria-pressed={active}
            aria-disabled={reason ? true : undefined}
            title={reason ?? undefined}
            disabled={pending}
            onClick={() => vote(value)}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm hover:bg-chip active:opacity-75 md:min-h-9",
              active ? "bg-chip font-bold text-ink" : "text-muted",
              reason ? "cursor-help opacity-60" : "",
            )}
          >
            <Icon aria-hidden className={cn("size-4", active ? "fill-current" : "")} />
            <span className="tabular-nums">{count}</span>
          </button>
        );
      })}
      {message ? (
        <p role="status" className="text-sm text-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}
