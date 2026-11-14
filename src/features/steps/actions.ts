"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fail, type ActionResult } from "@/lib/result";
import { fieldErrorsFromZod } from "@/lib/zod-errors";
import { getCurrentUser } from "@/features/auth/queries";
import { completeTaskSchema, createTaskSchema, thankYouSchema } from "@/features/steps/schemas";

const UNIQUE_VIOLATION = "23505";

function refreshSteps() {
  revalidatePath("/", "layout");
}

export async function completeTask(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = completeTaskSchema.safeParse({
    taskId: formData.get("taskId"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return fail("Check the highlighted field.", fieldErrorsFromZod(parsed.error));
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("task_completions")
    .insert({ task_id: parsed.data.taskId, user_id: user.id, note: parsed.data.note });
  if (error && error.code !== UNIQUE_VIOLATION) {
    return fail("We could not send that. Try again.");
  }

  refreshSteps();
  redirect(`/steps/${parsed.data.taskId}/done`);
}

export async function createTask(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createTaskSchema.safeParse({
    groupId: formData.get("groupId"),
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    minutes: formData.get("minutes"),
    effort: formData.get("effort"),
    place: formData.get("place"),
  });
  if (!parsed.success) {
    return fail("Check the highlighted fields.", fieldErrorsFromZod(parsed.error));
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { groupId, title, description, minutes, effort, place } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    group_id: groupId,
    created_by: user.id,
    title,
    description,
    minutes,
    effort,
    place,
  });
  if (error) return fail("We could not post the task. Only the owner of a group can post tasks.");

  refreshSteps();
  redirect("/portal");
}

export async function sendThankYou(
  completionId: string,
  kind: "tap" | "written",
  body?: string,
): Promise<ActionResult> {
  const parsed = thankYouSchema.safeParse({ completionId, kind, body });
  if (!parsed.success) return fail("Write at least a line before sending.");
  if (parsed.data.kind === "written" && !parsed.data.body) {
    return fail("Write at least a line before sending.");
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("thank_yous").insert({
    completion_id: parsed.data.completionId,
    from_user_id: user.id,
    kind: parsed.data.kind,
    body: parsed.data.kind === "written" ? (parsed.data.body ?? null) : null,
  });
  if (error && error.code !== UNIQUE_VIOLATION) return fail("We could not send it. Try again.");

  refreshSteps();
  return { ok: true, data: undefined };
}

/** Close a task so nobody new sees it, or open it again. Only the person who posted it can. */
export async function setTaskOpen(taskId: string, isOpen: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ is_open: isOpen })
    .eq("id", taskId)
    .eq("created_by", user.id)
    .select("id");
  if (error || !data?.length) return fail("We could not update that task. Try again.");

  refreshSteps();
  return { ok: true, data: undefined };
}
