import { AI_LABEL } from "../constants";
import { CRISIS_MESSAGE } from "../fallbacks";
import type { StoredMessage } from "../types";
import type { MessageView } from "./to-message-view";

/** A thread item without its id, as the conversation hook stores it. */
export type StoredItem = { role: "user"; text: string } | { role: "assistant"; view: MessageView };

/**
 * A saved answer, shown as text only. Cards, verdicts and proposals were built from data read at
 * answer time and are not stored, so they are not rebuilt. The fixed crisis answer gets its help
 * card back, because that card holds fixed contact details, not stored data.
 */
export function storedAssistantView(content: string): MessageView {
  const crisis = content === CRISIS_MESSAGE;
  return {
    kind: crisis ? "crisis" : "normal",
    text: content,
    label: crisis ? null : AI_LABEL,
    cards: [],
    proposal: null,
    nextStep: null,
    verdict: null,
    verdictLabel: null,
    waitNote: null,
    canRetry: false,
  };
}

/** Saved rows in the order they were written, as thread items. */
export function storedToItems(messages: StoredMessage[]): StoredItem[] {
  return messages.map((message) =>
    message.role === "user"
      ? { role: "user", text: message.content }
      : { role: "assistant", view: storedAssistantView(message.content) },
  );
}
