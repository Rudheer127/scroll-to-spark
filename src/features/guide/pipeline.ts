import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { EMPTY_MESSAGE, RATE_LIMIT_MESSAGE, REDIRECT_MESSAGE } from "./fallbacks";
import { detectCrisis } from "./guard/crisis";
import { detectInjectionSignals, type InjectionSignal } from "./guard/injection-signals";
import { sanitizeInput } from "./guard/sanitize-input";
import { newCanary, newNonce } from "./guard/untrusted";
import {
  crisisResult,
  failureDetail,
  fixedResult,
  providerLimitResult,
  guardedResult,
  unavailableResult,
  type LogEvent,
} from "./guarded-result";
import { handleFactCheck } from "./handlers/fact-check";
import { handleGeneral } from "./handlers/general";
import { handleOpportunities } from "./handlers/opportunities";
import { handleRecognition } from "./handlers/recognition";
import { ProviderFailure } from "./handlers/shared";
import type { HandlerContext, HandlerOutput } from "./handlers/types";
import { logGuideEvent } from "./events";
import type { LlmClient } from "./llm/types";
import { insertUserTurn, persistAssistantTurn } from "./persist";
import { checkRateLimit, serializePerUser } from "./rate-limit";
import { routeIntent } from "./router";
import type { GuideTurnResult, Intent } from "./types";
import { IMAGE_UNREADABLE_MESSAGE } from "./vision/constants";
import { storedUserText } from "./vision/fold-description";
import { textWithImage } from "./vision/image-turn";

export type GuideTurnInput = {
  userId: string;
  message: string;
  db: SupabaseClient<Database>;
  admin: SupabaseClient<Database>;
  llm: LlmClient;
  today: string;
  /** An image already checked by checkImageDataUrl. Read once, never stored. */
  imageDataUrl?: string;
};

const STRONG_SIGNALS: InjectionSignal[] = [
  "ignore_instructions",
  "reveal_prompt",
  "role_override",
  "tool_coercion",
];

/** Every intent has its own handler. */
export function dispatchHandler(intent: Intent, ctx: HandlerContext): Promise<HandlerOutput> {
  switch (intent) {
    case "find_opportunity":
      return handleOpportunities(ctx);
    case "chitchat":
    case "out_of_scope":
      return handleGeneral(ctx, intent);
    case "recognize_contribution":
    case "my_engagement":
      return handleRecognition(ctx, intent);
    case "fact_check":
      return handleFactCheck(ctx);
  }
}

const loggerFor =
  (input: GuideTurnInput): LogEvent =>
  (kind, detail) =>
    logGuideEvent(input.admin, input.userId, kind, detail);

async function answer(input: GuideTurnInput, text: string): Promise<GuideTurnResult> {
  const log = loggerFor(input);
  const onStageFailure = (stage: "router") => log("provider_failure", { stage });
  const nonce = newNonce();
  const route = await routeIntent(input.llm, text, nonce, onStageFailure);
  if (route.safety === "crisis") {
    await log("crisis", { source: "router" });
    return crisisResult();
  }
  const ctx: HandlerContext = {
    text,
    nonce,
    canary: newCanary(),
    llm: input.llm,
    db: input.db,
    today: input.today,
    onStageFailure,
  };
  try {
    return await guardedResult(log, await dispatchHandler(route.intent, ctx));
  } catch (error) {
    if (!(error instanceof ProviderFailure)) return unavailableResult();
    await log("provider_failure", { reason: failureDetail(error.reason) });
    return error.reason === "rate_limited" ? providerLimitResult() : unavailableResult();
  }
}

/**
 * Rate limit, then write the user row before any model call so the turn counts and a failed
 * write fails closed. Returns a result to send back now, or null to continue.
 */
async function admit(input: GuideTurnInput, text: string): Promise<GuideTurnResult | null> {
  const { userId, admin, db } = input;
  return serializePerUser(userId, async () => {
    let rate: Awaited<ReturnType<typeof checkRateLimit>>;
    try {
      rate = await checkRateLimit(db, userId);
    } catch {
      await logGuideEvent(admin, userId, "provider_failure", { stage: "rate_limit" });
      return unavailableResult();
    }
    if (!rate.allowed) {
      await logGuideEvent(admin, userId, "rate_limited", { retryAfterSec: rate.retryAfterSec });
      return {
        ...fixedResult(RATE_LIMIT_MESSAGE),
        outcome: "rate_limited",
        retryAfterSec: rate.retryAfterSec,
      };
    }
    if (await insertUserTurn(db, userId, text)) return null;
    await logGuideEvent(admin, userId, "provider_failure", { reason: "user_row_insert" });
    return unavailableResult();
  });
}

/** Strong injection checks. Returns a fixed result, or null to continue. */
async function screen(input: GuideTurnInput, text: string): Promise<GuideTurnResult | null> {
  const { userId, admin } = input;
  const signals = detectInjectionSignals(text);
  if (signals.length === 0) return null;
  await logGuideEvent(admin, userId, "injection_signal", { signals: signals.join(",") });
  return signals.some((s) => STRONG_SIGNALS.includes(s)) ? fixedResult(REDIRECT_MESSAGE) : null;
}

/**
 * Reads the image (if any) into the message. The folded text gets the same crisis check as typed
 * text. Returns the text to answer, or a fixed result to send back now.
 */
async function messageText(
  input: GuideTurnInput,
  ownText: string,
): Promise<string | GuideTurnResult> {
  if (input.imageDataUrl === undefined) return ownText;
  const image = await textWithImage(input.llm, ownText, input.imageDataUrl);
  if (!image.ok) {
    await logGuideEvent(input.admin, input.userId, "provider_failure", {
      stage: "vision",
      reason: failureDetail(image.reason),
    });
    return image.reason === "rate_limited"
      ? providerLimitResult()
      : fixedResult(IMAGE_UNREADABLE_MESSAGE);
  }
  if (detectCrisis(image.text)) {
    await logGuideEvent(input.admin, input.userId, "crisis", { source: "image" });
    return crisisResult();
  }
  return image.text;
}

/** One guide turn. Never throws: every failure becomes a safe, fixed answer. */
export async function runGuideTurn(input: GuideTurnInput): Promise<GuideTurnResult> {
  const hasImage = input.imageDataUrl !== undefined;
  const clean = sanitizeInput(input.message);
  if (clean.empty && !hasImage) return fixedResult(EMPTY_MESSAGE);
  if (detectCrisis(clean.text)) {
    // Before the rate limit and any database read or write: never limited, never stored.
    await logGuideEvent(input.admin, input.userId, "crisis", { source: "input" });
    return crisisResult();
  }
  try {
    const blocked = await admit(input, storedUserText(clean.text, hasImage));
    if (blocked) return blocked;
  } catch {
    return unavailableResult();
  }
  let result: GuideTurnResult;
  try {
    const text = await messageText(input, clean.text);
    result =
      typeof text === "string"
        ? ((await screen(input, text)) ?? (await answer(input, text)))
        : text;
  } catch {
    result = unavailableResult();
  }
  await persistAssistantTurn(input.admin, input.userId, result.response);
  return result;
}
