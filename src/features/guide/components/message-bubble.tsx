import { Bot } from "lucide-react";
import { cn } from "@/lib/cn";

type MessageBubbleProps = {
  role: "user" | "assistant";
  /** Where the words came from, for example "From the app (AI)". Shown next to the AI chip. */
  label?: string | null;
  children: React.ReactNode;
};

/** One message. Every assistant message carries an AI chip, so app text never looks like a person. */
export function MessageBubble({ role, label, children }: MessageBubbleProps) {
  const assistant = role === "assistant";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-sm text-muted">
        {assistant ? (
          <>
            <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-0.5 text-xs font-semibold text-ink">
              <Bot aria-hidden className="size-3.5" />
              AI
            </span>
            {label ? <span>{label}</span> : null}
          </>
        ) : (
          <span className="font-semibold">You</span>
        )}
      </div>
      <div
        className={cn(
          "max-w-[70ch] rounded-(--radius-card) border px-4 py-3 text-base whitespace-pre-wrap break-words",
          assistant ? "border-border bg-surface" : "border-transparent bg-chip",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** A placeholder with the same layout as an answer, shown while the guide works. */
export function MessageBubblePending() {
  return (
    <div aria-busy="true" className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-0.5 text-xs font-semibold text-ink">
          <Bot aria-hidden className="size-3.5" />
          AI
        </span>
        <span>Thinking</span>
      </div>
      <div className="flex max-w-[70ch] animate-pulse flex-col gap-2 rounded-(--radius-card) border border-border bg-surface px-4 py-4">
        <div className="h-4 w-3/4 rounded-lg bg-chip" />
        <div className="h-4 w-1/2 rounded-lg bg-chip" />
      </div>
    </div>
  );
}
