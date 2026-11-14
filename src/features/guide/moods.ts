import type { Effort } from "@/features/steps/constants";

export const MOODS = [
  {
    id: "overwhelmed",
    label: "Overwhelmed",
    effort: "tiny",
    reply: "That is a lot to carry. Here is one tiny thing, nothing more.",
  },
  {
    id: "angry",
    label: "Angry",
    effort: "medium",
    reply: "Anger means you care. Here is a way to put it to work.",
  },
  {
    id: "sad",
    label: "Sad",
    effort: "tiny",
    reply: "Be gentle with yourself. A small kind act can help, and it is enough.",
  },
  {
    id: "restless",
    label: "Restless",
    effort: "medium",
    reply: "Got some energy? Here is something with a little more to it.",
  },
  {
    id: "ready",
    label: "Ready for more",
    effort: "big",
    reply: "Love that. This one takes longer and means more.",
  },
] as const satisfies readonly { id: string; label: string; effort: Effort; reply: string }[];

export type MoodId = (typeof MOODS)[number]["id"];

export function isMoodId(value: string): value is MoodId {
  return MOODS.some((mood) => mood.id === value);
}
