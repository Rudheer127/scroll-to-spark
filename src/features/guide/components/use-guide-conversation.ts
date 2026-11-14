"use client";

import { useRef, useState } from "react";
import type { StoredMessage } from "../types";
import { retryTarget } from "./retry-target";
import { sendGuideTurn } from "./send-guide-turn";
import { storedToItems } from "./stored-message-view";
import { toMessageView, type MessageView } from "./to-message-view";

type NewItem =
  { role: "user"; text: string; imageDataUrl?: string } | { role: "assistant"; view: MessageView };
export type ChatItem = NewItem & { id: number };
export type ChatError = { text: string; retryWith: { text: string; imageDataUrl?: string } };

/**
 * When a loaded chat may replace what is on screen. "always" is a person opening a chat; "idle"
 * skips it while an answer is on its way; "empty" applies only to a blank, unsaved chat.
 */
export type LoadWhen = "always" | "idle" | "empty";

const SEND_ERROR = "The guide could not answer. Your message is still here.";

export type GuideConversation = {
  items: ChatItem[];
  sending: boolean;
  error: ChatError | null;
  /** The saved chat on screen, or null for a new, unsaved one. */
  conversationId: string | null;
  /** Goes up by one after every answered turn, so other tabs can be told. */
  turnVersion: number;
  /** Sends a new message. Returns false when nothing was sent. */
  send: (text: string, imageDataUrl?: string) => boolean;
  retryBubble: (assistantId: number) => void;
  retryError: () => void;
  reset: () => void;
  /** Shows a saved chat, or a fresh one with ([], null). Returns false when skipped. */
  loadConversation: (messages: StoredMessage[], id: string | null, when?: LoadWhen) => boolean;
};

type Options = { onConversationCreated?: (id: string) => void };

/**
 * The one conversation. It lives in the guide provider, so the popup and the full page show the
 * same thread. A retry replaces the failed answer in place. Every send carries the saved chat id,
 * and loading another chat drops any answer still on its way for the old one.
 */
export function useGuideConversation({ onConversationCreated }: Options = {}): GuideConversation {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [turnVersion, setTurnVersion] = useState(0);
  const nextId = useRef(0);
  const inFlight = useRef(false);
  const generation = useRef(0);
  const idRef = useRef<string | null>(null);
  const countRef = useRef(0);

  const append = (item: NewItem) => {
    countRef.current += 1;
    setItems((prev) => [...prev, { ...item, id: nextId.current++ }]);
  };

  function rememberId(id: string | null) {
    idRef.current = id;
    setConversationId(id);
  }

  function settle(turn: number) {
    if (turn !== generation.current) return;
    inFlight.current = false;
    setSending(false);
  }

  async function run(text: string, imageDataUrl: string | undefined, replaceId?: number) {
    const turn = generation.current;
    inFlight.current = true;
    setError(null);
    setSending(true);
    try {
      const result = await sendGuideTurn(text, imageDataUrl, idRef.current ?? undefined);
      if (turn !== generation.current) return;
      if (!result.ok) {
        setError({ text: result.error, retryWith: { text, imageDataUrl } });
        return;
      }
      const created = result.data.conversationId;
      if (created && created !== idRef.current) {
        rememberId(created);
        onConversationCreated?.(created);
      }
      const view = toMessageView(result.data);
      if (replaceId === undefined) append({ role: "assistant", view });
      else
        setItems((prev) =>
          prev.map((i) => (i.id === replaceId ? { id: i.id, role: "assistant", view } : i)),
        );
      setTurnVersion((v) => v + 1);
    } catch {
      if (turn === generation.current) {
        setError({ text: SEND_ERROR, retryWith: { text, imageDataUrl } });
      }
    } finally {
      settle(turn);
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
    countRef.current = 0;
    setItems([]);
    setError(null);
    rememberId(null);
  }

  function loadConversation(
    messages: StoredMessage[],
    id: string | null,
    when: LoadWhen = "always",
  ): boolean {
    if (when !== "always" && inFlight.current) return false;
    if (when === "empty" && (countRef.current > 0 || idRef.current !== null)) return false;
    generation.current += 1;
    inFlight.current = false;
    setSending(false);
    setError(null);
    const loaded = storedToItems(messages).map((item) => ({ ...item, id: nextId.current++ }));
    countRef.current = loaded.length;
    setItems(loaded);
    rememberId(id);
    return true;
  }

  return {
    items,
    sending,
    error,
    conversationId,
    turnVersion,
    send,
    retryBubble,
    retryError,
    reset,
    loadConversation,
  };
}
