"use client";

import { useEffect, useRef, useState } from "react";
import { PromptBox } from "@/components/ui/prompt-box";
import { PromptSendButton } from "@/components/ui/prompt-send-button";
import { cn } from "@/lib/cn";
import { MAX_INPUT_CHARS } from "../constants";
import { useSpeechInput } from "../speech/use-speech-input";
import { AttachButton } from "./attach-button";
import { characterCount, sendBlockReason, shouldShowCount } from "./chat-input-state";
import { ComposerStatus, hasComposerStatus } from "./composer-status";
import { COMPOSER_LABEL, COMPOSER_PLACEHOLDER } from "./guide-copy";
import { useGuide } from "./guide-provider";
import { ImageChip } from "./image-chip";
import { MicButton } from "./mic-button";

type ComposerProps = { inputId: string; size: "compact" | "large"; className?: string };

const SEND_HINT = "Enter sends. Shift and Enter adds a line.";

function firstImage(list: FileList | null | undefined): File | null {
  return Array.from(list ?? []).find((file) => file.type.startsWith("image/")) ?? null;
}

/** The message box: grows with the text, Enter sends, Shift and Enter adds a line. */
export function GuideComposer({ inputId, size, className }: ComposerProps) {
  const guide = useGuide();
  const { draft, setDraft, attachment, imageInputEnabled, sending } = guide;
  const speech = useSpeechInput(draft, setDraft);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dragging, setDragging] = useState(false);
  const [attachHint, setAttachHint] = useState(false);
  const hintId = `${inputId}-hint`;
  const counterId = `${inputId}-count`;

  const image = attachment.state;
  const blockReason = sendBlockReason(draft, sending, {
    hasImage: image.status === "ready",
    imageBusy: image.status === "processing",
  });

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
  const status = {
    speech,
    attachmentError: image.status === "error" ? image.message : null,
    showImageLimits: imageInputEnabled && (attachHint || dragging),
  };
  return (
    <PromptBox
      label={COMPOSER_LABEL}
      size={size}
      highlighted={dragging}
      className={className}
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
      textarea={{
        id: inputId,
        ref: textareaRef,
        value: draft,
        maxLength: MAX_INPUT_CHARS,
        placeholder: COMPOSER_PLACEHOLDER,
        "aria-describedby": showCount ? `${hintId} ${counterId}` : hintId,
        onChange: (event) => setDraft(event.target.value),
        onPaste: (event) => {
          if (takeImage(firstImage(event.clipboardData.files))) event.preventDefault();
        },
        onKeyDown: (event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        },
      }}
      attachments={
        image.status === "ready" || image.status === "processing" ? (
          <ImageChip state={image} onRemove={attachment.clear} />
        ) : null
      }
      tools={
        <>
          {imageInputEnabled ? (
            <AttachButton
              onPick={(file) => takeImage(file)}
              disabled={sending}
              onHintChange={setAttachHint}
            />
          ) : null}
          {speech.supported ? <MicButton speech={speech} disabled={sending} /> : null}
        </>
      }
      meta={
        <>
          <p id={hintId} className="sr-only">
            {blockReason ?? SEND_HINT}
          </p>
          {showCount ? (
            <p
              id={counterId}
              aria-live="polite"
              className={cn(
                "text-xs tabular-nums",
                draft.length >= MAX_INPUT_CHARS ? "text-danger" : "text-muted",
              )}
            >
              {characterCount(draft)}
            </p>
          ) : null}
        </>
      }
      send={
        <PromptSendButton
          busy={sending}
          disabled={blockReason !== null}
          aria-describedby={hintId}
          title={blockReason ?? undefined}
        />
      }
      caption={hasComposerStatus(status) ? <ComposerStatus {...status} /> : null}
    />
  );
}
