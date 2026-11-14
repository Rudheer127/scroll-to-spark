import { EMPTY_ENGAGEMENT_MESSAGE } from "../fallbacks";
import { asksForCertification, claimsVerification } from "../guard/rules/verification";
import { wrapUntrusted } from "../guard/untrusted";
import { contributionInputSchemaFor, type GuideResponse } from "../schemas";
import { getMyContributions, summarizeContributions } from "../tools/get-contributions";
import type { ContributionRow, ContributionSummary, Intent } from "../types";
import { answerWithModel, numbersIn, staticOutput, wrapUser } from "./shared";
import type { HandlerContext, HandlerOutput } from "./types";

const MAX_SHOWN = 10;
const POLICY_NOTE = "policy: self reported only, cannot certify";

function rowBlock(row: ContributionRow, nonce: string): string {
  const lines = [
    `id: ${row.id}`,
    `title: ${row.title}`,
    `minutes: ${row.minutes}`,
    `occurred_on: ${row.occurred_on}`,
    `verification: ${row.verification}`,
    `description: ${row.description ?? ""}`,
  ];
  return wrapUntrusted("contribution", lines.join("\n"), nonce);
}

function summaryBlock(s: ContributionSummary, nonce: string): string {
  const lines = [
    "contribution_summary (self reported, computed by the app)",
    `count: ${s.count}`,
    `total_minutes: ${s.totalMinutes}`,
    `total_hours: ${s.totalHours}`,
    `first_date: ${s.firstDate ?? "none"}`,
    `recent_titles: ${s.titles.join("; ")}`,
  ];
  return wrapUntrusted("contribution", lines.join("\n"), nonce);
}

/** Keeps a proposal only if the person described something and it passes the save schema. */
function checkedProposal(response: GuideResponse, intent: Intent, today: string) {
  if (intent !== "recognize_contribution" || !response.proposed_contribution) return null;
  const parsed = contributionInputSchemaFor(today).safeParse(response.proposed_contribution);
  return parsed.success ? parsed.data : null;
}

/**
 * Thanks for what someone did, or a reflection of what they logged. It reads rows and never
 * writes: a proposal is only shown, and the person confirms it before anything is saved.
 */
export async function handleRecognition(
  ctx: HandlerContext,
  intent: Extract<Intent, "recognize_contribution" | "my_engagement"> = "recognize_contribution",
): Promise<HandlerOutput> {
  const all = await getMyContributions(ctx.db);
  if (intent === "my_engagement" && all.length === 0) {
    return staticOutput(ctx, EMPTY_ENGAGEMENT_MESSAGE, "my_engagement");
  }
  const summary = summarizeContributions(all);
  const shown = all.slice(0, MAX_SHOWN);
  const blocks = [wrapUser(ctx), summaryBlock(summary, ctx.nonce)];
  if (asksForCertification(ctx.text)) blocks.push(wrapUntrusted("policy", POLICY_NOTE, ctx.nonce));
  blocks.push(...shown.map((row) => rowBlock(row, ctx.nonce)));
  const out = await answerWithModel(ctx, intent, blocks.join("\n\n"), {
    allowedIds: shown.map((r) => r.id),
    extraNumbers: [
      String(summary.count),
      String(summary.totalMinutes),
      String(summary.totalHours),
      ...shown.map((r) => String(r.minutes)),
    ],
    rows: [],
    contributions: shown,
  });
  const finalize = (response: GuideResponse): GuideResponse => {
    const proposal = checkedProposal(response, intent, ctx.today);
    if (proposal) {
      const hours = Math.round((proposal.minutes / 60) * 10) / 10;
      for (const n of [
        String(proposal.minutes),
        String(hours),
        ...numbersIn(proposal.occurred_on),
      ]) {
        out.context.allowedNumbers.add(n);
      }
    }
    return { ...response, proposed_contribution: proposal };
  };
  return {
    ...out,
    response: finalize(out.response),
    retry: async (violations) => finalize(await out.retry(violations)),
    extraCheck: claimsVerification,
  };
}
