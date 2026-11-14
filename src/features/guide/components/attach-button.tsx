"use client";

import { useRef } from "react";
import { Paperclip } from "lucide-react";
import { ACCEPTED_IMAGE_TYPES, IMAGE_LIMITS_NOTE } from "../vision/constants";

/** Opens the file picker for one image. Rendered only when image reading is on. */
export function AttachButton({
  onPick,
  disabled,
}: {
  onPick: (file: File) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-label={`Attach an image. ${IMAGE_LIMITS_NOTE}`}
        title={IMAGE_LIMITS_NOTE}
        className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-chip active:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 md:size-10"
      >
        <Paperclip aria-hidden className="size-5" />
      </button>
    </>
  );
}
