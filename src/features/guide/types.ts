import type { INTENTS } from "./constants";

export type Intent = (typeof INTENTS)[number];

export type OutputContext = {
  allowedIds: Set<string>;
  allowedNumbers: Set<string>;
  canary: string;
};

export type Violation =
  | "bad_id"
  | "ungrounded_number"
  | "url_in_text"
  | "markup"
  | "banned_phrase"
  | "em_dash"
  | "canary_leak"
  | "too_long"
  | "claims_human"
  | "unsupported_verdict";

export type CheckResult = { ok: true } | { ok: false; violations: Violation[] };
