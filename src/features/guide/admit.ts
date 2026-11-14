import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveConversation } from "./conversation-store";
import { logGuideEvent } from "./events";
import { RATE_LIMIT_MESSAGE } from "./fallbacks";
import { fixedResult, unavailableResult } from "./guarded-result";
import { insertUserTurn } from "./persist";
import { checkRateLimit, serializePerUser } from "./rate-limit";
import type { GuideTurnResult } from "./types";

export type AdmitInput = {
  userId: string;
  db: SupabaseClient<Database>;
  admin: SupabaseClient<Database>;
  /** Asked for by the browser. Checked against the database before it is used. */
  conversationId?: string;
};

export type Admission =
  { ok: true; conversationId: string } | { ok: false; result: GuideTurnResult };

/**
 * Rate limit, then find or create the chat, then write the user row, all before any model call,
 * so the turn counts and a failed write fails closed. A rate limited turn creates nothing.
 */
export async function admit(
  input: AdmitInput,
  storedText: string,
  title: string,
): Promise<Admission> {
  const { userId, admin, db } = input;
  return serializePerUser(userId, async (): Promise<Admission> => {
    let rate: Awaited<ReturnType<typeof checkRateLimit>>;
    try {
      rate = await checkRateLimit(db, userId);
    } catch {
      await logGuideEvent(admin, userId, "provider_failure", { stage: "rate_limit" });
      return { ok: false, result: unavailableResult() };
    }
    if (!rate.allowed) {
      await logGuideEvent(admin, userId, "rate_limited", { retryAfterSec: rate.retryAfterSec });
      const result: GuideTurnResult = {
        ...fixedResult(RATE_LIMIT_MESSAGE),
        outcome: "rate_limited",
        retryAfterSec: rate.retryAfterSec,
      };
      return { ok: false, result };
    }
    const conversationId = await resolveConversation(db, userId, input.conversationId, title);
    if (conversationId === null) {
      await logGuideEvent(admin, userId, "provider_failure", { reason: "conversation_insert" });
      return { ok: false, result: unavailableResult() };
    }
    if (await insertUserTurn(db, userId, storedText, conversationId)) {
      return { ok: true, conversationId };
    }
    await logGuideEvent(admin, userId, "provider_failure", { reason: "user_row_insert" });
    return { ok: false, result: unavailableResult() };
  });
}
