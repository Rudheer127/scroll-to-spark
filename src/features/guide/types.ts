import type { Effort, Place } from "@/features/steps/constants";
import type { Tables } from "@/types/database";
import type { AI_LABEL, INTENTS } from "./constants";
import type { GuideResponse } from "./schemas";

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
  | "prompt_leak"
  | "too_long"
  | "too_many_cards"
  | "claims_human"
  | "unsupported_verdict"
  | "claims_verification"
  | "missing_unverified_note"
  | "missing_caveat"
  | "missing_evidence_card";

export type CheckResult = { ok: true } | { ok: false; violations: Violation[] };

export type OpportunityRow = {
  id: string;
  title: string;
  description: string | null;
  org_name: string;
  effort: Effort;
  minutes: number;
  place: Place;
  reply_within_hours: number;
};

export type OpportunityFilters = {
  effort: Effort | null;
  remoteOnly: boolean;
  keyword: string | null;
};

export type ContributionRow = Tables<"contributions">;

export type EvidenceRow = Pick<
  Tables<"evidence_claims">,
  | "id"
  | "claim"
  | "source_name"
  | "source_url"
  | "year"
  | "population"
  | "strength"
  | "verified_at"
  | "caveat"
>;

export type ContributionSummary = {
  count: number;
  totalMinutes: number;
  totalHours: number;
  firstDate: string | null;
  titles: string[];
};

/** An opportunity card built from a database row fetched this turn, never from model text. */
export type HydratedCard =
  | ({ kind: "opportunity" } & OpportunityRow)
  | ({ kind: "contribution" } & Pick<
      ContributionRow,
      "id" | "title" | "minutes" | "occurred_on" | "verification"
    >)
  | ({ kind: "evidence"; verified: boolean } & Pick<
      EvidenceRow,
      "id" | "source_name" | "source_url" | "year" | "population" | "strength" | "caveat"
    >);

export type GuideTurnResult = {
  response: GuideResponse;
  cards: HydratedCard[];
  source: "ai" | "fallback";
  /** Set on AI answers so the UI can show where the words came from. */
  label?: typeof AI_LABEL;
  /**
   * Set on the fixed rate-limit, unavailable and crisis paths. The route maps rate_limited to 429
   * and unavailable to 503. Crisis is a normal 200 answer that the UI shows as a help card.
   */
  outcome?: "ok" | "rate_limited" | "unavailable" | "crisis";
  /** Seconds to wait, set with outcome "rate_limited". */
  retryAfterSec?: number;
};
