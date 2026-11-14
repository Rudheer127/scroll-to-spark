"use client";

import { cn } from "@/lib/cn";
import { GuideComposer } from "./guide-composer";
import { GuideThread } from "./guide-thread";

type GuideChatProps = { variant: "popup" | "window" | "page"; inputId: string };

/**
 * The one chat: the conversation above, the composer pinned below. The popup, the maximised
 * window and the full page all render it from the same provider, so they show the same thread.
 */
export function GuideChat({ variant, inputId }: GuideChatProps) {
  return (
    <div data-variant={variant} className={cn("flex h-full min-h-0 flex-col gap-3")}>
      <GuideThread />
      <GuideComposer inputId={inputId} size={variant === "popup" ? "compact" : "large"} />
    </div>
  );
}
