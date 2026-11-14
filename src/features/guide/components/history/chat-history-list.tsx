"use client";

import { useState } from "react";
import type { ConversationSummary } from "../../types";
import { useGuide } from "../guide-provider";
import { ChatHistoryRow } from "./chat-history-row";
import { DeleteChatDialog } from "./delete-chat-dialog";

/** The recent chats, newest first. The chat on screen is highlighted. */
export function ChatHistoryList({ chats }: { chats: ConversationSummary[] }) {
  const { conversationId } = useGuide();
  const [deleting, setDeleting] = useState<ConversationSummary | null>(null);

  if (chats.length === 0) {
    return <p className="px-3.5 py-2 text-sm text-muted">No chats yet. Ask the guide something.</p>;
  }

  return (
    <>
      <ul aria-label="Recent chats" className="flex flex-col gap-0.5">
        {chats.map((chat) => (
          <ChatHistoryRow
            key={chat.id}
            chat={chat}
            current={chat.id === conversationId}
            onDelete={() => setDeleting(chat)}
          />
        ))}
      </ul>
      {deleting ? <DeleteChatDialog chat={deleting} onClose={() => setDeleting(null)} /> : null}
    </>
  );
}
