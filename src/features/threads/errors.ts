import { fail, type ActionResult } from "@/lib/result";
import { detectPersonalInfo, personalInfoMessage } from "@/features/threads/personal-info";

/** The database raises `rate_limit` when someone writes too fast. Say so kindly. */
export function writeFailure(
  error: { message?: string } | null | undefined,
  fallback: string,
): ActionResult<never> {
  if (error?.message?.includes("rate_limit")) {
    return fail("You are posting very quickly. Take a short break and try again in a bit.");
  }
  return fail(fallback);
}

/**
 * Stops a post that holds a phone number or email until the person confirms, once.
 * Returns a failure to show, or null when it is fine to go ahead.
 */
export function personalInfoCheck(
  formData: FormData,
  ...texts: (string | null | undefined)[]
): ActionResult<never> | null {
  if (formData.get("confirmPersonalInfo") === "1") return null;
  const kinds = detectPersonalInfo(...texts);
  if (kinds.length === 0) return null;
  return fail("Check before you post.", { personalInfo: personalInfoMessage(kinds) });
}
