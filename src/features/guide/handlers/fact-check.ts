import { KNOWN_PRIMARY_SOURCES } from "../constants";
import { fixedResponse } from "../fixed-response";
import { checkOutput } from "../guard/check-output";
import { wrapUntrusted } from "../guard/untrusted";
import type { GuideResponse } from "../schemas";
import { evidenceKeywords } from "../tools/evidence-keywords";
import { lookupEvidence } from "../tools/lookup-evidence";
import type { EvidenceRow, Violation } from "../types";
import {
  affirmsOnlyWithSupport,
  capVerdict,
  citesEvidenceNumbers,
  echoOnly,
  evidenceNumbers,
  mentionsCaveat,
  mentionsUnverified,
  requiresVerdict,
  verifiedOnlyIfChecked,
} from "./fact-check-rules";
import { answerWithModel, numbersIn, ProviderFailure, staticOutput, wrapUser } from "./shared";
import type { HandlerContext, HandlerOutput } from "./types";

const NO_EVIDENCE_MESSAGE = `We have no evidence on file for that claim, and we will not guess. To check it yourself, a good place to start is a primary source such as ${KNOWN_PRIMARY_SOURCES.map((s) => s.name).join(", ")}.`;

/** Shown when there is nothing to look up, such as the bare "Check a claim" starter. */
export const PASTE_CLAIM_MESSAGE =
  "Paste the claim you want checked and I will look for it in our evidence list.";

function noEvidenceOutput(ctx: HandlerContext): HandlerOutput {
  const response: GuideResponse = {
    ...fixedResponse(NO_EVIDENCE_MESSAGE, "fact_check"),
    verdict: "not_enough_evidence",
  };
  return {
    response,
    rows: [],
    evidence: [],
    source: "fallback",
    context: { allowedIds: new Set(), allowedNumbers: new Set(), canary: ctx.canary },
    retry: async () => response,
  };
}

function checkedWhen(verified_at: string | null): string {
  return verified_at
    ? `verified by our team on ${verified_at.slice(0, 10)}`
    : "reported, not yet re-checked by our team";
}

const trimStop = (text: string) => text.replace(/[.\s]+$/, "");

/**
 * The answer built from the closest evidence row with no model call. It is used when the model
 * fails or its repair attempt breaks a rule, so a claim we can check never ends in an error.
 * The verdict is partly_supported only when every number the person typed appears in the row.
 */
export function evidenceOnFileResponse(rows: EvidenceRow[], userText: string): GuideResponse {
  const top = rows[0];
  const own = new Set(evidenceNumbers([top]));
  const typed = numbersIn(userText);
  const matches = typed.length > 0 && typed.every((n) => own.has(n));
  const year = top.year === null ? "" : ` in ${top.year}`;
  const parts = [
    `Closest thing on file: ${trimStop(top.claim)} (${top.source_name}${year}, ${top.strength} strength, ${checkedWhen(top.verified_at)}).`,
    top.caveat ? `Keep in mind: ${trimStop(top.caveat)}.` : "",
    matches
      ? "The figure you gave lines up with this entry, but the wording and group may differ from your claim."
      : "That entry does not settle your exact claim, so I will not call it settled.",
  ];
  return {
    intent: "fact_check",
    message: parts.filter(Boolean).join(" "),
    cards: [{ kind: "evidence", id: top.id }],
    proposed_contribution: null,
    verdict: matches ? "partly_supported" : "not_enough_evidence",
    next_step: "Open the card to read the source and the caveat.",
  };
}

function evidenceBlock(row: EvidenceRow, nonce: string): string {
  const lines = [
    `id: ${row.id}`,
    `claim: ${row.claim}`,
    `source_name: ${row.source_name}`,
    `year: ${row.year ?? "unknown"}`,
    `population: ${row.population ?? "unknown"}`,
    `strength: ${row.strength}`,
    `checked: ${checkedWhen(row.verified_at)}`,
    `caveat: ${row.caveat ?? "none"}`,
  ];
  return wrapUntrusted("evidence", lines.join("\n"), nonce);
}

/**
 * Checks a claim against the curated evidence table only. With no matching row there is no
 * model call: the verdict is fixed at not_enough_evidence. With rows, the model judges only
 * against the DATA blocks and the handler caps and checks what it says.
 */
export async function handleFactCheck(ctx: HandlerContext): Promise<HandlerOutput> {
  if (evidenceKeywords(ctx.text).length === 0) {
    return staticOutput(ctx, PASTE_CLAIM_MESSAGE, "fact_check");
  }
  const rows = await lookupEvidence(ctx.db, ctx.text);
  if (rows.length === 0) return noEvidenceOutput(ctx);
  const content = [wrapUser(ctx), ...rows.map((r) => evidenceBlock(r, ctx.nonce))].join("\n\n");
  const grounding = {
    allowedIds: rows.map((r) => r.id),
    // The person's numbers are allowed only as quoted echoes: see echoOnly below.
    extraNumbers: [...evidenceNumbers(rows), ...numbersIn(ctx.text)],
    rows: [],
  };
  let out: HandlerOutput;
  try {
    out = await answerWithModel(ctx, "fact_check", content, grounding);
  } catch (error) {
    if (!(error instanceof ProviderFailure)) throw error;
    out = {
      response: evidenceOnFileResponse(rows, ctx.text),
      rows: [],
      source: "fallback",
      context: {
        allowedIds: new Set(grounding.allowedIds),
        allowedNumbers: new Set(grounding.extraNumbers),
        canary: ctx.canary,
      },
      retry: async () => evidenceOnFileResponse(rows, ctx.text),
    };
  }
  const rules = [
    citesEvidenceNumbers(rows),
    mentionsUnverified(rows),
    mentionsCaveat(rows),
    echoOnly(ctx.text, rows),
    verifiedOnlyIfChecked(rows),
    requiresVerdict,
    affirmsOnlyWithSupport,
  ];
  const firstViolation = (res: GuideResponse): Violation | null => {
    for (const rule of rules) {
      const found = rule(res);
      if (found) return found;
    }
    return null;
  };
  return {
    ...out,
    evidence: rows,
    response: capVerdict(out.response, rows),
    // A failed or still-rule-breaking repair falls back to the evidence-only answer.
    retry: async (violations) => {
      try {
        const repaired = capVerdict(await out.retry(violations), rows);
        if (checkOutput(repaired, out.context).ok && !firstViolation(repaired)) return repaired;
      } catch (error) {
        if (!(error instanceof ProviderFailure)) throw error;
      }
      return evidenceOnFileResponse(rows, ctx.text);
    },
    extraCheck: firstViolation,
  };
}
