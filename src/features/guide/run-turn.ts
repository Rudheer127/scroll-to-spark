import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createGuideLlm } from "./llm/from-env";
import { runGuideTurn } from "./pipeline";
import type { GuideTurnResult } from "./types";

export const SIGN_IN_MESSAGE = "Please sign in to use the guide.";
const DEFAULT_RETRY_AFTER_SEC = 60;

export type AuthenticatedTurn =
  | { status: 200 | 503; body: GuideTurnResult }
  | { status: 429; body: GuideTurnResult; retryAfterSec: number }
  | { status: 401; body: { error: string } };

/** UTC calendar date, computed on the server. */
export const utcToday = () => new Date().toISOString().slice(0, 10);

/**
 * The one place a guide turn is authorised and run, shared by the route and the Server Action.
 * The user id comes only from the session cookie, never from the caller. Clients are created
 * here, per call, so nothing sensitive exists at import time.
 */
export async function runAuthenticatedGuideTurn(message: string): Promise<AuthenticatedTurn> {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { status: 401, body: { error: SIGN_IN_MESSAGE } };

  const body = await runGuideTurn({
    userId: user.id,
    message,
    db,
    admin: createServiceClient(),
    llm: createGuideLlm(),
    today: utcToday(),
  });
  if (body.outcome === "rate_limited") {
    return { status: 429, body, retryAfterSec: body.retryAfterSec ?? DEFAULT_RETRY_AFTER_SEC };
  }
  return { status: body.outcome === "unavailable" ? 503 : 200, body };
}
