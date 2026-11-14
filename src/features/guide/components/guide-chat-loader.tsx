"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { LoadedChat } from "../types";
import { useGuide } from "./guide-provider";

type GuideChatLoaderProps = {
  /** The chat id in the address, if any. */
  requested: string | null;
  /** That chat, read on the server for the signed-in person, or null when not theirs or missing. */
  chat: LoadedChat | null;
};

const GUIDE_PATH = "/guide";

/**
 * Connects the guide page address to the shared conversation. Opening /guide?chat=<id> shows that
 * chat; an id that is missing or not the person's shows a fresh chat. While the page is open, the
 * address follows the chat on screen, so a reload brings the same chat back. Renders nothing.
 */
export function GuideChatLoader({ requested, chat }: GuideChatLoaderProps) {
  const { conversationId, loadConversation } = useGuide();
  const router = useRouter();
  const loadKey = chat?.id ?? (requested === null ? null : `missing:${requested}`);

  // Only a new address loads a chat; the conversation changing on its own must not. So the load
  // effect runs on loadKey alone and reads everything else through this ref.
  const latest = useRef({ chat, requested, conversationId, loadConversation, router });
  useEffect(() => {
    latest.current = { chat, requested, conversationId, loadConversation, router };
  });

  useEffect(() => {
    const now = latest.current;
    if (now.chat) {
      // Already on screen (for example continued in the popup): keep the live thread.
      if (now.chat.id !== now.conversationId) {
        now.loadConversation(now.chat.messages, now.chat.id, "always");
      }
      return;
    }
    if (now.requested !== null) {
      now.loadConversation([], null, "always");
      now.router.replace(GUIDE_PATH);
    }
  }, [loadKey]);

  useEffect(() => {
    if (conversationId === null) return;
    const inAddress = new URLSearchParams(window.location.search).get("chat");
    if (inAddress !== conversationId) {
      window.history.replaceState(null, "", `${GUIDE_PATH}?chat=${conversationId}`);
    }
  }, [conversationId]);

  return null;
}
