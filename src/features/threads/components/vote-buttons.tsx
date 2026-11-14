"use client";

import { useTransition } from "react";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { voteThread } from "@/features/threads/actions";

type VoteButtonsProps = { threadId: string; score: number; myVote: -1 | 0 | 1; canVote: boolean };

/** Up and down votes with the running score between them. */
export function VoteButtons({ threadId, score, myVote, canVote }: VoteButtonsProps) {
  const [pending, startTransition] = useTransition();

  function vote(value: 1 | -1) {
    startTransition(() => void voteThread(threadId, value));
  }

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-surface">
      <button
        type="button"
        aria-label="Vote up"
        aria-pressed={myVote === 1}
        disabled={!canVote || pending}
        onClick={() => vote(1)}
        className="inline-flex size-11 items-center justify-center rounded-full active:opacity-75 disabled:cursor-default md:size-9"
      >
        <ArrowBigUp aria-hidden className={cn("size-5", myVote === 1 ? "fill-ink" : "")} />
      </button>
      <span aria-live="polite" className="min-w-6 text-center text-sm font-semibold">
        {score}
      </span>
      <button
        type="button"
        aria-label="Vote down"
        aria-pressed={myVote === -1}
        disabled={!canVote || pending}
        onClick={() => vote(-1)}
        className="inline-flex size-11 items-center justify-center rounded-full active:opacity-75 disabled:cursor-default md:size-9"
      >
        <ArrowBigDown aria-hidden className={cn("size-5", myVote === -1 ? "fill-ink" : "")} />
      </button>
    </div>
  );
}
