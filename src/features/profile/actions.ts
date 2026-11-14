"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fail, type ActionResult } from "@/lib/result";
import { fieldErrorsFromZod } from "@/lib/zod-errors";
import { getCurrentUser } from "@/features/auth/queries";
import { updateUsernameSchema } from "@/features/profile/schemas";

const UNIQUE_VIOLATION = "23505";

export async function updateUsername(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateUsernameSchema.safeParse({ username: formData.get("username") ?? "" });
  if (!parsed.success) {
    return fail("Check the highlighted field.", fieldErrorsFromZod(parsed.error));
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ username: parsed.data.username })
    .eq("id", user.id);

  if (error?.code === UNIQUE_VIOLATION) {
    return fail("That username is taken.", { username: "That username is taken." });
  }
  if (error) return fail("We could not save it. Try again.");

  revalidatePath("/", "layout");
  return { ok: true, data: undefined, message: "Saved." };
}
