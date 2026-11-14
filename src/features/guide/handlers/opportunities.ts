import { claimsVerification } from "../guard/rules/verification";
import { wrapUntrusted } from "../guard/untrusted";
import { callStructured } from "../llm/structured";
import { NO_MATCH_MESSAGE } from "../fallbacks";
import { buildFilterPrompt } from "../prompts/filters";
import { opportunityFiltersSchema } from "../schemas";
import { searchOpportunities } from "../tools/search-opportunities";
import type { OpportunityFilters, OpportunityRow } from "../types";
import { answerWithModel, staticOutput, wrapUser } from "./shared";
import { timedNumbersIn } from "./user-numbers";
import type { HandlerContext, HandlerOutput } from "./types";

const NO_FILTERS: OpportunityFilters = { effort: null, remoteOnly: false, keyword: null };

/** A small first call. If it fails we simply search without filters. */
async function extractFilters(ctx: HandlerContext): Promise<OpportunityFilters> {
  const result = await callStructured(ctx.llm, opportunityFiltersSchema, {
    messages: [
      { role: "system", content: buildFilterPrompt({ nonce: ctx.nonce }) },
      { role: "user", content: wrapUser(ctx) },
    ],
    schemaName: "opportunity_filters",
    reasoningEffort: "low",
    // Reasoning tokens count toward this budget, so it must be roomy.
    maxTokens: 1000,
    timeoutMs: 8000,
    tier: "router",
  });
  if (result.ok) return result.data;
  await ctx.onStageFailure?.("filters");
  return NO_FILTERS;
}

function rowBlock(row: OpportunityRow, nonce: string): string {
  const lines = [
    `id: ${row.id}`,
    `title: ${row.title}`,
    `group: ${row.org_name}`,
    `minutes: ${row.minutes}`,
    `effort: ${row.effort}`,
    `place: ${row.place}`,
    `reply_within_hours: ${row.reply_within_hours}`,
    `description: ${row.description ?? ""}`,
    ...(row.is_demo ? ["sample: true. Say that this is a sample task"] : []),
  ];
  return wrapUntrusted("opportunity", lines.join("\n"), nonce);
}

/** Finds open tasks for the person. The model only picks ids from the rows fetched here. */
export async function handleOpportunities(ctx: HandlerContext): Promise<HandlerOutput> {
  const filters = await extractFilters(ctx);
  const rows = await searchOpportunities(ctx.db, filters);
  if (rows.length === 0) return staticOutput(ctx, NO_MATCH_MESSAGE, "find_opportunity");
  const content = [wrapUser(ctx), ...rows.map((row) => rowBlock(row, ctx.nonce))].join("\n\n");
  const out = await answerWithModel(ctx, "find_opportunity", content, {
    allowedIds: rows.map((r) => r.id),
    extraNumbers: [
      ...rows.flatMap((r) => [String(r.minutes), String(r.reply_within_hours)]),
      ...timedNumbersIn(ctx.text),
    ],
    rows,
  });
  return { ...out, extraCheck: claimsVerification };
}
