import type { Effort, Place } from "@/features/steps/constants";
import type { Tables } from "@/types/database";
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
