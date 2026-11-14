"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { MAX_INPUT_CHARS } from "../constants";
import { useSpeechInput } from "../speech/use-speech-input";
import { AttachButton } from "./attach-button";
import { characterCount, sendBlockReason, shouldShowCount } from "./chat-input-state";
import { ComposerStatus } from "./composer-status";
import { useGuide } from "./guide-provider";
import { ImageChip } from "./image-chip";
import { MicButton } from "./mic-button";

type ComposerProps = { inputId: string; size: "compact" | "large" };

const MAX_HEIGHT = { compact: 160, large: 320 } as const;

function firstImage(list: FileList | null | undefined): File | null {
  return Array.from(list ?? []).find((file) => file.type.startsWith("image/")) ?? null;
}

/** The message box: grows with the text, Enter sends, Shift and Enter adds a line. */
export function GuideComposer({ inputId, size }: ComposerProps) {
  const guide = useGuide();
  const { draft, setDraft, attachment, imageInputEnabled, sending } = guide;
  const speech = useSpeechInput(draft, setDraft);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dragging, setDragging] = useState(false);
  const hintId = `${inputId}-hint`;
  const counterId = `${inputId}-count`;

  const image = attachment.state;
  const blockReason = sendBlockReason(draft, sending, {
    hasImage: image.status === "ready",
    imageBusy: image.status === "processing",
  });

  function fitHeight() {
    const field = textareaRef.current;
    if (!field) return;
    field.style.height = "auto";
    // A box inside a dialog that is not open yet measures 0; keep the rows height until focus.
    if (field.scrollHeight === 0) return;
    field.style.height = `${Math.min(field.scrollHeight, MAX_HEIGHT[size])}px`;
  }

  useLayoutEffect(fitHeight, [draft, size]);

  const wasSending = useRef(sending);
  useEffect(() => {
    if (wasSending.current && !sending) textareaRef.current?.focus();
    wasSending.current = sending;
  }, [sending]);

  function submit() {
    if (blockReason !== null) return;
    speech.cancel();
    const dataUrl = image.status === "ready" ? image.dataUrl : undefined;
    if (guide.send(draft, dataUrl)) {
      setDraft("");
      attachment.clear();
    }
  }

  function takeImage(file: File | null): boolean {
    if (!imageInputEnabled || !file) return false;
    attachment.attach(file);
    return true;
  }

  const showCount = shouldShowCount(draft);
  return (
    <form
      className={cn(
        "flex flex-col gap-2 rounded-(--radius-card) border bg-surface p-2 shadow-card",
        dragging ? "border-action" : "border-control",
      )}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      onDragOver={(event) => {
        if (!imageInputEnabled) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        setDragging(false);
        if (takeImage(firstImage(event.dataTransfer.files))) event.preventDefault();
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Message the Spark Guide
      </label>
      <ImageChip state={image} onRemove={attachment.clear} />
      <textarea
        id={inputId}
        ref={textareaRef}
        rows={size === "large" ? 2 : 1}
        value={draft}
        maxLength={MAX_INPUT_CHARS}
        placeholder="Message the Spark Guide"
        aria-describedby={showCount ? `${hintId} ${counterId}` : hintId}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={fitHeight}
        onPaste={(event) => {
          if (takeImage(firstImage(event.clipboardData.files))) event.preventDefault();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        }}
        className={cn(
          "w-full resize-none overflow-y-auto bg-transparent px-2 py-1.5 text-ink placeholder:text-muted",
          size === "large" ? "text-base" : "text-sm",
        )}
      />
      <div className="flex flex-wrap items-center gap-1">
        {imageInputEnabled ? (
          <AttachButton onPick={(file) => takeImage(file)} disabled={sending} />
        ) : null}
        {speech.supported ? <MicButton speech={speech} disabled={sending} /> : null}
        {showCount ? (
          <p id={counterId} className="ml-auto px-2 text-xs text-muted" aria-live="polite">
            {characterCount(draft)}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={blockReason !== null}
          aria-describedby={hintId}
          className={showCount ? "" : "ml-auto"}
        >
          <Send aria-hidden className="size-4" />
          Send
        </Button>
      </div>
      <ComposerStatus
        hintId={hintId}
        blockReason={blockReason}
        speech={speech}
        attachmentError={image.status === "error" ? image.message : null}
        imageInputEnabled={imageInputEnabled}
      />
    </form>
  );
}
