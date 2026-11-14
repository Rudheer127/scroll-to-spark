"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Maximize2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiChip } from "./ai-chip";
import { GuideChat } from "./guide-chat";
import { useGuide } from "./guide-provider";
import { GuideWindow } from "./guide-window";
import { NewChatButton } from "./new-chat-button";

const POPUP_INPUT_ID = "guide-input-popup";

/**
 * The one Spark Guide entry: a floating button that opens a compact chat, which can expand into
 * the maximised window. It is not shown on the full guide page, which has the chat already.
 */
export function GuidePopup() {
  const pathname = usePathname();
  const { view, openPopup, maximise, close, launcherRef } = useGuide();
  const previous = useRef(view);

  useEffect(() => {
    if (view === "popup") document.getElementById(POPUP_INPUT_ID)?.focus();
    else if (view === "closed" && previous.current !== "closed") launcherRef.current?.focus();
    previous.current = view;
  }, [view, launcherRef]);

  if (pathname.startsWith("/guide")) return null;

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {view === "popup" ? (
        <section
          aria-label="Spark Guide"
          onKeyDown={(event) => {
            const inDialog = (event.target as HTMLElement).closest("dialog") !== null;
            if (event.key === "Escape" && !inDialog) close();
          }}
          className="flex h-[min(40rem,calc(100dvh-7rem))] w-[min(26rem,calc(100vw-2rem))] flex-col gap-2 rounded-(--radius-card) border border-border bg-surface p-3 shadow-pop"
        >
          <header className="flex items-center gap-1.5 border-b border-border pb-2 pl-1">
            <Sparkles aria-hidden className="size-5 text-lavender-ink" />
            <h2 className="text-base font-bold">Spark Guide</h2>
            <AiChip />
            <div className="ml-auto flex items-center">
              <NewChatButton compact />
              <Button variant="ghost" onClick={maximise} className="px-3">
                <Maximize2 aria-hidden className="size-4" />
                Expand
              </Button>
              <Button
                variant="ghost"
                onClick={close}
                aria-label="Close Spark Guide"
                className="px-3"
              >
                <X aria-hidden className="size-5" />
              </Button>
            </div>
          </header>
          <GuideChat variant="popup" inputId={POPUP_INPUT_ID} />
          <Link
            href="/guide"
            onClick={close}
            className="self-start px-1 text-xs font-semibold text-action hover:underline"
          >
            Open the full page
          </Link>
        </section>
      ) : null}
      {view === "window" ? <GuideWindow /> : null}
      {view === "popup" ? null : (
        <button
          ref={launcherRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={view !== "closed"}
          onClick={openPopup}
          className="flex min-h-12 items-center gap-2 rounded-full bg-ink px-5 font-semibold text-on-ink shadow-pop hover:opacity-90 active:opacity-75"
        >
          <Sparkles aria-hidden className="size-5" />
          Spark Guide
        </button>
      )}
    </div>
  );
}
