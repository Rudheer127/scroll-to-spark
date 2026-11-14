"use client";

import { cn } from "@/lib/cn";
import { chatLayoutMode } from "./chat-layout-mode";
import { AI_DISCLOSURE, GUIDE_HEADLINE, GUIDE_HEADLINE_COMPACT } from "./guide-copy";
import { GuideComposer } from "./guide-composer";
import { useGuide } from "./guide-provider";
import { GuideThread } from "./guide-thread";
import { StarterPrompts } from "./starter-prompts";

type GuideChatProps = { variant: "popup" | "window" | "page"; inputId: string };

/** Messages and the composer share one reading width, centered inside the chat view. */
const COLUMN = "mx-auto w-full max-w-3xl";

/**
 * The one chat. While empty it is a centered welcome: a headline, the composer and ways to start.
 * After the first message the thread scrolls above and the composer sits at the bottom. The
 * composer stays mounted across that switch, so focus and the draft are kept. The popup, the
 * maximised window and the full page all render it from the same provider.
 */
export function GuideChat({ variant, inputId }: GuideChatProps) {
  const { items, sending, error, send } = useGuide();
  const mode = chatLayoutMode({ itemCount: items.length, sending, hasError: error !== null });
  const empty = mode === "empty";
  const compact = variant === "popup";
  const Heading = variant === "page" ? "h2" : "h3";

  const headline = (
    <Heading
      className={cn(
        "text-center font-bold text-balance motion-safe:animate-rise",
        compact ? "text-2xl" : "text-3xl sm:text-4xl lg:text-5xl",
      )}
    >
      {compact ? GUIDE_HEADLINE_COMPACT : GUIDE_HEADLINE}
    </Heading>
  );

  return (
    <div
      data-variant={variant}
      data-mode={mode}
      className={cn(
        "flex h-full min-h-0 flex-col",
        empty && "justify-center-safe overflow-y-auto",
        empty && (compact ? "gap-4 py-1" : "gap-6 py-4"),
      )}
    >
      <GuideThread mode={mode} headline={headline} columnClassName={COLUMN} />
      <div
        className={cn(
          COLUMN,
          empty && "motion-safe:animate-rise motion-safe:[animation-delay:60ms]",
        )}
      >
        <GuideComposer
          inputId={inputId}
          size={compact ? "compact" : "large"}
          className={compact ? "bg-background" : undefined}
        />
      </div>
      {empty ? (
        <StarterPrompts
          onPick={(message) => void send(message)}
          disabled={sending}
          compact={compact}
        />
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
