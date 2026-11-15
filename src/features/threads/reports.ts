"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fail, type ActionResult } from "@/lib/result";
import { fieldErrorsFromZod } from "@/lib/zod-errors";
import { getCurrentUser } from "@/features/auth/queries";
import { loose } from "@/features/threads/loose-db";
import { blockSchema, reportSchema } from "@/features/threads/schemas";

const UNIQUE_VIOLATION = "23505";

/** Report a thread, comment or group. Three different people reporting it hides it. */
export async function reportContent(
  targetType: string,
  targetId: string,
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = reportSchema.safeParse({
    targetType,
    targetId,
    reason: formData.get("reason"),
    details: formData.get("details") ?? "",
  });
  if (!parsed.success) return fail("Check the form.", fieldErrorsFromZod(parsed.error));

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = loose(await createClient());
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    reason: parsed.data.reason,
    details: parsed.data.details,
  });
  if (error && error.code !== UNIQUE_VIOLATION) {
    return fail("We could not send your report. Try again in a moment.");
  }

  revalidatePath("/discussions", "layout");
  return {
    ok: true,
    data: undefined,
    message: "Thanks. Your report was sent. You can also block this person.",
  };
}

/** Hide everything a person posts, for you only. */
export async function blockUser(userId: string): Promise<ActionResult> {
  const parsed = blockSchema.safeParse({ userId });
  if (!parsed.success) return fail("We could not block that person.");

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (parsed.data.userId === user.id) return fail("You can't block yourself.");

  const supabase = loose(await createClient());
  const { error } = await supabase
    .from("user_blocks")
    .insert({ blocker_id: user.id, blocked_id: parsed.data.userId });
  if (error && error.code !== UNIQUE_VIOLATION) return fail("We could not block them. Try again.");

  revalidatePath("/discussions", "layout");
  return { ok: true, data: undefined };
}

export async function unblockUser(userId: string): Promise<ActionResult> {
  const parsed = blockSchema.safeParse({ userId });
  if (!parsed.success) return fail("We could not unblock that person.");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = loose(await createClient());
  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", parsed.data.userId);
  if (error) return fail("We could not unblock them. Try again.");

  revalidatePath("/discussions", "layout");
  return { ok: true, data: undefined };
}
