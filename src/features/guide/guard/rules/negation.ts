const NEGATORS = new Set(["not", "never", "cannot", "unable"]);
const NEGATION_WINDOW = 3;

function isNegator(word: string): boolean {
  const w = word.toLowerCase().replace(/’/g, "'");
  return NEGATORS.has(w) || w.endsWith("n't");
}

/** True when a negator sits within the three words before `index`, in the same sentence. */
export function negatedAt(text: string, index: number): boolean {
  const before = text.slice(0, index);
  if (/\bun-$/i.test(before)) return true;
  const sentence = before.split(/[.!?;]/).pop() ?? "";
  const words = sentence.match(/[\p{L}'’]+/gu) ?? [];
  return words.slice(-NEGATION_WINDOW).some(isNegator);
}

/** True when any match of a global pattern is not negated. */
export function affirmedMatch(text: string, pattern: RegExp): boolean {
  return [...text.matchAll(pattern)].some((m) => !negatedAt(text, m.index ?? 0));
}
