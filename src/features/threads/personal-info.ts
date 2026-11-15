export type PersonalInfoKind = "phone number" | "email address";

const PHONE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/;

/** Looks for a phone number or an email address in what someone is about to post. */
export function detectPersonalInfo(...texts: (string | null | undefined)[]): PersonalInfoKind[] {
  const joined = texts.filter(Boolean).join("\n");
  const found: PersonalInfoKind[] = [];
  if (PHONE.test(joined)) found.push("phone number");
  if (EMAIL.test(joined)) found.push("email address");
  return found;
}

export function personalInfoMessage(kinds: PersonalInfoKind[]): string {
  return `This looks like it has a ${kinds.join(" and an ")}. Everyone who can see this group will see it, and it can't be unseen. Share it only if you mean to.`;
}
