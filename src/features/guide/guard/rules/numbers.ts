import type { GuideResponse } from "../../schemas";
import type { OutputContext, Violation } from "../../types";
import { numberTexts } from "./text-of";

/** Spelled-out numbers above ten. One to ten read as ordinary prose and are allowed. */
const BIG_WORDS =
  /\b(eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|dozen)\b/i;

export function ungroundedNumber(res: GuideResponse, ctx: OutputContext): Violation | null {
  for (const text of numberTexts(res)) {
    if (BIG_WORDS.test(text)) return "ungrounded_number";
    const tokens = text.match(/\d+(?:\.\d+)?/g) ?? [];
    if (tokens.some((t) => !ctx.allowedNumbers.has(t))) return "ungrounded_number";
  }
  return null;
}
