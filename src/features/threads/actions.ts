"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fail, type ActionResult } from "@/lib/result";
import { fieldErrorsFromZod } from "@/lib/zod-errors";
import { getCurrentUser } from "@/features/auth/queries";
import { createThreadSchema, voteSchema } from "@/features/threads/schemas";

export async function createThread(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createThreadSchema.safeParse({
    groupId: formData.get("groupId"),
    title: formData.get("title") ?? "",
    body: formData.get("body") ?? "",
  });
  if (!parsed.success)
    return fail("Check the highlighted fields.", fieldErrorsFromZod(parsed.error));

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("threads").insert({
    group_id: parsed.data.groupId,
    author_id: user.id,
    title: parsed.data.title,
    body: parsed.data.body,
  });
  if (error) return fail("We could not post that. Only members of the group can post threads.");

  revalidatePath("/discussions", "layout");
  return { ok: true, data: undefined, message: "Posted." };
}

/** Vote up or down. Voting the same way again takes your vote back. */
export async function voteThread(threadId: string, value: 1 | -1): Promise<ActionResult> {
  const parsed = voteSchema.safeParse({ threadId, value });
  if (!parsed.success) return fail("That vote did not work.");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("thread_votes")
    .select("value")
    .eq("thread_id", parsed.data.threadId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } =
    existing?.value === parsed.data.value
      ? await supabase
          .from("thread_votes")
          .delete()
          .eq("thread_id", parsed.data.threadId)
          .eq("user_id", user.id)
      : await supabase
          .from("thread_votes")
          .upsert(
            { thread_id: parsed.data.threadId, user_id: user.id, value: parsed.data.value },
            { onConflict: "thread_id,user_id" },
          );
  if (error) return fail("We could not save your vote. Only members can vote.");

  revalidatePath("/discussions", "layout");
  return { ok: true, data: undefined };
}
