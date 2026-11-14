import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { LlmClient } from "../llm/types";
import type { GuideResponse } from "../schemas";
import type { ContributionRow, OpportunityRow, OutputContext, Violation } from "../types";

export type HandlerContext = {
  text: string;
  nonce: string;
  canary: string;
  llm: LlmClient;
  db: SupabaseClient<Database>;
  today: string;
};

export type HandlerOutput = {
  response: GuideResponse;
  context: OutputContext;
  /** Rows fetched this turn. Cards are hydrated only from these. */
  rows: OpportunityRow[];
  /** The person's own rows fetched this turn. Contribution cards are hydrated only from these. */
  contributions?: ContributionRow[];
  /** A handler-specific rule run in addition to checkOutput. */
  extraCheck?: (response: GuideResponse) => Violation | null;
  /** "fallback" means fixed copy that no model wrote, so the output guard is skipped. */
  source: "ai" | "fallback";
  /** One repair attempt: re-asks the model with the violation names. May throw ProviderFailure. */
  retry: (violations: Violation[]) => Promise<GuideResponse>;
};
