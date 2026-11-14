"use client";

import { useRef, useState } from "react";
import { retryTarget } from "./retry-target";
import { sendGuideTurn } from "./send-guide-turn";
import { toMessageView, type MessageView } from "./to-message-view";

type NewItem =
  { role: "user"; text: string; imageDataUrl?: string } | { role: "assistant"; view: MessageView };
export type ChatItem = NewItem & { id: number };
export type ChatError = { text: string; retryWith: { text: string; imageDataUrl?: string } };

const SEND_ERROR = "The guide could not answer. Your message is still here.";

export type GuideConversation = {
  items: ChatItem[];
  sending: boolean;
  error: ChatError | null;
  /** Sends a new message. Returns false when nothing was sent. */
  send: (text: string, imageDataUrl?: string) => boolean;
  retryBubble: (assistantId: number) => void;
  retryError: () => void;
  reset: () => void;
};

/**
 * The one conversation. It lives in the guide provider, so the popup, the maximised window and
 * the full page all show the same thread. A retry replaces the failed answer in place.
 */
export function useGuideConversation(): GuideConversation {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const nextId = useRef(0);
  const inFlight = useRef(false);

  const append = (item: NewItem) =>
    setItems((prev) => [...prev, { ...item, id: nextId.current++ }]);

  async function run(text: string, imageDataUrl: string | undefined, replaceId?: number) {
    inFlight.current = true;
    setError(null);
    setSending(true);
    try {
      const result = await sendGuideTurn(text, imageDataUrl);
      if (!result.ok) {
        setError({ text: result.error, retryWith: { text, imageDataUrl } });
        return;
      }
      const view = toMessageView(result.data);
      if (replaceId === undefined) append({ role: "assistant", view });
      else
        setItems((prev) =>
          prev.map((i) => (i.id === replaceId ? { id: i.id, role: "assistant", view } : i)),
        );
    } catch {
      setError({ text: SEND_ERROR, retryWith: { text, imageDataUrl } });
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  function send(raw: string, imageDataUrl?: string): boolean {
    const text = raw.trim();
    if (inFlight.current || (text.length === 0 && !imageDataUrl)) return false;
    append({ role: "user", text, imageDataUrl });
    void run(text, imageDataUrl);
    return true;
  }

  function retryBubble(assistantId: number) {
    if (inFlight.current) return;
    const target = retryTarget(items, assistantId);
    if (target) void run(target.text, target.imageDataUrl, target.replaceId);
  }

  function retryError() {
    if (inFlight.current || !error) return;
    void run(error.retryWith.text, error.retryWith.imageDataUrl);
  }

  function reset() {
    if (inFlight.current) return;
    setItems([]);
    setError(null);
  }

  return { items, sending, error, send, retryBubble, retryError, reset };
}
