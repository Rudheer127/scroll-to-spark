export type SpeechError =
  "denied" | "no_speech" | "no_microphone" | "network" | "unsupported" | "failed";

export type SpeechState =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "listening" }
  | { status: "error"; error: SpeechError };

export type SpeechEvent =
  | { type: "start" }
  | { type: "started" }
  | { type: "stop" }
  | { type: "ended" }
  | { type: "failed"; code: string };

/** Plain words for each problem, with what to do next. */
export const SPEECH_ERROR_MESSAGES: Record<SpeechError, string> = {
  denied: "Microphone access is blocked. Allow it in your browser settings, or type instead.",
  no_speech: "I did not hear anything. Try again closer to the microphone.",
  no_microphone: "No microphone was found. Check it is plugged in, or type instead.",
  network: "Speech recognition needs a connection. Check your internet and try again.",
  unsupported: "Voice input does not work in this browser. Type your message instead.",
  failed: "Voice input stopped. Try again, or type instead.",
};

/** Maps a Web Speech API error code to a problem we can explain. Null means not a problem. */
export function speechErrorFromCode(code: string): SpeechError | null {
  switch (code) {
    case "aborted":
      return null;
    case "not-allowed":
    case "service-not-allowed":
      return "denied";
    case "no-speech":
      return "no_speech";
    case "audio-capture":
      return "no_microphone";
    case "network":
      return "network";
    case "language-not-supported":
      return "unsupported";
    default:
      return "failed";
  }
}

/** The listening state machine. An error stays visible until the next start. */
export function speechReducer(state: SpeechState, event: SpeechEvent): SpeechState {
  switch (event.type) {
    case "start":
      return { status: "starting" };
    case "started":
      return state.status === "starting" ? { status: "listening" } : state;
    case "stop":
      return { status: "idle" };
    case "ended":
      return state.status === "error" ? state : { status: "idle" };
    case "failed": {
      const error = speechErrorFromCode(event.code);
      return error ? { status: "error", error } : { status: "idle" };
    }
  }
}

/**
 * The textarea text while listening: what was there before, then the final words, then the words
 * still being recognized. Each part is trimmed and joined with one space.
 */
export function mergeTranscript(base: string, finalText: string, interimText: string): string {
  return [base.trimEnd(), finalText.trim(), interimText.trim()]
    .filter((part) => part.length > 0)
    .join(" ");
}

type ResultLike = { isFinal: boolean; 0?: { transcript: string } };

/** Splits a recognition result list into final and interim text. */
export function splitResults(results: ArrayLike<ResultLike>): { final: string; interim: string } {
  let final = "";
  let interim = "";
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const words = result[0]?.transcript ?? "";
    if (result.isFinal) final += words;
    else interim += words;
  }
  return { final, interim };
}
