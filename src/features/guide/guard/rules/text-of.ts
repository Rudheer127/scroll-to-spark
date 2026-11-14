import type { GuideResponse } from "../../schemas";

/** Free text fields the number rule checks. */
export function numberTexts(res: GuideResponse): string[] {
  return [res.message, res.next_step ?? ""];
}

/** Every free text field the model wrote, for the text safety rules. */
export function allTexts(res: GuideResponse): string[] {
  const c = res.proposed_contribution;
  return [...numberTexts(res), c?.title ?? "", c?.description ?? ""];
}
