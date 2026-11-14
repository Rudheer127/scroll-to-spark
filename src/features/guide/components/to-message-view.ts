import type { AI_LABEL } from "../constants";
import type { GuideResponse } from "../schemas";
import type { GuideTurnResult, HydratedCard } from "../types";

export type Verdict = NonNullable<GuideResponse["verdict"]>;

/** Fixed words for each verdict, chosen in code, never by the model. */
export const VERDICT_LABELS: Record<Verdict, string> = {
  supported: "Supported by our evidence",
  partly_supported: "Partly supported",
  unsupported: "Not supported",
  not_enough_evidence: "Not enough evidence on file",
};

export type MessageKind = "normal" | "fallback" | "crisis" | "rate_limited" | "unavailable";

/** What one assistant bubble renders. Built only from the server result, never from parsed text. */
export type MessageView = {
  kind: MessageKind;
  /** Plain text. Never markdown, never HTML, never auto-linked. */
  text: string;
  label: typeof AI_LABEL | null;
  cards: HydratedCard[];
  proposal: GuideResponse["proposed_contribution"];
  /** The model's one next step, shown under the message as plain text. */
  nextStep: string | null;
  verdict: Verdict | null;
  verdictLabel: string | null;
  waitNote: string | null;
  canRetry: boolean;
};

export function waitNote(seconds: number | undefined): string {
  if (seconds === undefined) return "You can try again in a minute.";
  if (seconds < 60) return `You can try again in about ${plural(seconds, "second")}.`;
  return `You can try again in about ${plural(Math.ceil(seconds / 60), "minute")}.`;
}

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

function kindOf(result: GuideTurnResult): MessageKind {
  if (result.outcome === "crisis") return "crisis";
  if (result.outcome === "rate_limited") return "rate_limited";
  if (result.outcome === "unavailable") return "unavailable";
  return result.source === "fallback" ? "fallback" : "normal";
}

const FIXED_KINDS: MessageKind[] = ["crisis", "rate_limited", "unavailable"];

export function toMessageView(result: GuideTurnResult): MessageView {
  const kind = kindOf(result);
  const fixed = FIXED_KINDS.includes(kind);
  const verdict = fixed ? null : result.response.verdict;
  return {
    kind,
    text: result.response.message,
    label: result.label ?? null,
    cards: fixed ? [] : result.cards,
    proposal: fixed ? null : result.response.proposed_contribution,
    nextStep: fixed ? null : result.response.next_step,
    verdict,
    verdictLabel: verdict ? VERDICT_LABELS[verdict] : null,
    waitNote: kind === "rate_limited" ? waitNote(result.retryAfterSec) : null,
    canRetry: kind === "unavailable",
  };
}
