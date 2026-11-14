import type { GuideResponse } from "../schemas";
import type { CheckResult, OutputContext, Violation } from "../types";
import { badId, unsupportedVerdict } from "./rules/ids";
import { ungroundedNumber } from "./rules/numbers";
import {
  bannedPhrase,
  canaryLeak,
  claimsHuman,
  emDash,
  markup,
  promptEcho,
  tooLong,
  urlInText,
} from "./rules/text-rules";

type Rule = (res: GuideResponse, ctx: OutputContext) => Violation | null;

const RULES: Rule[] = [
  badId,
  ungroundedNumber,
  urlInText,
  markup,
  bannedPhrase,
  emDash,
  canaryLeak,
  promptEcho,
  tooLong,
  claimsHuman,
  unsupportedVerdict,
];

/** Runs every rule and collects all violations. Pure: no I/O. */
export function checkOutput(res: GuideResponse, ctx: OutputContext): CheckResult {
  const violations = RULES.map((rule) => rule(res, ctx)).filter((v): v is Violation => v !== null);
  return violations.length === 0 ? { ok: true } : { ok: false, violations };
}
