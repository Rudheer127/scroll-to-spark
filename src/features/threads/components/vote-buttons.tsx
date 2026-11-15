"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { voteThread } from "@/features/threads/actions";

type VoteButtonsProps = {
  threadId: string;
  score: number;
  myVote: -1 | 0 | 1;
  canVote: boolean;
  /** Authors cannot vote on their own thread. */
  isOwn?: boolean;
};

/** Up and down votes with the running score between them. When voting is off, it says why. */
export function VoteButtons({ threadId, score, myVote, canVote, isOwn = false }: VoteButtonsProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const reason = isOwn
    ? "You can't vote on your own thread."
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
      const result = await voteThread(threadId, value);
      if (!result.ok) setMessage(result.error);
    });
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center rounded-full bg-chip px-1">
        {([1, -1] as const).map((value) => {
          const Icon = value === 1 ? ChevronUp : ChevronDown;
          const active = myVote === value;
          return (
            <span key={value} className="contents">
              <button
                type="button"
                aria-label={value === 1 ? "Vote up" : "Vote down"}
                aria-pressed={active}
                aria-disabled={reason ? true : undefined}
                title={reason ?? undefined}
                disabled={pending}
                onClick={() => vote(value)}
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-full active:opacity-75 md:size-9",
                  reason ? "cursor-help opacity-60" : "",
                )}
              >
                <Icon
                  aria-hidden
                  className={cn(
                    "size-5",
                    active
                      ? value === 1
                        ? "stroke-[3] text-coral"
                        : "stroke-[3] text-lavender-ink"
                      : "text-muted",
                  )}
                />
              </button>
              {value === 1 ? (
                <span aria-live="polite" className="min-w-6 text-center text-sm font-bold">
                  {score}
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
      {message ? (
        <p role="status" className="text-sm text-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}
