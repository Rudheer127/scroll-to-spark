type Entry =
  | { id: number; role: "user"; text: string; imageDataUrl?: string }
  | { id: number; role: "assistant" };

export type RetryTarget = { text: string; replaceId: number; imageDataUrl?: string };

/**
 * For an assistant bubble that can be retried: the user text (and image, if any) to resend and
 * the bubble the new answer replaces. Null when there is no earlier user message to resend.
 */
export function retryTarget(items: readonly Entry[], assistantId: number): RetryTarget | null {
  const index = items.findIndex((item) => item.id === assistantId && item.role === "assistant");
  if (index < 0) return null;
  for (let i = index - 1; i >= 0; i--) {
    const item = items[i];
    if (item.role !== "user") continue;
    const target: RetryTarget = { text: item.text, replaceId: assistantId };
    if (item.imageDataUrl) target.imageDataUrl = item.imageDataUrl;
    return target;
  }
  return null;
}
