"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { AssistantMessage } from "./assistant-message";
import type { ChatLayoutMode } from "./chat-layout-mode";
import { useGuide } from "./guide-provider";
import { MessageBubble, MessageBubblePending } from "./message-bubble";
import { UserImageNote } from "./user-image-note";

type GuideThreadProps = {
  mode: ChatLayoutMode;
  /** The welcome headline, shown only while the chat is empty. */
  headline: React.ReactNode;
  /** The shared reading column, so messages line up with the composer. */
  columnClassName: string;
  /** The popup: the thread always fills the space above the composer and scrolls. */
  fill?: boolean;
};

/**
 * The scrolling conversation. New messages are announced politely, and a retried answer
 * replaces the failed one in place. It scrolls to the newest message. The log is there from the
 * start, even while empty, so the first answer is announced.
 */
export function GuideThread({ mode, headline, columnClassName, fill = false }: GuideThreadProps) {
  const { items, sending, error, retryBubble, retryError } = useGuide();
  const endRef = useRef<HTMLDivElement>(null);
  const empty = mode === "empty";

  useEffect(() => {
    // The empty state reads from the top, so only a real conversation scrolls to the end.
    if (!empty) endRef.current?.scrollIntoView({ block: "end" });
  }, [items, sending, error, empty]);

  return (
    <div
      className={cn(
        fill && "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4",
        !fill &&
          (empty ? "flex-none" : "min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-4"),
      )}
    >
      <div
        className={cn("flex flex-col", empty ? "gap-0" : fill ? "gap-5" : "gap-6", columnClassName)}
      >
        {empty ? headline : null}
        <div
          role="log"
          aria-live="polite"
          aria-label="Conversation"
          className={cn("flex flex-col", fill ? "gap-5" : "gap-6")}
        >
          {items.map((item) =>
            item.role === "user" ? (
              <MessageBubble key={item.id} role="user">
                {item.text}
                {item.imageDataUrl ? <UserImageNote dataUrl={item.imageDataUrl} /> : null}
              </MessageBubble>
            ) : (
              <AssistantMessage
                key={item.id}
                view={item.view}
                onRetry={() => retryBubble(item.id)}
                retryDisabled={sending}
              />
            ),
          )}
          {sending ? <MessageBubblePending /> : null}
        </div>
        {error ? (
          <div role="alert" className="flex flex-col items-start gap-2">
            <p className="text-sm text-danger">{error.text}</p>
            <Button variant="outline" onClick={retryError}>
              Retry
            </Button>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
    </div>
  );
}
