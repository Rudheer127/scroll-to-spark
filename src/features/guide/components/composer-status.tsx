import type { SpeechInput } from "../speech/use-speech-input";
import { IMAGE_LIMITS_NOTE } from "../vision/constants";
import { SPEECH_SERVICE_NOTE } from "./mic-button";

type ComposerStatusProps = {
  hintId: string;
  blockReason: string | null;
  speech: SpeechInput;
  attachmentError: string | null;
  imageInputEnabled: boolean;
};

const SEND_HINT = "Enter sends. Shift and Enter adds a line.";

/**
 * The line under the composer: why Send is off, or how to send, plus any problem with voice or
 * an image in plain words. Image limits are shown up front, before anything is picked.
 */
export function ComposerStatus({
  hintId,
  blockReason,
  speech,
  attachmentError,
  imageInputEnabled,
}: ComposerStatusProps) {
  const listening = speech.state.status === "listening" || speech.state.status === "starting";
  const problem = speech.errorMessage ?? attachmentError;
  return (
    <div className="flex flex-col gap-1 px-2 pb-1">
      {problem ? (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      ) : null}
      <p id={hintId} className="text-xs text-muted">
        {blockReason ?? SEND_HINT}
      </p>
      {listening ? (
        <p className="text-xs text-muted" aria-live="polite">
          {SPEECH_SERVICE_NOTE}
        </p>
      ) : null}
      {imageInputEnabled && !listening ? (
        <p className="text-xs text-muted">Images: {IMAGE_LIMITS_NOTE}</p>
      ) : null}
    </div>
  );
}
