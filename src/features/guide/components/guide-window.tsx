"use client";

import { useEffect, useId, useRef } from "react";
import { Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuideChat } from "./guide-chat";
import { useGuide } from "./guide-provider";
import { NewChatButton } from "./new-chat-button";

export const WINDOW_INPUT_ID = "guide-input-window";

/**
 * The maximised guide: a modal window over almost the whole screen (all of it on a phone).
 * The native dialog traps focus and Escape closes it. The page behind does not scroll.
 */
export function GuideWindow() {
  const { openPopup, close } = useGuide();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    document.getElementById(WINDOW_INPUT_ID)?.focus();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => {
        // A nested dialog (the New chat confirmation) handles its own Escape.
        if (event.target !== ref.current) return;
        event.preventDefault();
        close();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-background p-0 text-ink shadow-pop backdrop:bg-black/50 sm:m-auto sm:h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)] sm:rounded-2xl sm:border sm:border-border"
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex flex-wrap items-center gap-2 px-4 py-2 sm:px-6">
          <h2 id={titleId} className="text-base font-bold">
            Spark Guide
          </h2>
          <div className="ml-auto flex items-center gap-1">
            <NewChatButton />
            <Button variant="ghost" onClick={openPopup}>
              <Minimize2 aria-hidden className="size-4" />
              Minimize
            </Button>
            <Button variant="ghost" onClick={close} aria-label="Close Spark Guide" className="px-3">
              <X aria-hidden className="size-5" />
            </Button>
          </div>
        </header>
        <div className="min-h-0 flex-1 px-4 pb-4 sm:px-8 lg:px-12">
          <GuideChat variant="window" inputId={WINDOW_INPUT_ID} />
        </div>
      </div>
    </dialog>
  );
}
