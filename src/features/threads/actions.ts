"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fail, type ActionResult } from "@/lib/result";
import { fieldErrorsFromZod } from "@/lib/zod-errors";
import { getCurrentUser } from "@/features/auth/queries";
import { personalInfoCheck, writeFailure } from "@/features/threads/errors";
import { isOwnImagePath } from "@/features/threads/image-rules";
import { loose } from "@/features/threads/loose-db";
import { createThreadSchema, voteSchema } from "@/features/threads/schemas";

function nonEmpty(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

export async function createThread(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createThreadSchema.safeParse({
    groupId: formData.get("groupId"),
    title: formData.get("title") ?? "",
    body: formData.get("body") ?? "",
    imagePath: nonEmpty(formData.get("imagePath")),
    imageAlt: nonEmpty(formData.get("imageAlt")),
  });
  if (!parsed.success)
    return fail("Check the highlighted fields.", fieldErrorsFromZod(parsed.error));

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (parsed.data.imagePath && !isOwnImagePath(parsed.data.imagePath, user.id))
    return fail("That image did not upload properly. Try attaching it again.");

  const nudge = personalInfoCheck(formData, parsed.data.title, parsed.data.body);
  if (nudge) return nudge;

  const supabase = await createClient();
  const { error } = await loose(supabase)
    .from("threads")
    .insert({
      group_id: parsed.data.groupId,
      author_id: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      image_path: parsed.data.imagePath,
      image_alt: parsed.data.imagePath ? parsed.data.imageAlt : null,
    });
  if (error)
    return writeFailure(
      error,
      "We could not post that. Only members of the group can post threads.",
    );

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
  const { data: thread } = await supabase
    .from("threads")
    .select("author_id")
    .eq("id", parsed.data.threadId)
    .maybeSingle();
  if (thread?.author_id === user.id) return fail("You can't vote on your own thread.");

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

/** Delete a thread. RLS only lets its author or the group owner do this. */
export async function deleteThread(threadId: string, groupSlug: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data, error } = await supabase.from("threads").delete().eq("id", threadId).select("id");
  if (error || !data?.length)
    return fail("We could not delete that thread. Only its author or the group owner can.");

  revalidatePath("/discussions", "layout");
  redirect(`/discussions/${groupSlug}`);
}
