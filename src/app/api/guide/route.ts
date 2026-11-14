import { NextResponse } from "next/server";
import { z } from "zod";
import { readBodyWithLimit } from "@/features/guide/read-body";
import { runAuthenticatedGuideTurn } from "@/features/guide/run-turn";
import { MAX_IMAGE_DECODED_BYTES } from "@/features/guide/vision/constants";

/** Cap on a text-only request body in bytes. The pipeline separately caps the message text. */
const MAX_BODY_BYTES = 4000;
/**
 * Cap for a request that says it carries an image: the shrunk image as base64 plus the text.
 * A body over the text cap must really hold an image, or it is refused.
 */
const MAX_IMAGE_BODY_BYTES = Math.ceil((MAX_IMAGE_DECODED_BYTES * 4) / 3) + MAX_BODY_BYTES + 200;
const IMAGE_HEADER = "x-guide-attachment";
const bodySchema = z.object({ message: z.string(), imageDataUrl: z.string().optional() });
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
    const withImage = request.headers.get(IMAGE_HEADER) === "image";
    const body = await readBodyWithLimit(
      request,
      withImage ? MAX_IMAGE_BODY_BYTES : MAX_BODY_BYTES,
    );
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
    const { message, imageDataUrl } = parsed.data;
    const bytes = new TextEncoder().encode(raw).byteLength;
    if (imageDataUrl === undefined && bytes > MAX_BODY_BYTES) {
      return reply({ error: "That message is too long." }, 413);
    }

    const turn = await runAuthenticatedGuideTurn(message, imageDataUrl);
    const extra: Record<string, string> = {};
    if (turn.status === 429) extra["Retry-After"] = String(turn.retryAfterSec);
    return reply(turn.body, turn.status, extra);
  } catch {
    return reply({ error: "Something went wrong. Please try again." }, 500);
  }
}
