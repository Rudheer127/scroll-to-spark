import { KNOWN_PRIMARY_SOURCES } from "../constants";
import { fixedResponse } from "../fixed-response";
import { wrapUntrusted } from "../guard/untrusted";
import type { GuideResponse } from "../schemas";
import { lookupEvidence } from "../tools/lookup-evidence";
import type { EvidenceRow, Violation } from "../types";
import {
  capVerdict,
  citesEvidenceNumbers,
  echoOnly,
  evidenceNumbers,
  mentionsCaveat,
  mentionsUnverified,
  verifiedOnlyIfChecked,
} from "./fact-check-rules";
import { answerWithModel, wrapUser } from "./shared";
import type { HandlerContext, HandlerOutput } from "./types";

const NO_EVIDENCE_MESSAGE = `We have no evidence on file for that claim, and we will not guess. To check it yourself, a good place to start is a primary source such as ${KNOWN_PRIMARY_SOURCES.map((s) => s.name).join(", ")}.`;

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
  const rows = await lookupEvidence(ctx.db, ctx.text);
  if (rows.length === 0) return noEvidenceOutput(ctx);
  const content = [wrapUser(ctx), ...rows.map((r) => evidenceBlock(r, ctx.nonce))].join("\n\n");
  const out = await answerWithModel(ctx, "fact_check", content, {
    allowedIds: rows.map((r) => r.id),
    extraNumbers: evidenceNumbers(rows),
    rows: [],
  });
  const rules = [
    citesEvidenceNumbers(rows),
    mentionsUnverified(rows),
    mentionsCaveat(rows),
    echoOnly(ctx.text, rows),
    verifiedOnlyIfChecked(rows),
  ];
  return {
    ...out,
    evidence: rows,
    response: capVerdict(out.response, rows),
    retry: async (violations) => capVerdict(await out.retry(violations), rows),
    extraCheck: (res): Violation | null => {
      for (const rule of rules) {
        const found = rule(res);
        if (found) return found;
      }
      return null;
    },
  };
}
