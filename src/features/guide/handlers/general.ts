import { claimsVerification } from "../guard/rules/verification";
import type { Intent } from "../types";
import { answerWithModel, wrapUser } from "./shared";
import type { HandlerContext, HandlerOutput } from "./types";

/** Chitchat and out_of_scope: the model answers briefly, with no tools and no records. */
export async function handleGeneral(
  ctx: HandlerContext,
  intent: Extract<Intent, "chitchat" | "out_of_scope">,
): Promise<HandlerOutput> {
  const out = await answerWithModel(ctx, intent, wrapUser(ctx), {
    allowedIds: [],
    extraNumbers: [],
    rows: [],
  });
  return { ...out, extraCheck: claimsVerification };
}
