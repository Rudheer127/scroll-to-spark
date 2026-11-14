export type ChatLayoutMode = "empty" | "conversation";

type ChatLayoutState = { itemCount: number; sending: boolean; hasError: boolean };

/**
 * "empty" shows the centered welcome: headline, composer and suggestions. As soon as anything
 * happens (a message, a pending answer or an error) the chat switches to the thread with the
 * composer at the bottom, so a failed first message is never hidden behind the welcome.
 */
export function chatLayoutMode({ itemCount, sending, hasError }: ChatLayoutState): ChatLayoutMode {
  return itemCount === 0 && !sending && !hasError ? "empty" : "conversation";
}
