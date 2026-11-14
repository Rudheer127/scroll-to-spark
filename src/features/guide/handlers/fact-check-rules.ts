import { claimsVerification } from "../guard/rules/verification";
import type { GuideResponse } from "../schemas";
import type { EvidenceRow, Violation } from "../types";
import { numbersIn } from "./shared";

const UNVERIFIED_PHRASE = /not yet re-checked/i;
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

/** Without a strong or moderate cited row, "supported" is downgraded. Never upgrades. */
export function capVerdict(res: GuideResponse, rows: EvidenceRow[]): GuideResponse {
  const cited = citedRows(res, rows);
  const solid = cited.some((r) => r.strength !== "weak");
  return res.verdict === "supported" && cited.length > 0 && !solid
    ? { ...res, verdict: "partly_supported" }
    : res;
}

const textsOf = (res: GuideResponse): string[] => [res.message, res.next_step ?? ""];

/** Any number in the answer that comes from a retrieved row needs a card for that row. */
export function citesEvidenceNumbers(rows: EvidenceRow[]) {
  return (res: GuideResponse): Violation | null => {
    const cited = citedRows(res, rows);
    const used = textsOf(res).flatMap(numbersIn);
    const uncited = used.some((n) => {
      const sources = rows.filter((r) => evidenceNumbers([r]).includes(n));
      return sources.length > 0 && !sources.some((r) => cited.includes(r));
    });
    return uncited ? "missing_evidence_card" : null;
  };
}

/** If a cited row, or the top row when its numbers are used, is unchecked, the message says so. */
export function mentionsUnverified(rows: EvidenceRow[]) {
  return (res: GuideResponse): Violation | null => {
    const usesEvidence = textsOf(res)
      .flatMap(numbersIn)
      .some((n) => evidenceNumbers(rows).includes(n));
    const top = rows[0];
    const topUnchecked = usesEvidence && top !== undefined && top.verified_at === null;
    const unchecked = topUnchecked || citedRows(res, rows).some((r) => r.verified_at === null);
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

const QUOTED = /["\u201C\u201D][^"\u201C\u201D]*["\u201C\u201D]/g;
const AFFIRM = /\b(indeed|true|correct|accurate|holds|confirmed|right|proven|yes|factual|valid)\b/i;

/**
 * A number found only in the user's message may appear only inside quotation marks, as their own
 * words, and the sentence around the quote must not agree with it.
 */
export function echoOnly(userText: string, rows: EvidenceRow[]) {
  const own = new Set(evidenceNumbers(rows));
  const echoable = new Set(numbersIn(userText).filter((n) => !own.has(n)));
  const userOnly = (t: string) => numbersIn(t).some((n) => echoable.has(n));
  return (res: GuideResponse): Violation | null => {
    const sentences = textsOf(res).flatMap((t) => t.split(/(?<=[.!?])\s+/));
    const bad = sentences.some((s) => {
      const quotes = s.match(QUOTED) ?? [];
      const outside = s.replace(QUOTED, " ");
      if (userOnly(outside)) return true;
      return quotes.some(userOnly) && AFFIRM.test(outside);
    });
    return bad ? "ungrounded_number" : null;
  };
}

/** Only evidence our team has re-checked may be called verified. Otherwise those words are out. */
export function verifiedOnlyIfChecked(rows: EvidenceRow[]) {
  return (res: GuideResponse): Violation | null =>
    rows.some((r) => r.verified_at !== null) ? null : claimsVerification(res);
}
