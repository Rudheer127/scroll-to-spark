import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { getCurrentUser } from "@/features/auth/queries";
import {
  buildGiphyUrl,
  cleanGifQuery,
  createRateLimiter,
  GIF_RATE_LIMIT,
  shapeGiphyResponse,
} from "@/features/comments/gifs";

const allow = createRateLimiter(GIF_RATE_LIMIT.max, GIF_RATE_LIMIT.windowMs);
const NO_STORE = { "Cache-Control": "no-store" };
const UNAVAILABLE =
  "GIFs are not available right now. You can still write a comment or add an image.";

const reply = (body: { gifs: unknown[]; error?: string }, status = 200) =>
  NextResponse.json(body, { status, headers: NO_STORE });

/** Search Giphy (or trending when q is empty) for a signed-in person. Never returns a 500. */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return reply({ gifs: [], error: "Sign in to search for GIFs." }, 401);
    if (!allow(user.id)) {
      return reply({ gifs: [], error: "Slow down a little, then search again." }, 429);
    }

    let apiKey: string | undefined;
    try {
      apiKey = getServerEnv().GIF_API_KEY;
    } catch {
      apiKey = undefined;
    }
    if (!apiKey) return reply({ gifs: [], error: UNAVAILABLE }, 503);

    const query = cleanGifQuery(new URL(request.url).searchParams.get("q"));
    const response = await fetch(buildGiphyUrl(query, apiKey), {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) return reply({ gifs: [], error: UNAVAILABLE }, 503);

    return reply({ gifs: shapeGiphyResponse(await response.json()) });
  } catch {
    return reply({ gifs: [], error: UNAVAILABLE }, 503);
  }
}
