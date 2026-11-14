"use client";

import { useRef } from "react";
import { Paperclip } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { ACCEPTED_IMAGE_TYPES, IMAGE_LIMITS_NOTE } from "../vision/constants";

type AttachButtonProps = {
  onPick: (file: File) => void;
  disabled: boolean;
  /** True while the button is hovered or focused, so the composer can show the image limits. */
  onHintChange: (showing: boolean) => void;
};

/** Opens the file picker for one image. Rendered only when image reading is on. */
export function AttachButton({ onPick, disabled, onHintChange }: AttachButtonProps) {
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
      <IconButton
        label={`Attach an image. ${IMAGE_LIMITS_NOTE}`}
        title={IMAGE_LIMITS_NOTE}
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        onMouseEnter={() => onHintChange(true)}
        onMouseLeave={() => onHintChange(false)}
        onFocus={() => onHintChange(true)}
        onBlur={() => onHintChange(false)}
      >
        <Paperclip aria-hidden className="size-5" />
      </IconButton>
    </>
  );
}
