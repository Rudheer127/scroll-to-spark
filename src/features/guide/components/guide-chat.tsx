"use client";

import { cn } from "@/lib/cn";
import { chatLayoutMode } from "./chat-layout-mode";
import { AI_DISCLOSURE, GUIDE_HEADLINE } from "./guide-copy";
import { GuideComposer } from "./guide-composer";
import { useGuide } from "./guide-provider";
import { GuideThread } from "./guide-thread";
import { StarterPrompts } from "./starter-prompts";

/** Messages and the composer share one reading width, centered inside the chat view. */
const COLUMN = "mx-auto w-full max-w-3xl";

/**
 * The full page chat. While empty it is a centered welcome: a headline, the composer and ways to
 * start. After the first message the thread scrolls above and the composer sits at the bottom.
 * The composer stays mounted across that switch, so focus and the draft are kept. The popup is a
 * separate, compact view of the same conversation.
 */
export function GuideChat({ inputId }: { inputId: string }) {
  const { items, sending, error, send } = useGuide();
  const mode = chatLayoutMode({ itemCount: items.length, sending, hasError: error !== null });
  const empty = mode === "empty";

  const headline = (
    <h2 className="text-center text-3xl font-bold text-balance motion-safe:animate-rise sm:text-4xl lg:text-5xl">
      {GUIDE_HEADLINE}
    </h2>
  );

  return (
    <div
      data-mode={mode}
      className={cn(
        "flex h-full min-h-0 flex-col",
        empty && "justify-center-safe gap-6 overflow-y-auto px-1 py-4",
      )}
    >
      <GuideThread mode={mode} headline={headline} columnClassName={COLUMN} />
      <div
        className={cn(
          COLUMN,
          empty && "motion-safe:animate-rise motion-safe:[animation-delay:60ms]",
        )}
      >
        <GuideComposer inputId={inputId} size="large" />
      </div>
      {empty ? (
        <StarterPrompts onPick={(message) => void send(message)} disabled={sending} />
      ) : null}
      <p
        className={cn(
          COLUMN,
          "px-2 text-center text-xs text-muted",
          empty ? "motion-safe:animate-rise motion-safe:[animation-delay:240ms]" : "pt-2",
        )}
      >
        {AI_DISCLOSURE}
      </p>
    </div>
  );
}
