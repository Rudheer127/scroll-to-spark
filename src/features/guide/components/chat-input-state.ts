import { MAX_INPUT_CHARS } from "../constants";

export const STARTER_PROMPTS = [
  { label: "Find something small to do", message: "Find something small to do" },
  { label: "I did something and want to log it", message: "I did something and want to log it" },
  { label: "Check a claim", message: "Check a claim" },
] as const;

/** Why the Send button is off, in plain words. Null means the message can be sent. */
export function sendBlockReason(input: string, sending: boolean): string | null {
  if (sending) return "Waiting for the guide to answer.";
  if (input.trim().length === 0) return "Write a message to send it.";
  return null;
}

export function characterCount(input: string): string {
  return `${input.length} of ${MAX_INPUT_CHARS} characters`;
}
