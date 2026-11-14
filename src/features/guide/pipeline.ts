import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  CRISIS_MESSAGE,
  EMPTY_MESSAGE,
  RATE_LIMIT_MESSAGE,
  REDIRECT_MESSAGE,
  UNAVAILABLE_MESSAGE,
} from "./fallbacks";
import { fixedResponse } from "./fixed-response";
import { checkOutput } from "./guard/check-output";
import { detectCrisis } from "./guard/crisis";
import { detectInjectionSignals, type InjectionSignal } from "./guard/injection-signals";
import { sanitizeInput } from "./guard/sanitize-input";
import { newCanary, newNonce } from "./guard/untrusted";
import { handleGeneral } from "./handlers/general";
import { handleOpportunities } from "./handlers/opportunities";
import { ProviderFailure, staticOutput } from "./handlers/shared";
import type { HandlerContext, HandlerOutput } from "./handlers/types";
import { hydrateCards } from "./hydrate-cards";
import { logGuideEvent } from "./events";
import type { LlmClient } from "./llm/types";
import { persistTurns } from "./persist";
import { checkRateLimit } from "./rate-limit";
import { routeIntent } from "./router";
import type { GuideTurnResult, Intent } from "./types";

export type GuideTurnInput = {
  userId: string;
  message: string;
  db: SupabaseClient<Database>;
  admin: SupabaseClient<Database>;
  llm: LlmClient;
  today: string;
};

type Outcome = { result: GuideTurnResult; persist: boolean };

const STRONG_SIGNALS: InjectionSignal[] = [
  "ignore_instructions",
  "reveal_prompt",
  "role_override",
  "tool_coercion",
];

const fixedResult = (message: string): GuideTurnResult => ({
  response: fixedResponse(message),
  cards: [],
  source: "fallback",
});

/** Tasks 8 and 9 replace the redirect branch with real handlers. */
export function dispatchHandler(intent: Intent, ctx: HandlerContext): Promise<HandlerOutput> {
  switch (intent) {
    case "find_opportunity":
      return handleOpportunities(ctx);
    case "chitchat":
    case "out_of_scope":
      return handleGeneral(ctx, intent);
    default:
      return Promise.resolve(staticOutput(ctx, REDIRECT_MESSAGE));
  }
}

/** Guards model output, makes one repair attempt, then falls back. Fixed copy skips the guard. */
async function guardedResult(input: GuideTurnInput, out: HandlerOutput): Promise<GuideTurnResult> {
  if (out.source === "fallback") {
    return {
      response: out.response,
      cards: hydrateCards(out.response, out.rows),
      source: "fallback",
    };
  }
  let response = out.response;
  let check = checkOutput(response, out.context);
  if (!check.ok) {
    response = await out.retry(check.violations);
    check = checkOutput(response, out.context);
  }
  if (!check.ok) {
    await logGuideEvent(input.admin, input.userId, "output_blocked", {
      violations: check.violations.join(","),
    });
    return fixedResult(REDIRECT_MESSAGE);
  }
  return { response, cards: hydrateCards(response, out.rows), source: "ai" };
}

async function answer(input: GuideTurnInput, text: string): Promise<GuideTurnResult> {
  const nonce = newNonce();
  const route = await routeIntent(input.llm, text, nonce);
  if (route.safety === "crisis") {
    await logGuideEvent(input.admin, input.userId, "crisis", { source: "router" });
    return fixedResult(CRISIS_MESSAGE);
  }
  const ctx: HandlerContext = {
    text,
    nonce,
    canary: newCanary(),
    llm: input.llm,
    db: input.db,
    today: input.today,
  };
  try {
    return await guardedResult(input, await dispatchHandler(route.intent, ctx));
  } catch (error) {
    if (error instanceof ProviderFailure) {
      await logGuideEvent(input.admin, input.userId, "provider_failure", { reason: error.reason });
    }
    return fixedResult(UNAVAILABLE_MESSAGE);
  }
}

/** Everything before the model: rate limit, crisis, injection. Returns null to continue. */
async function precheck(input: GuideTurnInput, text: string): Promise<Outcome | null> {
  const { userId, admin, db } = input;
  const rate = await checkRateLimit(db, userId);
  if (!rate.allowed) {
    await logGuideEvent(admin, userId, "rate_limited", { retryAfterSec: rate.retryAfterSec });
    return { result: fixedResult(RATE_LIMIT_MESSAGE), persist: false };
  }
  if (detectCrisis(text)) {
    await logGuideEvent(admin, userId, "crisis", { source: "input" });
    return { result: fixedResult(CRISIS_MESSAGE), persist: true };
  }
  const signals = detectInjectionSignals(text);
  if (signals.length === 0) return null;
  await logGuideEvent(admin, userId, "injection_signal", { signals: signals.join(",") });
  const strong = signals.some((s) => STRONG_SIGNALS.includes(s));
  return strong ? { result: fixedResult(REDIRECT_MESSAGE), persist: true } : null;
}

/** One guide turn. Never throws: every failure becomes a safe, fixed answer. */
export async function runGuideTurn(input: GuideTurnInput): Promise<GuideTurnResult> {
  const clean = sanitizeInput(input.message);
  if (clean.empty) return fixedResult(EMPTY_MESSAGE);
  let outcome: Outcome;
  try {
    outcome = (await precheck(input, clean.text)) ?? {
      result: await answer(input, clean.text),
      persist: true,
    };
  } catch {
    outcome = { result: fixedResult(UNAVAILABLE_MESSAGE), persist: true };
  }
  if (outcome.persist) {
    await persistTurns(input.db, input.admin, input.userId, clean.text, outcome.result.response);
  }
  return outcome.result;
}
