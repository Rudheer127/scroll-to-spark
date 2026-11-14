import { NextResponse } from "next/server";
import { z } from "zod";
import { readBodyWithLimit } from "@/features/guide/read-body";
import { runAuthenticatedGuideTurn } from "@/features/guide/run-turn";

/** Cap on the whole request body in bytes. The pipeline separately caps the message text. */
const MAX_BODY_BYTES = 4000;
const bodySchema = z.object({ message: z.string() });
const NO_STORE = { "Cache-Control": "no-store" };

/** application/json, any case, optionally with parameters such as charset. */
const isJson = (type: string | null) => /^application\/json\s*(?:;|$)/i.test(type?.trim() ?? "");

const reply = (body: unknown, status: number, extra: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { ...NO_STORE, ...extra } });

export async function POST(request: Request) {
  try {
    if (!isJson(request.headers.get("content-type"))) {
      return reply({ error: "Send the message as JSON." }, 415);
    }
    const body = await readBodyWithLimit(request, MAX_BODY_BYTES);
    if (!body.ok) return reply({ error: "That message is too long." }, 413);
    const raw = body.text;
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
