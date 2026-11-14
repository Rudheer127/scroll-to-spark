import { NextResponse } from "next/server";
import { z } from "zod";
import { runAuthenticatedGuideTurn } from "@/features/guide/run-turn";

/** Cap on the whole request body in bytes. The pipeline separately caps the message text. */
const MAX_BODY_BYTES = 4000;
const bodySchema = z.object({ message: z.string() });
const NO_STORE = { "Cache-Control": "no-store" };

const reply = (body: unknown, status: number, extra: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { ...NO_STORE, ...extra } });

export async function POST(request: Request) {
  try {
    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > MAX_BODY_BYTES) return reply({ error: "That message is too long." }, 413);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
      return reply({ error: "That message is too long." }, 413);
    }
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return reply({ error: "Send a JSON body with a message." }, 400);
    }
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) return reply({ error: "Send a JSON body with a message." }, 400);

    const turn = await runAuthenticatedGuideTurn(parsed.data.message);
    const extra: Record<string, string> = {};
    if (turn.status === 429) extra["Retry-After"] = String(turn.retryAfterSec);
    return reply(turn.body, turn.status, extra);
  } catch {
    return reply({ error: "Something went wrong. Please try again." }, 500);
  }
}
