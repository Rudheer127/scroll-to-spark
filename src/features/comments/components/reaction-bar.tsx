"use client";

import { useTransition } from "react";
import { cn } from "@/lib/cn";
import { toggleReaction } from "@/features/comments/actions";
import { REACTION_CHOICES } from "@/features/comments/constants";
import type { ReactionCount } from "@/features/comments/tree";

type ReactionBarProps = { commentId: string; reactions: ReactionCount[]; canReact: boolean };

/** Emoji reactions. Counts show for every emoji; members can add or remove their own. */
export function ReactionBar({ commentId, reactions, canReact }: ReactionBarProps) {
  const [pending, startTransition] = useTransition();
  const byEmoji = new Map(reactions.map((reaction) => [reaction.emoji, reaction]));
  const shown = REACTION_CHOICES.filter((emoji) => canReact || byEmoji.has(emoji));

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Reactions">
      {shown.map((emoji) => {
        const reaction = byEmoji.get(emoji);
        const mine = reaction?.mine ?? false;
        return (
          <button
            key={emoji}
            type="button"
            disabled={!canReact || pending}
            aria-pressed={mine}
            aria-label={`${emoji} ${reaction?.count ?? 0}`}
            onClick={() => startTransition(() => void toggleReaction(commentId, emoji))}
            className={cn(
              "inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 text-sm active:opacity-75 disabled:cursor-default",
              mine ? "border-action bg-chip font-semibold" : "border-border bg-surface",
              canReact && !mine ? "hover:bg-background" : "",
            )}
          >
            <span aria-hidden>{emoji}</span>
            {reaction ? <span className="text-xs">{reaction.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
