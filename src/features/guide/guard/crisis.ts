const APOS = String.raw`['’]`;

/** Specific self-harm intent phrases. Deliberately narrow to avoid flagging "quit scrolling". */
const CRISIS_PATTERNS: RegExp[] = [
  /\bkill(?:ing)?\s+my\s*self\b/i,
  /\bend(?:ing)?\s+(?:it\s+all|my\s+(?:own\s+)?life)\b/i,
  /\btak(?:e|ing)\s+my\s+own\s+life\b/i,
  /\bwant(?:ed)?\s+to\s+die\b/i,
  /\b(?:commit|committing|attempt|attempting)\s+suicide\b/i,
  /\bsuicidal\b/i,
  /\b(?:thinking|thought|thoughts)\s+(?:about|of)\s+suicide\b/i,
  new RegExp(
    String.raw`\b(?:don${APOS}?t|do\s+not)\s+want\s+to\s+(?:be\s+alive|live|be\s+here)(?:\s+anymore)?\b`,
    "i",
  ),
  /\bbetter\s+off\s+dead\b/i,
  /\b(?:hurt|harm|cut)(?:ting|ing)?\s+my\s*self\b/i,
  /\bself[\s-]?harm\b/i,
  new RegExp(
    String.raw`\bwish\s+i\s+(?:would\s+)?(?:just\s+)?(?:never\s+wake|not\s+wake|wasn${APOS}?t\s+(?:alive|here|born))`,
    "i",
  ),
  /\bno\s+(?:point|reason)\s+(?:in|to)\s+(?:going\s+on\s+)?(?:living|live)\b/i,
  /\bquiero\s+morir(?:me)?\b/i,
  /\bno\s+quiero\s+(?:vivir|seguir\s+viviendo|estar\s+vivo)\b/i,
  /不想活|想去死/,
  /मरना\s+चाह/,
  /\bquitarme\s+la\s+vida\b/i,
  /\b(?:suicidarme|matarme)\b/i,
];

/** True when sanitized text expresses self-harm intent. */
export function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}
