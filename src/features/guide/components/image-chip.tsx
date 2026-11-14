"use client";

import { ImageIcon, X } from "lucide-react";
import type { AttachmentState } from "./use-image-attachment";

/** The attached image before sending: a thumbnail, its name and a button to remove it. */
export function ImageChip({ state, onRemove }: { state: AttachmentState; onRemove: () => void }) {
  if (state.status !== "ready" && state.status !== "processing") return null;
  return (
    <div className="flex w-fit max-w-full items-center gap-3 rounded-(--radius-input) border border-border bg-background py-1.5 pr-1.5 pl-1.5">
      {state.status === "ready" ? (
        // A data URL preview from the person's own file, so next/image adds nothing here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={state.dataUrl}
          alt="Attached image preview"
          className="size-12 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-chip">
          <ImageIcon aria-hidden className="size-5 text-muted" />
        </span>
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold">{state.name}</span>
        <span className="text-xs text-muted">
          {state.status === "ready" ? "Ready to send" : "Getting it ready"}
        </span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${state.name}`}
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-chip active:opacity-75 md:size-9"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
