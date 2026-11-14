import { ArrowUp, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type PromptSendButtonProps = Omit<React.ComponentProps<"button">, "children" | "type"> & {
  /** Shows a spinner while the message is on its way. */
  busy?: boolean;
  /** The name read by screen readers. */
  label?: string;
};

/**
 * The round send button of a prompt box: an arrow on an ink fill. When it is off, pass the reason
 * through aria-describedby and title, so the reason is never only a grey look.
 */
export function PromptSendButton({
  busy = false,
  label = "Send",
  className,
  ...props
}: PromptSendButtonProps) {
  return (
    <button
      type="submit"
      aria-busy={busy || undefined}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-on-ink hover:opacity-90 active:opacity-75 disabled:cursor-not-allowed md:size-9",
        busy ? "disabled:opacity-80" : "disabled:bg-chip disabled:text-muted",
        className,
      )}
      {...props}
    >
      {busy ? (
        <LoaderCircle aria-hidden className="size-4 motion-safe:animate-spin" />
      ) : (
        <ArrowUp aria-hidden className="size-5" strokeWidth={2.25} />
      )}
      <span className="sr-only">{label}</span>
    </button>
  );
}
