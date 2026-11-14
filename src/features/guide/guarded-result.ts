import { AI_LABEL } from "./constants";
import type { GuideEventKind } from "./events";
import { CRISIS_MESSAGE, REDIRECT_MESSAGE, UNAVAILABLE_MESSAGE } from "./fallbacks";
import { fixedResponse } from "./fixed-response";
import { checkOutput } from "./guard/check-output";
import type { HandlerOutput } from "./handlers/types";
import { hydrateCards } from "./hydrate-cards";
import type { GuideResponse } from "./schemas";
import type { CheckResult, GuideTurnResult } from "./types";

/** Logs one guide event for the current person. Never throws. */
export type LogEvent = (
  kind: GuideEventKind,
  detail: Record<string, string | number>,
) => Promise<void>;

export const fixedResult = (message: string): GuideTurnResult => ({
  response: fixedResponse(message),
  cards: [],
  source: "fallback",
});

export const crisisResult = (): GuideTurnResult => ({
  ...fixedResult(CRISIS_MESSAGE),
  outcome: "crisis",
});

export const unavailableResult = (): GuideTurnResult => ({
  ...fixedResult(UNAVAILABLE_MESSAGE),
  outcome: "unavailable",
});

/** The model followed the prompt's crisis rule and wrote the fixed crisis message. */
const isCrisisReply = (res: GuideResponse) => res.message.trim() === CRISIS_MESSAGE;

function checkAll(out: HandlerOutput, response: GuideResponse): CheckResult {
  const base = checkOutput(response, out.context);
  const extra = out.extraCheck?.(response) ?? null;
  if (!extra) return base;
  return { ok: false, violations: [...(base.ok ? [] : base.violations), extra] };
}

/** Guards model output, makes one repair attempt, then falls back. Fixed copy skips the guard. */
export async function guardedResult(log: LogEvent, out: HandlerOutput): Promise<GuideTurnResult> {
  if (out.source === "fallback") {
    return {
      response: out.response,
      cards: hydrateCards(out.response, out.rows, out.contributions, out.evidence),
      source: "fallback",
    };
  }
  if (isCrisisReply(out.response)) {
    await log("crisis", { source: "model" });
    return crisisResult();
  }
  let response = out.response;
  let check = checkAll(out, response);
  if (!check.ok) {
    response = await out.retry(check.violations);
    check = checkAll(out, response);
  }
  if (!check.ok) {
    await log("output_blocked", { violations: check.violations.join(",") });
    return fixedResult(REDIRECT_MESSAGE);
  }
  return {
    response,
    cards: hydrateCards(response, out.rows, out.contributions, out.evidence),
    source: "ai",
    label: AI_LABEL,
  };
}
