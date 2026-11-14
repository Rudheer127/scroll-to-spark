"use client";

import { useEffect, useRef } from "react";
import { loadGuideChat } from "../actions";
import {
  browserStorage,
  decideStorageSync,
  markTurnFinished,
  readActiveChat,
  writeActiveChat,
} from "./chat-sync-state";
import { useGuide } from "./guide-provider";

/**
 * Keeps the open chat across reloads and in step with other tabs. On load it reopens the chat
 * this person last had open, if the screen is still empty. It remembers every chat that opens,
 * forgets it on New chat, and follows other tabs unless this one is waiting for an answer.
 * Renders nothing.
 */
export function GuideChatSync({ userId }: { userId: string }) {
  const { conversationId, turnVersion, sending, loadConversation } = useGuide();
  // Nothing is written until the remembered chat has had its chance to load.
  const restored = useRef(false);
  // The storage listener reads the latest values without being re-attached on every render.
  const latest = useRef({ conversationId, sending, loadConversation });
  useEffect(() => {
    latest.current = { conversationId, sending, loadConversation };
  });

  useEffect(() => {
    const storage = browserStorage();
    const stored = storage ? readActiveChat(storage, userId) : null;
    if (storage === null || stored === null) {
      restored.current = true;
      return;
    }
    function finish(shown: boolean) {
      restored.current = true;
      // A chat already on screen (opened from the address meanwhile) becomes the remembered one.
      // When the remembered chat itself was shown, the effect below writes the same id.
      if (!shown && storage) writeActiveChat(storage, userId, latest.current.conversationId);
    }
    loadGuideChat(stored)
      .then((result) => {
        const shown =
          result.ok &&
          latest.current.loadConversation(result.data.messages, result.data.id, "empty");
        // Not found or not theirs any more: forget it quietly (finish writes what is on screen).
        finish(shown);
      })
      .catch(() => finish(false));
  }, [userId]);

  useEffect(() => {
    const storage = browserStorage();
    if (restored.current && storage) writeActiveChat(storage, userId, conversationId);
  }, [userId, conversationId]);

  useEffect(() => {
    const storage = browserStorage();
    if (turnVersion > 0 && storage) markTurnFinished(storage, userId, Date.now());
  }, [turnVersion, userId]);

  useEffect(() => {
    const storage = browserStorage();
    if (storage === null) return;
    function onStorage(event: StorageEvent) {
      if (storage === null) return;
      const now = latest.current;
      const decision = decideStorageSync(event, {
        userId,
        sending: now.sending,
        currentId: now.conversationId,
        storedActiveId: readActiveChat(storage, userId),
      });
      if (decision.kind === "clear") now.loadConversation([], null, "idle");
      if (decision.kind !== "load") return;
      loadGuideChat(decision.id)
        .then((result) => {
          if (result.ok) {
            latest.current.loadConversation(result.data.messages, result.data.id, "idle");
          }
        })
        // This tab keeps what it shows; it catches up on the next change or reload.
        .catch(() => undefined);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [userId]);

  return null;
}
