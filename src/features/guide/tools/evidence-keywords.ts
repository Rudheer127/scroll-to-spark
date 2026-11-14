/** Only the start of a long paste is read. Longer input is truncated, never rejected. */
export const KEYWORD_INPUT_MAX = 400;
const MAX_KEYWORDS = 8;

/** Words that say "please check" or glue a sentence together, not what the claim is about. */
const STOPWORDS = new Set(
  (
    "is it its true false that the a an of to in and or not no yes check claim claims fact facts " +
    "really does do did are was were be been being about from study studies shows show showed " +
    "said says say saying people person someone i me my we us our you your they them their he " +
    "she his her this these those what which who whom how why when where for on at by with as " +
    "has have had can could would should will may might must if than then there here just also " +
    "very any all some much many more most so please tell know heard read saw seen hear think " +
    "believe right correct accurate actually literally like get got"
  ).split(" "),
);

/**
 * Lowercase letter and digit tokens of a claim, minus stopwords and single letters, deduped,
 * at most 8. Numbers such as "54" are kept. The output holds no search operators or punctuation.
 */
export function evidenceKeywords(text: string): string[] {
  const tokens =
    text
      .slice(0, KEYWORD_INPUT_MAX)
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? [];
  const kept = tokens.filter((t) => !STOPWORDS.has(t) && (t.length > 1 || /\d/.test(t)));
  return [...new Set(kept)].slice(0, MAX_KEYWORDS);
}
