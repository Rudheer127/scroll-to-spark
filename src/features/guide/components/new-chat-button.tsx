"use client";

import { useState } from "react";
import { SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useGuide } from "./guide-provider";

/** Clears the thread. Asks first when there is something to lose. */
export function NewChatButton({ compact = false }: { compact?: boolean }) {
  const { items, reset, sending, setDraft, attachment } = useGuide();
  const [confirming, setConfirming] = useState(false);

  function clearAll() {
    reset();
    setDraft("");
    attachment.clear();
    setConfirming(false);
  }

  return (
    <>
      <Button
        variant="ghost"
        disabled={sending}
        title={sending ? "Wait for the answer, then start a new chat" : "Start a new chat"}
        aria-label={compact ? "New chat" : undefined}
        onClick={() => (items.length > 0 ? setConfirming(true) : clearAll())}
        className={compact ? "px-3" : undefined}
      >
        <SquarePen aria-hidden className="size-4" />
        {compact ? null : "New chat"}
      </Button>
      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Start a new chat?"
        description="This clears the conversation on this screen. It cannot be brought back here."
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
