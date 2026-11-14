import { cn } from "@/lib/cn";
import { AiChip } from "./ai-chip";

type MessageBubbleProps = {
  role: "user" | "assistant";
  /** Where the words came from, for example "From the app (AI)". Shown next to the AI chip. */
  label?: string | null;
  children: React.ReactNode;
};

/**
 * One message, in the familiar chat layout: your words in a soft bubble on the right, the guide's
 * words as plain text on the left. Every assistant message carries an AI chip, so app text never
 * looks like a person.
 */
export function MessageBubble({ role, label, children }: MessageBubbleProps) {
  const assistant = role === "assistant";
  return (
    <div className={cn("flex flex-col gap-1.5", assistant ? "items-start" : "items-end")}>
      <div className="flex items-center gap-2 text-sm text-muted">
        {assistant ? (
          <>
            <AiChip />
            {label ? <span>{label}</span> : null}
          </>
        ) : (
          <span className="font-semibold">You</span>
        )}
      </div>
      <div
        className={cn(
          "text-base leading-relaxed break-words whitespace-pre-wrap",
          assistant
            ? "w-full max-w-[70ch]"
            : "max-w-[min(70ch,85%)] rounded-3xl bg-chip px-4 py-2.5",
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
        <AiChip />
        <span aria-hidden>Thinking</span>
        <span className="sr-only">The guide is thinking</span>
      </div>
      <div className="flex w-full max-w-[70ch] flex-col gap-2 py-1 motion-safe:animate-pulse">
        <div className="h-4 w-3/4 rounded-lg bg-chip" />
        <div className="h-4 w-1/2 rounded-lg bg-chip" />
      </div>
    </div>
  );
}
