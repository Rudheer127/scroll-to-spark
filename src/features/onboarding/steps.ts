type Metadata = Record<string, unknown> | null | undefined;

export type NameParts = { firstName: string; lastName: string };

/** "Maya R. Santos" becomes first "Maya" and last "R. Santos". One word is all first name. */
export function splitName(full: string | null | undefined): NameParts {
  const words = (full ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: (words[0] ?? "").slice(0, 40),
    lastName: words.slice(1).join(" ").slice(0, 40),
  };
}

type SavedNames = {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
} | null;

/**
 * What to put in the boxes when setup opens. Saved names win, then the name from Google sign-in, then
 * the display name. The display name defaults to the first name, which is what others see.
 */
export function prefillNames(
  profile: SavedNames | undefined,
  metadata: Metadata,
): NameParts & { displayName: string } {
  const google = [metadata?.full_name, metadata?.name].find(
    (value): value is string => typeof value === "string" && value.trim() !== "",
  );
  const guess = splitName(google ?? profile?.display_name);
  const firstName = profile?.first_name?.trim() || guess.firstName;
  const lastName = profile?.last_name?.trim() || guess.lastName;
  const displayName = profile?.display_name?.trim() || firstName;
  return { firstName, lastName, displayName: displayName.slice(0, 60) };
}
