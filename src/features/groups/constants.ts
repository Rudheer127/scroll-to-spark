export const GROUP_COLOR_VALUES = ["orange", "pink", "purple", "indigo", "blue", "green"] as const;

export type GroupColor = (typeof GROUP_COLOR_VALUES)[number];

/** Full class names are written out so Tailwind can find them. */
const SWATCH_CLASSES: Record<GroupColor, string> = {
  orange: "bg-group-orange",
  pink: "bg-group-pink",
  purple: "bg-group-purple",
  indigo: "bg-group-indigo",
  blue: "bg-group-blue",
  green: "bg-group-green",
};

export function swatchClass(color: string): string {
  return SWATCH_CLASSES[color as GroupColor] ?? SWATCH_CLASSES.pink;
}

export const GROUP_NAME_MIN = 2;
export const GROUP_NAME_MAX = 60;
export const GROUP_DESCRIPTION_MAX = 500;
