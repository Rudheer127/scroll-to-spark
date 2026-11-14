import type { Effort } from "@/features/steps/constants";
import { evidenceKeywords } from "../tools/evidence-keywords";
import type { OpportunityFilters } from "../types";

const TINY_WORDS =
  /\b(?:tiny|small|quick|quickly|short|brief|few\s+minutes?|5\s*min(?:ute)?s?|five\s+minutes?|ten\s+minutes?|10\s*min(?:ute)?s?)\b/i;
const MEDIUM_WORDS =
  /\b(?:medium|half\s+an\s+hour|an\s+hour|30\s*min(?:ute)?s?|thirty\s+minutes?|one\s+hour|1\s*hour)\b/i;
const BIG_WORDS =
  /\b(?:big|long|longer|bigger|hours|all\s+day|afternoon|weekend|several\s+hours|[2-9]\s*hours?)\b/i;
const REMOTE_WORDS =
  /\b(?:home|remote|remotely|online|virtual|virtually|from\s+my\s+(?:couch|bed|desk|phone)|on\s+my\s+phone)\b/i;

/** Request words that say "find me something", not what it is about. Never used as a keyword. */
const REQUEST_WORDS = new Set(
  (
    "find finding something anything thing things task tasks step steps small smaller tiny quick " +
    "quickly short brief medium big bigger long longer want wanna need help helping helpful way " +
    "ways give show looking look today tonight now time free minute minutes min mins hour hours " +
    "home remote remotely online virtual virtually nearby near local volunteer volunteering " +
    "opportunity opportunities doing done else feel feeling feelings im ready more less ok okay " +
    "maybe good great cool idea ideas new other another one two few half day week weekend " +
    "afternoon morning evening let lets let's try could suggest suggestion recommend start " +
    "overwhelmed angry sad restless bored tired stressed happy fine kind sort"
  ).split(" "),
);

function effortOf(text: string): Effort | null {
  if (BIG_WORDS.test(text)) return "big";
  if (MEDIUM_WORDS.test(text)) return "medium";
  if (TINY_WORDS.test(text)) return "tiny";
  return null;
}

/** The longest topic word left after dropping stopwords, request words and numbers. */
function keywordOf(text: string): string | null {
  const topics = evidenceKeywords(text).filter(
    (word) => !REQUEST_WORDS.has(word) && !/\d/.test(word) && word.length >= 3,
  );
  if (topics.length === 0) return null;
  return topics.reduce((best, word) => (word.length > best.length ? word : best));
}

/**
 * Search filters read from the message with plain rules, no model call. This keeps a guide turn
 * at two model calls, which matters on rate limited free models.
 */
export function parseOpportunityFilters(text: string): OpportunityFilters {
  return {
    effort: effortOf(text),
    remoteOnly: REMOTE_WORDS.test(text),
    keyword: keywordOf(text),
  };
}
