"use client";

import { useEffect, useReducer, useRef, useSyncExternalStore } from "react";
import {
  mergeTranscript,
  SPEECH_ERROR_MESSAGES,
  speechReducer,
  splitResults,
  type SpeechState,
} from "./speech-input-state";

type RecognitionResult = { isFinal: boolean; 0?: { transcript: string } };

/** The small part of the Web Speech API this hook uses. Not every TypeScript DOM lib has it. */
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

const noSubscribe = () => () => undefined;

export type SpeechInput = {
  /** False on the server and in browsers without speech recognition. The mic hides then. */
  supported: boolean;
  state: SpeechState;
  errorMessage: string | null;
  start: () => void;
  stop: () => void;
  cancel: () => void;
};

/**
 * Voice to text with the browser's own speech recognition. Words fill the text box as they are
 * heard, and stay editable. Listening stops when the component using it goes away.
 */
export function useSpeechInput(value: string, onChange: (text: string) => void): SpeechInput {
  const supported = useSyncExternalStore(
    noSubscribe,
    () => recognitionConstructor() !== null,
    () => false,
  );
  const [state, dispatch] = useReducer(speechReducer, { status: "idle" });
  const recognition = useRef<Recognition | null>(null);
  const latest = useRef({ value, onChange });

  useEffect(() => {
    latest.current = { value, onChange };
  });

  useEffect(() => () => recognition.current?.abort(), []);

  function start() {
    const Constructor = recognitionConstructor();
    if (!Constructor) {
      dispatch({ type: "failed", code: "language-not-supported" });
      return;
    }
    recognition.current?.abort();
    const base = latest.current.value;
    const instance = new Constructor();
    instance.lang = navigator.language;
    instance.continuous = true;
    instance.interimResults = true;
    instance.onstart = () => dispatch({ type: "started" });
    instance.onresult = (event) => {
      if (recognition.current !== instance) return;
      const { final, interim } = splitResults(event.results);
      latest.current.onChange(mergeTranscript(base, final, interim));
    };
    instance.onerror = (event) => dispatch({ type: "failed", code: event.error });
    instance.onend = () => {
      if (recognition.current === instance) recognition.current = null;
      dispatch({ type: "ended" });
    };
    recognition.current = instance;
    dispatch({ type: "start" });
    try {
      instance.start();
    } catch {
      dispatch({ type: "failed", code: "failed" });
    }
  }

  /** Stops listening and keeps the last words heard. */
  function stop() {
    recognition.current?.stop();
    dispatch({ type: "stop" });
  }

  /** Stops listening and drops anything still being heard, for example when the message is sent. */
  function cancel() {
    const instance = recognition.current;
    recognition.current = null;
    instance?.abort();
    dispatch({ type: "stop" });
  }

  const errorMessage = state.status === "error" ? SPEECH_ERROR_MESSAGES[state.error] : null;
  return { supported, state, errorMessage, start, stop, cancel };
}
