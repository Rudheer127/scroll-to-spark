import { cn } from "@/lib/cn";
import { GuideAvatar } from "./guide-avatar";

type MessageBubbleProps = {
  role: "user" | "assistant";
  /** Where the words came from, for example "From the app (AI)". Read aloud by screen readers. */
  label?: string | null;
  children: React.ReactNode;
};

/**
 * One message, in the familiar chat layout: your words in a soft bubble on the right, the guide's
 * words as plain text on the left beside its eagle avatar. The avatar is the label, and screen readers
 * also get a line saying the answer is from the app and is AI, so app text never looks like a person.
 */
export function MessageBubble({ role, label, children }: MessageBubbleProps) {
  if (role === "user") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <span className="text-sm font-semibold text-muted">You</span>
        <div className="max-w-[min(70ch,85%)] rounded-3xl bg-chip px-4 py-2.5 text-base leading-relaxed break-words whitespace-pre-wrap">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <GuideAvatar />
      <div className="min-w-0 w-full max-w-[70ch] pt-1.5 text-base leading-relaxed break-words whitespace-pre-wrap">
        <span className="sr-only">{label ?? "From the app (AI)"}. </span>
        {children}
      </div>
    </div>
  );
}

/** A placeholder with the same layout as an answer, shown while the guide works. */
export function MessageBubblePending() {
  return (
    <div aria-busy="true" className="flex items-start gap-3">
      <GuideAvatar busy />
      <div className={cn("flex w-full max-w-[70ch] flex-col gap-2 pt-3 motion-safe:animate-pulse")}>
        <span className="sr-only">The guide is thinking</span>
        <div className="h-4 w-3/4 rounded-lg bg-chip" />
        <div className="h-4 w-1/2 rounded-lg bg-chip" />
      </div>
    </div>
  );
}
