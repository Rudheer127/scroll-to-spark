import { BANNED_PHRASES, MAX_MESSAGE_CHARS } from "../../constants";
import type { GuideResponse } from "../../schemas";
import type { OutputContext, Violation } from "../../types";
import { allTexts } from "./text-of";

const URL_SCHEME = /https?:\/\/|www\./i;
const BARE_DOMAIN = /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:\/\S*)?/i;
const MD_IMAGE_OR_LINK = /!?\[[^\]]*\]\([^)]*\)/;
const HTML_TAG = /<\/?[a-z][^>]*>/i;
const HUMAN_CLAIMS = [
  /\bas an? (?:real |actual )?(?:person|human)\b/i,
  /\bi(?: am|'m) (?:an? )?(?:real |actual )?(?:human|person)\b/i,
];

const normalize = (s: string) => s.replace(/[‘’]/g, "'");

export function urlInText(res: GuideResponse): Violation | null {
  return allTexts(res).some((t) => URL_SCHEME.test(t) || BARE_DOMAIN.test(t))
    ? "url_in_text"
    : null;
}

export function markup(res: GuideResponse): Violation | null {
  return allTexts(res).some((t) => MD_IMAGE_OR_LINK.test(t) || HTML_TAG.test(t)) ? "markup" : null;
}

export function bannedPhrase(res: GuideResponse): Violation | null {
  const texts = allTexts(res).map((t) => normalize(t).toLowerCase());
  return BANNED_PHRASES.some((p) => texts.some((t) => t.includes(p))) ? "banned_phrase" : null;
}

/** U+2014 and U+2013 are both rejected. */
export function emDash(res: GuideResponse): Violation | null {
  return allTexts(res).some((t) =>
    new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`).test(t),
  )
    ? "em_dash"
    : null;
}

/** Lowercase, NFKC, and drop whitespace, hyphens and zero-width characters. */
const squash = (s: string) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\-\u200b-\u200d\u2060\ufeff]/g, "");

export function canaryLeak(res: GuideResponse, ctx: OutputContext): Violation | null {
  const canary = squash(ctx.canary);
  if (!canary) return null;
  return allTexts(res).some((t) => squash(t).includes(canary)) ? "canary_leak" : null;
}

export function tooLong(res: GuideResponse): Violation | null {
  return res.message.length > MAX_MESSAGE_CHARS ? "too_long" : null;
}

export function claimsHuman(res: GuideResponse): Violation | null {
  return allTexts(res).some((t) => HUMAN_CLAIMS.some((re) => re.test(normalize(t))))
    ? "claims_human"
    : null;
}
