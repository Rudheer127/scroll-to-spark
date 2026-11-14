import { claimsVerification } from "../guard/rules/verification";
import { wrapUntrusted } from "../guard/untrusted";
import { NO_MATCH_MESSAGE } from "../fallbacks";
import { searchOpportunities } from "../tools/search-opportunities";
import type { OpportunityRow } from "../types";
import { parseOpportunityFilters } from "./parse-opportunity-filters";
import { answerWithModel, staticOutput, wrapUser } from "./shared";
import { timedNumbersIn } from "./user-numbers";
import type { HandlerContext, HandlerOutput } from "./types";

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
  const filters = parseOpportunityFilters(ctx.text);
  let rows = await searchOpportunities(ctx.db, filters);
  // A topic word read by rules can miss. Then search again without it rather than find nothing.
  if (rows.length === 0 && filters.keyword !== null) {
    rows = await searchOpportunities(ctx.db, { ...filters, keyword: null });
  }
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
