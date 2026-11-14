"use client";

import { Mic, Square } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import type { SpeechInput } from "../speech/use-speech-input";

export const SPEECH_SERVICE_NOTE = "Speech recognition uses your browser's speech service.";

/**
 * Starts and stops voice input. Rendered only when the browser supports it. While listening it
 * shows a stop icon and a visible "Listening" label, not only a color change.
 */
export function MicButton({ speech, disabled }: { speech: SpeechInput; disabled: boolean }) {
  const active = speech.state.status === "listening" || speech.state.status === "starting";
  if (active) {
    return (
      <button
        type="button"
        onClick={speech.stop}
        title={SPEECH_SERVICE_NOTE}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-chip px-3 text-sm font-medium text-ink hover:opacity-90 active:opacity-75 md:min-h-9"
      >
        <span aria-hidden className="size-2 rounded-full bg-danger motion-safe:animate-pulse" />
        <span>Listening</span>
        <Square aria-hidden className="size-3.5 fill-current" />
        <span className="sr-only">, stop voice input</span>
      </button>
    );
  }
  return (
    <IconButton
      label="Start voice input"
      title={SPEECH_SERVICE_NOTE}
      onClick={speech.start}
      disabled={disabled}
    >
      <Mic aria-hidden className="size-5" />
    </IconButton>
  );
}
