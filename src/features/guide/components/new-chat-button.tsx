"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useGuide } from "./guide-provider";

/**
 * Starts a fresh chat. A saved chat stays in the sidebar list, so it clears at once; only a chat
 * that was never saved (for example one that only failed) asks first. On the guide page the
 * address loses the old chat id, so a reload shows the new chat.
 */
export function NewChatButton({ compact = false }: { compact?: boolean }) {
  const { items, conversationId, startNewChat, sending } = useGuide();
  const router = useRouter();
  const pathname = usePathname();
  const [confirming, setConfirming] = useState(false);

  function clearAll() {
    startNewChat();
    setConfirming(false);
    if (pathname.startsWith("/guide")) router.replace("/guide");
  }

  const unsaved = items.length > 0 && conversationId === null;
  const hint = sending ? "Wait for the answer, then start a new chat" : "New chat";

  return (
    <>
      <Button
        variant="ghost"
        disabled={sending}
        title={hint}
        aria-label={compact ? "New chat" : undefined}
        onClick={() => (unsaved ? setConfirming(true) : clearAll())}
        className={compact ? "size-10 p-0 md:min-h-10" : undefined}
      >
        <SquarePen aria-hidden className="size-4" />
        {compact ? null : "New chat"}
      </Button>
      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Start a new chat?"
        description="This chat was not saved, so clearing it cannot be undone."
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" onClick={clearAll}>
            Clear and start over
          </Button>
          <Button variant="outline" onClick={() => setConfirming(false)}>
            Keep this chat
          </Button>
        </div>
      </Dialog>
    </>
  );
}
