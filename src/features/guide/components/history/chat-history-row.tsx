"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useNow } from "@/hooks/use-now";
import { formatShortRelativeTime } from "@/lib/format-time";
import { cn } from "@/lib/cn";
import type { ConversationSummary } from "../../types";

type ChatHistoryRowProps = {
  chat: ConversationSummary;
  /** This chat is the one on screen. */
  current: boolean;
  onDelete: () => void;
};

/** One saved chat: its title and when it was last used. Delete shows on hover or focus. */
export function ChatHistoryRow({ chat, current, onDelete }: ChatHistoryRowProps) {
  const now = useNow();
  return (
    <li className="group relative">
      <Link
        href={`/guide?chat=${chat.id}`}
        aria-current={current ? "true" : undefined}
        title={chat.title}
        className={cn(
          "flex min-h-11 flex-col justify-center rounded-xl py-1.5 pr-3 pl-3.5 group-focus-within:pr-10 group-hover:pr-10 active:opacity-75",
          current ? "bg-chip" : "hover:bg-chip/70",
        )}
      >
        <span className={cn("truncate text-sm", current ? "font-bold" : "font-medium")}>
          {chat.title}
        </span>
        <time dateTime={chat.updatedAt} className="min-h-4 text-xs text-muted">
          {now === null ? null : formatShortRelativeTime(chat.updatedAt, new Date(now))}
        </time>
      </Link>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete chat: ${chat.title}`}
        title="Delete chat"
        className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-surface hover:text-danger focus-visible:opacity-100"
      >
        <Trash2 aria-hidden className="size-4" />
      </button>
    </li>
  );
}
