import type { ActionResult } from "@/lib/result";
import { sendGuideMessage } from "../actions";
import type { GuideTurnResult } from "../types";

const ROUTE = "/api/guide";
const SEND_ERROR = "The guide could not answer. Your message is still here.";

function isTurnResult(value: unknown): value is GuideTurnResult {
  return typeof value === "object" && value !== null && "response" in value;
}

function errorText(value: unknown): string {
  if (typeof value === "object" && value !== null && "error" in value) {
    const { error } = value as { error: unknown };
    if (typeof error === "string") return error;
  }
  return SEND_ERROR;
}

/**
 * Sends one turn. Text goes through the Server Action. A message with an image goes through the
 * route, which raises its body cap only for image requests, so the Server Action limit stays small.
 * Both carry the saved chat id, which the server checks before using.
 */
export async function sendGuideTurn(
  text: string,
  imageDataUrl?: string,
  conversationId?: string,
): Promise<ActionResult<GuideTurnResult>> {
  if (!imageDataUrl) {
    const formData = new FormData();
    formData.set("message", text);
    if (conversationId) formData.set("conversationId", conversationId);
    return sendGuideMessage(formData);
  }
  const res = await fetch(ROUTE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-guide-attachment": "image" },
    body: JSON.stringify({ message: text, imageDataUrl, conversationId }),
  });
  const body: unknown = await res.json().catch(() => null);
  if (isTurnResult(body)) return { ok: true, data: body };
  return { ok: false, error: errorText(body) };
}
