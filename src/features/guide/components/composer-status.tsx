import type { SpeechInput } from "../speech/use-speech-input";
import { IMAGE_LIMITS_NOTE } from "../vision/constants";
import { SPEECH_SERVICE_NOTE } from "./mic-button";

type ComposerStatusProps = {
  speech: SpeechInput;
  attachmentError: string | null;
  /** True while the attach button is hovered or focused, or a file is dragged over the box. */
  showImageLimits: boolean;
};

/**
 * The small line inside the composer, shown only when it has something to say: a problem with
 * voice or an image, the speech service note while listening, or the image limits before upload.
 */
export function ComposerStatus({ speech, attachmentError, showImageLimits }: ComposerStatusProps) {
  const listening = speech.state.status === "listening" || speech.state.status === "starting";
  const problem = speech.errorMessage ?? attachmentError;
  const limits = showImageLimits || attachmentError !== null;
  return (
    <div className="flex flex-col gap-0.5" aria-live="polite">
      {problem ? (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      ) : null}
      {listening ? <p className="text-xs text-muted">{SPEECH_SERVICE_NOTE}</p> : null}
      {limits ? <p className="text-xs text-muted">Images: {IMAGE_LIMITS_NOTE}</p> : null}
    </div>
  );
}

/** Whether the status line has anything to show, so the composer can leave it out entirely. */
export function hasComposerStatus({
  speech,
  attachmentError,
  showImageLimits,
}: ComposerStatusProps): boolean {
  const listening = speech.state.status === "listening" || speech.state.status === "starting";
  return listening || speech.errorMessage !== null || attachmentError !== null || showImageLimits;
}
