"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fail, type ActionResult } from "@/lib/result";
import { buildSlug } from "@/lib/slugify";
import { fieldErrorsFromZod } from "@/lib/zod-errors";
import { getCurrentUser } from "@/features/auth/queries";
import { createGroupSchema, deleteGroupSchema } from "@/features/groups/schemas";

const UNIQUE_VIOLATION = "23505";
const SLUG_ATTEMPTS = 3;

function refreshGroups() {
  revalidatePath("/discussions", "layout");
}

export async function createGroup(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createGroupSchema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    isPrivate: formData.get("visibility") === "private",
    color: formData.get("color"),
  });
  if (!parsed.success) {
    return fail("Check the highlighted fields.", fieldErrorsFromZod(parsed.error));
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { name, description, isPrivate, color } = parsed.data;
  const supabase = await createClient();

  for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt++) {
    const slug = buildSlug(name, attempt);
    const { error } = await supabase
      .from("groups")
      .insert({ slug, name, description, is_private: isPrivate, color, owner_id: user.id });

    if (!error) {
      refreshGroups();
      redirect(`/discussions/${slug}`);
    }
    if (error.code !== UNIQUE_VIOLATION) return fail("We could not create the group. Try again.");
  }
  return fail("That name is taken. Try a different one.");
}

export async function joinGroup(groupId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: user.id });
  if (error && error.code !== UNIQUE_VIOLATION) return fail("We could not add you. Try again.");

  refreshGroups();
  return { ok: true, data: undefined };
}

export async function leaveGroup(groupId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .eq("role", "member");
  if (error) return fail("We could not remove you. Try again.");

  refreshGroups();
  return { ok: true, data: undefined };
}

export async function deleteGroup(groupId: string, confirmName: string): Promise<ActionResult> {
  const parsed = deleteGroupSchema.safeParse({ groupId, confirmName });
  if (!parsed.success) return fail("Something went wrong. Reload the page and try again.");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("name, owner_id")
    .eq("id", groupId)
    .maybeSingle();

  if (!group || group.owner_id !== user.id) return fail("Only the owner can delete this group.");
  if (group.name !== confirmName.trim()) return fail("The name does not match.");

  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) return fail("We could not delete the group. Try again.");

  refreshGroups();
  redirect("/discussions");
}

/** Owner only. Changes the name, description, color and visibility. The web address stays the same. */
export async function updateGroup(
  groupId: string,
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createGroupSchema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    isPrivate: formData.get("visibility") === "private",
    color: formData.get("color"),
  });
  if (!parsed.success) {
    return fail("Check the highlighted fields.", fieldErrorsFromZod(parsed.error));
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { name, description, isPrivate, color } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .update({ name, description, is_private: isPrivate, color })
    .eq("id", groupId)
    .eq("owner_id", user.id)
    .select("id");
  if (error || !data?.length)
    return fail("We could not save the changes. Only the owner can edit this group.");

  refreshGroups();
  return { ok: true, data: undefined, message: "Saved." };
}
