import { MAX_INPUT_CHARS } from "../constants";

// Zero-width, bidi marks and overrides, word joiner and invisible operators, BOM.
const INVISIBLE = /[​-‏‪-‮⁠-⁤﻿]/g;
// Unicode tag characters, often used to smuggle hidden text.
const TAGS = /[\u{E0000}-\u{E007F}]/gu;
// ASCII control characters except tab and newline, which become spaces below.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export type SanitizedInput = { text: string; truncated: boolean; empty: boolean };

/** Normalizes untrusted text before any detection or model call. */
export function sanitizeInput(raw: string): SanitizedInput {
  const cleaned = raw
    .normalize("NFKC")
    .replace(INVISIBLE, "")
    .replace(TAGS, "")
    .replace(CONTROL, "")
    .replace(/\s+/g, " ")
    .trim();
  const truncated = cleaned.length > MAX_INPUT_CHARS;
  const text = truncated ? cleaned.slice(0, MAX_INPUT_CHARS).trimEnd() : cleaned;
  return { text, truncated, empty: text.length === 0 };
}
