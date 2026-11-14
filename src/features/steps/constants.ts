export const EFFORTS = ["tiny", "medium", "big"] as const;
export type Effort = (typeof EFFORTS)[number];

export const PLACES = ["home", "in_person", "either"] as const;
export type Place = (typeof PLACES)[number];

export const EFFORT_LABELS: Record<Effort, { label: string; hint: string }> = {
  tiny: { label: "Tiny", hint: "About 5 to 10 minutes" },
  medium: { label: "Medium", hint: "About 15 to 30 minutes" },
  big: { label: "Big", hint: "An hour or more" },
};

export const PLACE_LABELS: Record<Place, string> = {
  home: "From home",
  in_person: "In person",
  either: "Home or in person",
};

export const NOTE_MAX = 1000;
export const TITLE_MIN = 3;
export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 500;
export const REPLY_PROMISE_HOURS = 48;

export function isEffort(value: unknown): value is Effort {
  return typeof value === "string" && (EFFORTS as readonly string[]).includes(value);
}
