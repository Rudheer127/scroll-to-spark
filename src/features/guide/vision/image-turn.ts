import { sanitizeInput } from "../guard/sanitize-input";
import type { LlmClient } from "../llm/types";
import { describeImage } from "./describe-image";
import { foldImageDescription } from "./fold-description";

export type ImageTurnText = { ok: true; text: string } | { ok: false; reason: string };

/**
 * Turns the person's words plus an image into one message: one vision call, then the labeled
 * description is folded in and the whole message goes through the normal sanitize step again.
 */
export async function textWithImage(
  llm: LlmClient,
  ownText: string,
  dataUrl: string,
): Promise<ImageTurnText> {
  const described = await describeImage(llm, dataUrl);
  if (!described.ok) return { ok: false, reason: described.reason };
  const folded = sanitizeInput(foldImageDescription(ownText, described.text));
  if (folded.empty) return { ok: false, reason: "unreadable" };
  return { ok: true, text: folded.text };
}
