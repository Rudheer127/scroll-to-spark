"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { sendGuideMessage } from "../actions";
import { MAX_INPUT_CHARS } from "../constants";
import { AssistantMessage } from "./assistant-message";
import { characterCount, sendBlockReason } from "./chat-input-state";
import { retryTarget } from "./retry-target";
import { MessageBubble, MessageBubblePending } from "./message-bubble";
import { StarterPrompts } from "./starter-prompts";
import { toMessageView, type MessageView } from "./to-message-view";

type NewItem = { role: "user"; text: string } | { role: "assistant"; view: MessageView };
type Item = NewItem & { id: number };
type ChatError = { text: string; retryWith: string };

const SEND_ERROR = "The guide could not answer. Your message is still here.";

/** The one chat. The popup and the full page both render it, so they behave the same. */
export function GuideChat({ variant, inputId }: { variant: "popup" | "page"; inputId?: string }) {
  const generatedId = useId();
  const fieldId = inputId ?? generatedId;
  const hintId = `${fieldId}-send-hint`;
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const nextId = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const hasSent = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [items.length, sending, error]);

  useEffect(() => {
    if (!sending && hasSent.current) inputRef.current?.focus();
  }, [sending]);

  const append = (item: NewItem) =>
    setItems((prev) => [...prev, { ...item, id: nextId.current++ }]);

  async function send(raw: string, isRetry = false, replaceId?: number) {
    const text = raw.trim();
    if (sendBlockReason(text, sending) !== null) return;
    hasSent.current = true;
    setError(null);
    setSending(true);
    if (!isRetry) {
      append({ role: "user", text });
      setInput("");
    }
    try {
      const formData = new FormData();
      formData.set("message", text);
      const result = await sendGuideMessage(formData);
      if (result.ok) {
        const view = toMessageView(result.data);
        if (replaceId === undefined) append({ role: "assistant", view });
        else
          setItems((prev) =>
            prev.map((i) => (i.id === replaceId ? { id: i.id, role: "assistant", view } : i)),
          );
      } else setError({ text: result.error, retryWith: text });
    } catch {
      setError({ text: SEND_ERROR, retryWith: text });
    } finally {
      setSending(false);
    }
  }

  function retryBubble(id: number) {
    const target = retryTarget(items, id);
    if (target) void send(target.text, true, target.replaceId);
  }

  const blockReason = sendBlockReason(input, sending);
  const empty = items.length === 0 && !sending && !error;

  return (
    <div data-variant={variant} className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        {empty ? <StarterPrompts onPick={(m) => void send(m)} disabled={sending} /> : null}
        <div
          role="log"
          aria-live="polite"
          aria-label="Conversation"
          className="flex flex-col gap-4"
        >
          {items.map((item) =>
            item.role === "user" ? (
              <MessageBubble key={item.id} role="user">
                {item.text}
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
            <Button variant="outline" onClick={() => void send(error.retryWith, true)}>
              Retry
            </Button>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <label htmlFor={fieldId} className="text-sm font-semibold">
          Message the guide
        </label>
        <textarea
          id={fieldId}
          ref={inputRef}
          rows={2}
          value={input}
          maxLength={MAX_INPUT_CHARS}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void send(input);
            }
          }}
          className={cn(inputClass, "resize-none")}
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button
            type="submit"
            variant="primary"
            disabled={blockReason !== null}
            aria-describedby={hintId}
          >
            <Send aria-hidden className="size-4" />
            Send
          </Button>
          <p id={hintId} className="text-sm text-muted">
            {blockReason ?? "Enter sends. Shift and Enter adds a line."}
          </p>
          <p className="text-sm text-muted sm:ml-auto">{characterCount(input)}</p>
        </div>
      </form>
    </div>
  );
}
