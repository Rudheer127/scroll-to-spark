"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fail, type ActionResult } from "@/lib/result";
import { fieldErrorsFromZod } from "@/lib/zod-errors";
import { getCurrentUser } from "@/features/auth/queries";
import { addCommentSchema, reactionSchema } from "@/features/comments/schemas";

export async function addComment(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parentId = formData.get("parentId");
  const parsed = addCommentSchema.safeParse({
    threadId: formData.get("threadId"),
    parentId: typeof parentId === "string" && parentId !== "" ? parentId : null,
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) return fail("Check the box below.", fieldErrorsFromZod(parsed.error));

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    thread_id: parsed.data.threadId,
    parent_id: parsed.data.parentId,
    author_id: user.id,
    body: parsed.data.body,
  });
  if (error) return fail("We could not post that. Only members of the group can comment.");

  revalidatePath("/discussions", "layout");
  return { ok: true, data: undefined, message: "Posted." };
}

/** Add your reaction, or take it back if you already gave that one. */
export async function toggleReaction(commentId: string, emoji: string): Promise<ActionResult> {
  const parsed = reactionSchema.safeParse({ commentId, emoji });
  if (!parsed.success) return fail("That reaction is not available.");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("comment_reactions")
    .select("emoji")
    .eq("comment_id", parsed.data.commentId)
    .eq("user_id", user.id)
    .eq("emoji", parsed.data.emoji)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("comment_reactions")
        .delete()
        .eq("comment_id", parsed.data.commentId)
        .eq("user_id", user.id)
        .eq("emoji", parsed.data.emoji)
    : await supabase
        .from("comment_reactions")
        .insert({ comment_id: parsed.data.commentId, user_id: user.id, emoji: parsed.data.emoji });
  if (error) return fail("We could not save that reaction. Only members can react.");

  revalidatePath("/discussions", "layout");
  return { ok: true, data: undefined };
}
