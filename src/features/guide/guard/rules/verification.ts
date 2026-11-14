import type { GuideResponse } from "../../schemas";
import type { Violation } from "../../types";
import { negatedAt } from "./negation";
import { allTexts } from "./text-of";

const CLAIMS = [
  /\bverified\b/gi,
  /\bcertified\b/gi,
  /\b(?:we|i) certif(?:y|ies)\b/gi,
  /\bofficially recogni[sz]ed\b/gi,
  /\bconfirmed by\b/gi,
];

function claims(text: string): boolean {
  return CLAIMS.some((re) => [...text.matchAll(re)].some((m) => !negatedAt(text, m.index ?? 0)));
}

/** Recognition is self reported. Text that says it was verified or certified is rejected. */
export function claimsVerification(res: GuideResponse): Violation | null {
  return allTexts(res).some(claims) ? "claims_verification" : null;
}

const CERT_ASK = /\b(certificate|certif\w*|official proof|verified hours|notari[sz]\w*)\b/i;

/** True when the person is asking for proof or a certificate the app cannot give. */
export function asksForCertification(text: string): boolean {
  return CERT_ASK.test(text);
}
