"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AssistantMessage } from "./assistant-message";
import { useGuide } from "./guide-provider";
import { MessageBubble, MessageBubblePending } from "./message-bubble";
import { StarterPrompts } from "./starter-prompts";
import { UserImageNote } from "./user-image-note";

/**
 * The scrolling conversation. New messages are announced politely, and a retried answer
 * replaces the failed one in place. It scrolls to the newest message.
 */
export function GuideThread() {
  const { items, sending, error, send, retryBubble, retryError } = useGuide();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [items, sending, error]);

  const empty = items.length === 0 && !sending && !error;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-1 py-2">
      {empty ? <StarterPrompts onPick={(m) => void send(m)} disabled={sending} /> : null}
      <div role="log" aria-live="polite" aria-label="Conversation" className="flex flex-col gap-5">
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
        <div role="alert" className="flex max-w-[70ch] flex-col items-start gap-2">
          <p className="text-sm text-danger">{error.text}</p>
          <Button variant="outline" onClick={retryError}>
            Retry
          </Button>
        </div>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}
