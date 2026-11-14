"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fail, type ActionResult } from "@/lib/result";
import { fieldErrorsFromZod } from "@/lib/zod-errors";
import { getPendingEmail, rememberPendingEmail } from "@/features/auth/pending-email";
import { loginSchema, signupSchema } from "@/features/auth/schemas";

const CHECK_FIELDS = "Check the highlighted fields.";

async function getOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

async function getConfirmationRedirect(): Promise<string> {
  return `${await getOrigin()}/auth/callback`;
}

export async function signIn(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(CHECK_FIELDS, fieldErrorsFromZod(parsed.error));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return fail("That email and password do not match. Try again.");

  redirect("/");
}

export async function signUp(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(CHECK_FIELDS, fieldErrorsFromZod(parsed.error));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: await getConfirmationRedirect() },
  });
  if (error) return fail("We could not create that account. Try a different email.");

  if (data.session) redirect("/");

  await rememberPendingEmail(parsed.data.email);
  redirect("/check-email");
}

/** Send the confirmation email again to the address that just signed up. */
export async function resendConfirmation(): Promise<ActionResult> {
  const email = await getPendingEmail();
  if (!email) return fail("Start again from the sign-up page.");

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: await getConfirmationRedirect() },
  });
  if (error) return fail("We could not send it again yet. Wait a moment and try again.");

  return { ok: true, data: undefined };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
