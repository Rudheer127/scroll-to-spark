"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { deleteConversation } from "../../actions";
import type { ConversationSummary } from "../../types";
import { useGuide } from "../guide-provider";

type DeleteChatDialogProps = { chat: ConversationSummary; onClose: () => void };

/**
 * Asks before deleting a chat for good. After deleting the chat on screen, a fresh chat opens.
 * Rendered into the body, so a collapsing sidebar never hides it.
 */
export function DeleteChatDialog({ chat, onClose }: DeleteChatDialogProps) {
  const { conversationId, startNewChat } = useGuide();
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteConversation(chat.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
      if (chat.id === conversationId) {
        startNewChat();
        if (pathname.startsWith("/guide")) router.replace("/guide");
        else router.push("/guide");
      }
      router.refresh();
    });
  }

  return createPortal(
    <Dialog
      open
      onClose={onClose}
      title="Delete this chat?"
      description={`"${chat.title}" and all its messages will be removed from your account. This cannot be undone.`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="danger" onClick={confirm} disabled={pending}>
          {pending ? "Deleting" : "Delete chat"}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={pending}>
          Keep it
        </Button>
        {error ? (
          <p role="alert" className="w-full text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </Dialog>,
    document.body,
  );
}
