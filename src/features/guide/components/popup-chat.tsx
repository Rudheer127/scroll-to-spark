"use client";

import Link from "next/link";
import { Maximize2, Sparkles, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { chatLayoutMode } from "./chat-layout-mode";
import { AI_DISCLOSURE_SHORT, GUIDE_HEADLINE_COMPACT } from "./guide-copy";
import { GuideComposer } from "./guide-composer";
import { useGuide } from "./guide-provider";
import { GuideThread } from "./guide-thread";
import { NewChatButton } from "./new-chat-button";
import { StarterPrompts } from "./starter-prompts";

export const POPUP_INPUT_ID = "guide-input-popup";

/**
 * The mini chat: a slim header, the conversation filling the middle, and the composer pinned to
 * the bottom. It shows the same conversation as the guide page; Expand goes to that page.
 */
export function PopupChat() {
  const { items, sending, error, send, closePopup } = useGuide();
  const mode = chatLayoutMode({ itemCount: items.length, sending, hasError: error !== null });

  const welcome = (
    <div className="flex flex-col gap-3 pb-1">
      <h3 className="text-lg font-bold">{GUIDE_HEADLINE_COMPACT}</h3>
      <StarterPrompts onPick={(message) => void send(message)} disabled={sending} compact />
    </div>
  );

  return (
    <section
      aria-label="Spark Guide"
      onKeyDown={(event) => {
        const inDialog = (event.target as HTMLElement).closest("dialog") !== null;
        if (event.key === "Escape" && !inDialog) closePopup();
      }}
      className="flex h-[min(38rem,calc(100dvh-7rem))] w-[min(25rem,calc(100vw-2rem))] flex-col rounded-(--radius-card) border border-border bg-surface shadow-pop"
    >
      <header className="flex items-center gap-2 border-b border-border py-1.5 pr-1.5 pl-4">
        <Sparkles aria-hidden className="size-5 shrink-0 text-lavender-ink" />
        <h2 className="min-w-0 flex-1 truncate text-base font-bold">Spark Guide</h2>
        <NewChatButton compact />
        <Link
          href="/guide"
          onClick={closePopup}
          aria-label="Expand"
          title="Expand to the guide page"
          className={buttonClasses("ghost", "size-10 p-0 md:min-h-10")}
        >
          <Maximize2 aria-hidden className="size-4" />
        </Link>
        <IconButton
          label="Close Spark Guide"
          title="Close"
          onClick={closePopup}
          className="md:size-10"
        >
          <X aria-hidden className="size-5" />
        </IconButton>
      </header>
      <GuideThread mode={mode} headline={welcome} columnClassName="w-full" fill />
      <div className="px-3 pt-1">
        <GuideComposer inputId={POPUP_INPUT_ID} size="compact" className="bg-background" />
      </div>
      <p className="px-4 pt-1.5 pb-2.5 text-[0.8125rem] text-muted">{AI_DISCLOSURE_SHORT}</p>
    </section>
  );
}
