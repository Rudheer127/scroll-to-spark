import type { GuideResponse } from "../../schemas";
import type { OutputContext, Violation } from "../../types";

export function badId(res: GuideResponse, ctx: OutputContext): Violation | null {
  return res.cards.some((c) => !ctx.allowedIds.has(c.id)) ? "bad_id" : null;
}

export function unsupportedVerdict(res: GuideResponse): Violation | null {
  const needsEvidence = res.verdict === "supported" || res.verdict === "partly_supported";
  const hasEvidence = res.cards.some((c) => c.kind === "evidence");
  return needsEvidence && !hasEvidence ? "unsupported_verdict" : null;
}
