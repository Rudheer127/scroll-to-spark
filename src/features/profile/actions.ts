"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fail, type ActionResult } from "@/lib/result";
import { fieldErrorsFromZod } from "@/lib/zod-errors";
import { getCurrentUser } from "@/features/auth/queries";
import { AVATAR_BUCKET, AVATAR_FILE_PATTERN } from "@/features/profile/constants";
import {
  updateDisplayNameSchema,
  updateEmailSchema,
  updatePasswordSchema,
  updateUsernameSchema,
} from "@/features/profile/schemas";

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

export async function updateDisplayName(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateDisplayNameSchema.safeParse({
    displayName: formData.get("displayName") ?? "",
  });
  if (!parsed.success) {
    return fail("Check the highlighted field.", fieldErrorsFromZod(parsed.error));
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id);
  if (error) return fail("We could not save it. Try again.");

  revalidatePath("/", "layout");
  return { ok: true, data: undefined, message: "Saved." };
}

/** Called after the browser has uploaded a photo into the person's own folder. Checks the path, then saves its URL. */
export async function saveAvatar(path: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [folder, file, ...rest] = path.split("/");
  if (folder !== user.id || !file || rest.length > 0 || !AVATAR_FILE_PATTERN.test(file)) {
    return fail("That photo did not upload correctly. Try again.");
  }

  const supabase = await createClient();
  const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: urlData.publicUrl })
    .eq("id", user.id);
  if (error) return fail("We could not save your photo. Try again.");

  // Tidy up: keep only the newest photo. A failure here is harmless.
  const { data: files } = await supabase.storage.from(AVATAR_BUCKET).list(user.id);
  const old = (files ?? [])
    .filter((entry) => entry.name !== file)
    .map((entry) => `${user.id}/${entry.name}`);
  if (old.length > 0) await supabase.storage.from(AVATAR_BUCKET).remove(old);

  revalidatePath("/", "layout");
  return { ok: true, data: undefined, message: "Photo saved." };
}

export async function removeAvatar(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) return fail("We could not remove your photo. Try again.");

  const { data: files } = await supabase.storage.from(AVATAR_BUCKET).list(user.id);
  const paths = (files ?? []).map((entry) => `${user.id}/${entry.name}`);
  if (paths.length > 0) await supabase.storage.from(AVATAR_BUCKET).remove(paths);

  revalidatePath("/", "layout");
  return { ok: true, data: undefined, message: "Photo removed." };
}

async function getOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

/** Asks Supabase to change the sign-in email. It sends a link to confirm, and nothing changes until then. */
export async function updateEmail(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateEmailSchema.safeParse({ email: formData.get("email") ?? "" });
  if (!parsed.success) {
    return fail("Check the highlighted field.", fieldErrorsFromZod(parsed.error));
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (parsed.data.email === user.email?.toLowerCase()) {
    return fail("That is already your email.", { email: "That is already your email." });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data.email },
    { emailRedirectTo: `${await getOrigin()}/auth/callback` },
  );
  if (error) {
    return fail("We could not change your email. It may already be in use.", {
      email: "We could not use that email.",
    });
  }

  return {
    ok: true,
    data: undefined,
    message: `We sent a link to ${parsed.data.email}. Your email changes once you open it.`,
  };
}

export async function updatePassword(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    newPassword: formData.get("newPassword") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });
  if (!parsed.success) {
    return fail("Check the highlighted fields.", fieldErrorsFromZod(parsed.error));
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.email) return fail("This account has no email to check a password against.");

  const supabase = await createClient();
  const check = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (check.error) {
    return fail("Your current password is not right.", {
      currentPassword: "That is not your current password.",
    });
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) return fail("We could not change your password. Try a different one.");

  return { ok: true, data: undefined, message: "Password updated." };
}
