import type { GuideResponse } from "../../schemas";
import type { Violation } from "../../types";
import { allTexts } from "./text-of";

/** Skips "not verified", "isn't verified" and "never verified". "unverified" has no word edge. */
const NOT = "(?<!\\bnot )(?<!n['’]t )(?<!\\bnever )";

const CLAIMS = [
  new RegExp(`${NOT}\\bverified\\b`, "i"),
  new RegExp(`${NOT}\\bcertified\\b`, "i"),
  /\b(?:we|i) certif(?:y|ies)\b/i,
  /\bofficially recogni[sz]ed\b/i,
  /\bconfirmed by\b/i,
];

/** Recognition is self reported. Text that says it was verified or certified is rejected. */
export function claimsVerification(res: GuideResponse): Violation | null {
  return allTexts(res).some((t) => CLAIMS.some((re) => re.test(t))) ? "claims_verification" : null;
}

const CERT_ASK = /\b(certificate|certif\w*|official proof|verified hours|notari[sz]\w*)\b/i;

/** True when the person is asking for proof or a certificate the app cannot give. */
export function asksForCertification(text: string): boolean {
  return CERT_ASK.test(text);
}
