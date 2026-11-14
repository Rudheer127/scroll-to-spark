"use server";

import { getCurrentUser } from "@/features/auth/queries";
import { MOODS, isMoodId } from "@/features/guide/moods";
import { getNextTask } from "@/features/steps/queries";

export type GuideSuggestion = {
  reply: string;
  task: { id: string; title: string; minutes: number; groupName: string } | null;
};

/** Pick a real, open step that fits how someone feels. No account data leaves the app. */
export async function suggestForMood(mood: string): Promise<GuideSuggestion> {
  const user = await getCurrentUser();
  if (!user || !isMoodId(mood)) {
    return { reply: "Sign in and I can find you a step.", task: null };
  }
  const chosen = MOODS.find((item) => item.id === mood);
  if (!chosen) return { reply: "Tell me how you feel and I will find a step.", task: null };

  const task = (await getNextTask({ effort: chosen.effort })) ?? (await getNextTask());
  if (!task) {
    return { reply: "There are no open steps right now. Check back soon.", task: null };
  }
  return {
    reply: chosen.reply,
    task: { id: task.id, title: task.title, minutes: task.minutes, groupName: task.groupName },
  };
}
