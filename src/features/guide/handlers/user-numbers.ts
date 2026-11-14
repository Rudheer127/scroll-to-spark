const UNIT = String.raw`(?:minutes?|mins?|hours?|hrs?|days?|weeks?)`;
const NUMBER = String.raw`\d+(?:\.\d+)?`;
/** A number right before a unit: "3 hours", "30-minute", "45min". */
const BEFORE_UNIT = new RegExp(String.raw`(?<!\d)(${NUMBER})\s*-?\s*${UNIT}\b`, "gi");
/** A unit right before a number: "hours: 4". */
const AFTER_UNIT = new RegExp(String.raw`\b${UNIT}\s*[:=]?\s*(${NUMBER})(?![\d.])`, "gi");

/**
 * Numbers from the person's own message that sit directly next to a time unit. Only these may be
 * echoed back as grounded, so a typed "83%" or "500 people" never becomes a fact in a reply.
 */
export function timedNumbersIn(text: string): string[] {
  const hits = [...text.matchAll(BEFORE_UNIT), ...text.matchAll(AFTER_UNIT)]
    .map((m) => ({ at: m.index ?? 0, value: m[1] }))
    .sort((a, b) => a.at - b.at)
    .map((h) => h.value);
  return [...new Set(hits)];
}
