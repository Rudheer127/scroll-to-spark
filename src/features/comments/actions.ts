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
import { addCommentSchema, commentVoteSchema, reactionSchema } from "@/features/comments/schemas";

function nonEmpty(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

export async function addComment(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parentId = formData.get("parentId");
  const parsed = addCommentSchema.safeParse({
    threadId: formData.get("threadId"),
    parentId: typeof parentId === "string" && parentId !== "" ? parentId : null,
    body: formData.get("body") ?? "",
    imagePath: nonEmpty(formData.get("imagePath")),
    gifUrl: nonEmpty(formData.get("gifUrl")),
    imageAlt: nonEmpty(formData.get("imageAlt")),
  });
  if (!parsed.success) return fail("Check the box below.", fieldErrorsFromZod(parsed.error));

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (parsed.data.imagePath && !isOwnImagePath(parsed.data.imagePath, user.id))
    return fail("That image did not upload properly. Try attaching it again.");

  const nudge = personalInfoCheck(formData, parsed.data.body);
  if (nudge) return nudge;

  const supabase = loose(await createClient());
  const { error } = await supabase.from("comments").insert({
    thread_id: parsed.data.threadId,
    parent_id: parsed.data.parentId,
    author_id: user.id,
    body: parsed.data.body === "" ? null : parsed.data.body,
    attachment_kind: parsed.data.gifUrl ? "gif" : parsed.data.imagePath ? "image" : null,
    attachment_url: parsed.data.gifUrl ?? parsed.data.imagePath,
    image_alt: parsed.data.imagePath || parsed.data.gifUrl ? parsed.data.imageAlt : null,
  });
  if (error)
    return writeFailure(error, "We could not post that. Only members of the group can comment.");

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

/** Like or dislike a comment. Choosing the same one again takes your vote back. */
export async function voteComment(commentId: string, value: 1 | -1): Promise<ActionResult> {
  const parsed = commentVoteSchema.safeParse({ commentId, value });
  if (!parsed.success) return fail("That vote did not work.");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const loosely = loose(supabase);
  const { data: comment } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", parsed.data.commentId)
    .maybeSingle();
  if (comment?.author_id === user.id) return fail("You can't vote on your own comment.");

  const { data: existing } = await loosely
    .from("comment_votes")
    .select("value")
    .eq("comment_id", parsed.data.commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } =
    (existing as { value: number } | null)?.value === parsed.data.value
      ? await loosely
          .from("comment_votes")
          .delete()
          .eq("comment_id", parsed.data.commentId)
          .eq("user_id", user.id)
      : await loosely
          .from("comment_votes")
          .upsert(
            { comment_id: parsed.data.commentId, user_id: user.id, value: parsed.data.value },
            { onConflict: "comment_id,user_id" },
          );
  if (error) return fail("We could not save your vote. Only members can vote.");

  revalidatePath("/discussions", "layout");
  return { ok: true, data: undefined };
}

/** Delete a comment and its replies. RLS only lets its author or the group owner do this. */
export async function deleteComment(commentId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data, error } = await supabase.from("comments").delete().eq("id", commentId).select("id");
  if (error || !data?.length) {
    return fail("We could not delete that comment. Only its author or the group owner can.");
  }

  revalidatePath("/discussions", "layout");
  return { ok: true, data: undefined };
}
