"use client";

import { useAutoGrow } from "@/hooks/use-auto-grow";
import { cn } from "@/lib/cn";

type TextareaProps = Omit<React.ComponentProps<"textarea">, "ref" | "rows" | "value"> & {
  id: string;
  value: string;
  ref: React.RefObject<HTMLTextAreaElement | null>;
};

type PromptBoxProps = Omit<React.ComponentProps<"form">, "children"> & {
  /** Read by screen readers. The placeholder is only a hint. */
  label: string;
  textarea: TextareaProps;
  /** Shown above the text, for example an attached image. */
  attachments?: React.ReactNode;
  /** Quiet tool buttons on the bottom left, such as attach and voice. */
  tools?: React.ReactNode;
  /** Small text next to the send button, such as a character counter. */
  meta?: React.ReactNode;
  /** The send button on the bottom right. */
  send: React.ReactNode;
  /** A line under the toolbar, inside the card, for limits, problems and voice notes. */
  caption?: React.ReactNode;
  size?: "compact" | "large";
  /** Draws the edge in the action color, for example while a file is dragged over. */
  highlighted?: boolean;
};

const FIELD_SIZE = {
  compact: "min-h-[2.25rem] max-h-[10rem] text-sm",
  large: "min-h-[2.5rem] max-h-[12.5rem] text-base",
} as const;

/**
 * A chat composer card: a text box that grows with its content on top, tools on the bottom left,
 * a send button on the bottom right. The whole card shows the focus ring while the text box has
 * focus. It holds no chat logic; the caller passes the text box props and the controls.
 */
export function PromptBox({
  label,
  textarea,
  attachments,
  tools,
  meta,
  send,
  caption,
  size = "large",
  highlighted = false,
  className,
  ...formProps
}: PromptBoxProps) {
  const { className: fieldClassName, onFocus, ...fieldProps } = textarea;
  const fit = useAutoGrow(textarea.ref, textarea.value);
  return (
    <form
      className={cn(
        "flex flex-col gap-1 rounded-3xl border bg-surface p-2 shadow-card transition-[border-color]",
        "has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-action",
        highlighted ? "border-action" : "border-border",
        className,
      )}
      {...formProps}
    >
      <label htmlFor={textarea.id} className="sr-only">
        {label}
      </label>
      {attachments ? <div className="px-1 pt-1">{attachments}</div> : null}
      <textarea
        rows={1}
        onFocus={(event) => {
          fit();
          onFocus?.(event);
        }}
        // The card draws the focus ring, so the text box drops its own. The trailing "!" is
        // Tailwind's important flag, needed to beat the global :focus-visible outline.
        className={cn(
          "w-full resize-none overflow-y-auto bg-transparent px-3 pt-2 leading-normal text-ink placeholder:text-muted focus-visible:outline-none!",
          FIELD_SIZE[size],
          fieldClassName,
        )}
        {...fieldProps}
      />
      <div className="flex min-h-11 items-center gap-1 md:min-h-9">
        <div className="flex items-center gap-0.5">{tools}</div>
        <div className="ml-auto flex items-center gap-2">
          {meta}
          {send}
        </div>
      </div>
      {caption ? <div className="px-3 pb-1">{caption}</div> : null}
    </form>
  );
}
