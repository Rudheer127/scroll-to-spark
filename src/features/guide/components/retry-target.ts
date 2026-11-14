type Entry = { id: number; role: "user"; text: string } | { id: number; role: "assistant" };

/**
 * For an assistant bubble that can be retried: the user text to resend and the bubble the new
 * answer replaces. Null when there is no earlier user message to resend.
 */
export function retryTarget(
  items: readonly Entry[],
  assistantId: number,
): { text: string; replaceId: number } | null {
  const index = items.findIndex((item) => item.id === assistantId && item.role === "assistant");
  if (index < 0) return null;
  for (let i = index - 1; i >= 0; i--) {
    const item = items[i];
    if (item.role === "user") return { text: item.text, replaceId: assistantId };
  }
  return null;
}
