import type { GuideResponse } from "../schemas";
import type { EvidenceRow, Violation } from "../types";
import { numbersIn } from "./shared";

const UNVERIFIED_PHRASE = /not yet re-checked/i;
const ECHO_LEAD = /\b(you (said|wrote|shared|mentioned)|your claim|the claim)\b/i;
const NEEDED_OVERLAP = 2;

/** Numbers the evidence itself carries: claim, caveat and year, nothing else. */
export function evidenceNumbers(rows: EvidenceRow[]): string[] {
  return rows.flatMap((r) => [
    ...numbersIn(r.claim),
    ...numbersIn(r.caveat ?? ""),
    ...(r.year === null ? [] : [String(r.year)]),
  ]);
}

function citedRows(res: GuideResponse, rows: EvidenceRow[]): EvidenceRow[] {
  const ids = new Set(res.cards.filter((c) => c.kind === "evidence").map((c) => c.id));
  return rows.filter((r) => ids.has(r.id));
}

/** A verdict cannot be "supported" when every retrieved row is weak. Downgrades, never upgrades. */
export function capVerdict(res: GuideResponse, rows: EvidenceRow[]): GuideResponse {
  const allWeak = rows.length > 0 && rows.every((r) => r.strength === "weak");
  return allWeak && res.verdict === "supported" ? { ...res, verdict: "partly_supported" } : res;
}

/** If a cited row has not been re-checked by the team, the message must say so. */
export function mentionsUnverified(rows: EvidenceRow[]) {
  return (res: GuideResponse): Violation | null => {
    const unchecked = citedRows(res, rows).some((r) => r.verified_at === null);
    return unchecked && !UNVERIFIED_PHRASE.test(res.message) ? "missing_unverified_note" : null;
  };
}

/** Words and numbers from the first sentence of a caveat. */
function caveatTokens(caveat: string): string[] {
  const first = caveat.split(/(?<=[.!?])\s/)[0].toLowerCase();
  return [...new Set(first.match(/[a-z]{4,}|\d+/g) ?? [])];
}

/** The message must carry the first cited row's caveat: at least two of its key words or numbers. */
export function mentionsCaveat(rows: EvidenceRow[]) {
  return (res: GuideResponse): Violation | null => {
    const top = citedRows(res, rows).find((r) => r.caveat);
    const tokens = caveatTokens(top?.caveat ?? "");
    if (tokens.length === 0) return null;
    const text = res.message.toLowerCase();
    const hits = tokens.filter((t) => text.includes(t)).length;
    return hits >= Math.min(NEEDED_OVERLAP, tokens.length) ? null : "missing_caveat";
  };
}

/** A number found only in the user's own message may appear only in a sentence that echoes it. */
export function echoOnly(userText: string, rows: EvidenceRow[]) {
  const own = new Set(evidenceNumbers(rows));
  const echoable = new Set(numbersIn(userText).filter((n) => !own.has(n)));
  return (res: GuideResponse): Violation | null => {
    const sentences = [res.message, res.next_step ?? ""].flatMap((t) => t.split(/(?<=[.!?])\s+/));
    const bad = sentences.some(
      (s) => numbersIn(s).some((n) => echoable.has(n)) && !ECHO_LEAD.test(s),
    );
    return bad ? "ungrounded_number" : null;
  };
}
