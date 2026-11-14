import { wrapUntrusted } from "../guard/untrusted";
import { fixedResponse } from "../fixed-response";
import { callStructured } from "../llm/structured";
import type { ChatMessage } from "../llm/types";
import { buildSystemPrompt } from "../prompts/system";
import { guideResponseSchema, type GuideResponse } from "../schemas";
import type { Intent, OpportunityRow, Violation } from "../types";
import type { HandlerContext, HandlerOutput } from "./types";

/** The model could not give a usable answer. Carries a reason code only, never provider text. */
export class ProviderFailure extends Error {
  constructor(readonly reason: string) {
    super("provider_failure");
  }
}

/** Plain numbers in a string, as the output guard reads them. */
export function numbersIn(text: string): string[] {
  return text.match(/\d+(?:\.\d+)?/g) ?? [];
}

export const wrapUser = (ctx: HandlerContext) => wrapUntrusted("user_message", ctx.text, ctx.nonce);

async function askModel(
  ctx: HandlerContext,
  intent: Intent,
  userContent: string,
  violations?: Violation[],
): Promise<GuideResponse> {
  const system = buildSystemPrompt({
    intent,
    canary: ctx.canary,
    nonce: ctx.nonce,
    today: ctx.today,
  });
  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: userContent },
  ];
  if (violations) {
    const names = violations.join(", ");
    messages.push({
      role: "user",
      content: `Your last reply broke these rules: ${names}. Reply again with one JSON object that follows every rule.`,
    });
  }
  const result = await callStructured(ctx.llm, guideResponseSchema, {
    messages,
    schemaName: "guide_response",
    reasoningEffort: "low",
    maxTokens: 1200,
    timeoutMs: 15000,
    tier: "main",
  });
  if (!result.ok) throw new ProviderFailure(result.reason);
  return result.data;
}

type Grounding = {
  allowedIds: Iterable<string>;
  extraNumbers: Iterable<string>;
  rows: OpportunityRow[];
};

/** Runs the main model call and packages what the pipeline needs to guard and repair it. */
export async function answerWithModel(
  ctx: HandlerContext,
  intent: Intent,
  userContent: string,
  grounding: Grounding,
): Promise<HandlerOutput> {
  const response = await askModel(ctx, intent, userContent);
  return {
    response,
    rows: grounding.rows,
    source: "ai",
    context: {
      allowedIds: new Set(grounding.allowedIds),
      allowedNumbers: new Set([...grounding.extraNumbers, ...numbersIn(ctx.text)]),
      canary: ctx.canary,
    },
    retry: (violations) => askModel(ctx, intent, userContent, violations),
  };
}

/** A fixed answer that involves no model call. */
export function staticOutput(
  ctx: HandlerContext,
  message: string,
  intent: Intent = "out_of_scope",
): HandlerOutput {
  const response = fixedResponse(message, intent);
  return {
    response,
    rows: [],
    source: "fallback",
    context: { allowedIds: new Set(), allowedNumbers: new Set(), canary: ctx.canary },
    retry: async () => response,
  };
}
