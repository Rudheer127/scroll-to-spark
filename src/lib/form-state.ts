import type { ActionResult } from "@/lib/result";

type FormState = ActionResult<unknown> | null;

/** The error for one field, if the last submit failed on it. */
export function fieldError(state: FormState, name: string): string | undefined {
  return state && !state.ok ? state.fieldErrors?.[name] : undefined;
}

/** An error that belongs to the whole form, not to one field. */
export function formError(state: FormState): string | undefined {
  return state && !state.ok && !state.fieldErrors ? state.error : undefined;
}
