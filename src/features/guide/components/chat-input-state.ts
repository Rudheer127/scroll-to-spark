import { MAX_INPUT_CHARS } from "../constants";

export const STARTER_PROMPTS = [
  { label: "Find something small to do", message: "Find something small to do" },
  { label: "I did something and want to log it", message: "I did something and want to log it" },
  { label: "Check a claim", message: "Check a claim" },
] as const;

/** The character counter shows from this many characters, so it is there before the limit. */
export const COUNTER_THRESHOLD = 800;

type DraftState = { hasImage?: boolean; imageBusy?: boolean };

/** Why the Send button is off, in plain words. Null means the message can be sent. */
export function sendBlockReason(
  input: string,
  sending: boolean,
  draft: DraftState = {},
): string | null {
  if (sending) return "Waiting for the guide to answer.";
  if (draft.imageBusy) return "Getting your image ready.";
  if (input.trim().length === 0 && !draft.hasImage) return "Write a message to send it.";
  return null;
}

export function characterCount(input: string): string {
  return `${input.length} of ${MAX_INPUT_CHARS} characters`;
}

/** The counter appears only near the limit, to keep the composer quiet. */
export function shouldShowCount(input: string): boolean {
  return input.length >= COUNTER_THRESHOLD;
}
