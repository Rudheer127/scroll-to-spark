const MAX_SLUG_LENGTH = 40;
const FALLBACK_SLUG = "group";

/** Lowercase letters, digits and single hyphens only, to match the database rule for slugs. */
export function slugify(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
  return slug.length >= 2 ? slug : FALLBACK_SLUG;
}

/** A slug for a group name. Later attempts add a short random ending so a taken name can still work. */
export function buildSlug(name: string, attempt: number): string {
  const base = slugify(name);
  if (attempt === 0) return base;
  const ending = Math.random().toString(36).slice(2, 6);
  return `${base.slice(0, MAX_SLUG_LENGTH - 5)}-${ending}`;
}
