import { MAX_INPUT_CHARS } from "../constants";

/** The task suggestions under the composer. Picking one sends its label as the first message. */
export const STARTER_PROMPTS = [
  { id: "find", label: "Find something small to do", message: "Find something small to do" },
  { id: "log", label: "Log something I did", message: "Log something I did" },
  { id: "progress", label: "What have I done so far?", message: "What have I done so far?" },
  { id: "claim", label: "Check a claim", message: "Check a claim" },
] as const;

export type StarterId = (typeof STARTER_PROMPTS)[number]["id"];

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
