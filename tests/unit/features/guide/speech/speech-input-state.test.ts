import { describe, expect, it } from "vitest";
import {
  mergeTranscript,
  SPEECH_ERROR_MESSAGES,
  speechErrorFromCode,
  speechReducer,
  splitResults,
  type SpeechState,
} from "@/features/guide/speech/speech-input-state";

const idle: SpeechState = { status: "idle" };

describe("speechReducer", () => {
  it("goes idle, starting, listening, idle", () => {
    const starting = speechReducer(idle, { type: "start" });
    expect(starting).toEqual({ status: "starting" });
    const listening = speechReducer(starting, { type: "started" });
    expect(listening).toEqual({ status: "listening" });
    expect(speechReducer(listening, { type: "stop" })).toEqual(idle);
    expect(speechReducer(listening, { type: "ended" })).toEqual(idle);
  });

  it("keeps an error visible after the session ends, until the next start", () => {
    const denied = speechReducer({ status: "starting" }, { type: "failed", code: "not-allowed" });
    expect(denied).toEqual({ status: "error", error: "denied" });
    expect(speechReducer(denied, { type: "ended" })).toEqual(denied);
    expect(speechReducer(denied, { type: "start" })).toEqual({ status: "starting" });
  });

  it("ignores a late started event and treats aborted as a quiet stop", () => {
    expect(speechReducer(idle, { type: "started" })).toEqual(idle);
    expect(speechReducer({ status: "listening" }, { type: "failed", code: "aborted" })).toEqual(
      idle,
    );
  });
});

describe("speechErrorFromCode", () => {
  it("maps browser codes to plain problems", () => {
    expect(speechErrorFromCode("not-allowed")).toBe("denied");
    expect(speechErrorFromCode("service-not-allowed")).toBe("denied");
    expect(speechErrorFromCode("no-speech")).toBe("no_speech");
    expect(speechErrorFromCode("audio-capture")).toBe("no_microphone");
    expect(speechErrorFromCode("network")).toBe("network");
    expect(speechErrorFromCode("language-not-supported")).toBe("unsupported");
    expect(speechErrorFromCode("something-new")).toBe("failed");
  });

  it("has a plain message for every problem, with no em dashes", () => {
    for (const message of Object.values(SPEECH_ERROR_MESSAGES)) {
      expect(message.length).toBeGreaterThan(10);
      expect(message).not.toContain(String.fromCharCode(8212));
    }
    expect(SPEECH_ERROR_MESSAGES.denied).toMatch(/blocked/);
    expect(SPEECH_ERROR_MESSAGES.no_speech).toMatch(/did not hear/);
    expect(SPEECH_ERROR_MESSAGES.unsupported).toMatch(/does not work in this browser/);
  });
});

describe("mergeTranscript and splitResults", () => {
  it("joins what was typed, the final words and the interim words", () => {
    expect(mergeTranscript("Hello", "I want to help", " at the park")).toBe(
      "Hello I want to help at the park",
    );
    expect(mergeTranscript("", "", "")).toBe("");
    expect(mergeTranscript("Typed ", "", "maybe")).toBe("Typed maybe");
  });

  it("splits final and interim results in order", () => {
    const results = [
      { isFinal: true, 0: { transcript: "find me " } },
      { isFinal: true, 0: { transcript: "a small task" } },
      { isFinal: false, 0: { transcript: " near" } },
      { isFinal: false },
    ];
    expect(splitResults(results)).toEqual({ final: "find me a small task", interim: " near" });
  });
});
