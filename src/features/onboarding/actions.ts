"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fail, type ActionResult } from "@/lib/result";
import { fieldErrorsFromZod } from "@/lib/zod-errors";
import { getCurrentUser } from "@/features/auth/queries";
import { onboardingSchema } from "@/features/onboarding/schemas";

/** Save the three names and the 18+ confirmation, mark setup done, and go to the app. */
export async function completeOnboarding(input: unknown): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Check the highlighted fields.", fieldErrorsFromZod(parsed.error));
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { firstName, lastName, displayName } = parsed.data;
  const now = new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      age_confirmed_at: now,
      onboarded_at: now,
    })
    .eq("id", user.id);
  if (error) return fail("We could not save that. Try again.");

  revalidatePath("/", "layout");
  redirect("/");
}
