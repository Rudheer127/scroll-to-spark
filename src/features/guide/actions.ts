"use server";

import { fail, type ActionResult } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import { contributionInputSchemaFor } from "./schemas";
import { runAuthenticatedGuideTurn, SIGN_IN_MESSAGE, utcToday } from "./run-turn";
import type { GuideTurnResult } from "./types";

const MAX_MESSAGE_CHARS = 4000;

export async function sendGuideMessage(formData: FormData): Promise<ActionResult<GuideTurnResult>> {
  const message = formData.get("message");
  if (typeof message !== "string" || message.length > MAX_MESSAGE_CHARS) {
    return fail("Write a shorter message and try again.");
  }
  try {
    const turn = await runAuthenticatedGuideTurn(message);
    if (turn.status === 401) return fail(SIGN_IN_MESSAGE);
    // Rate-limited and unavailable turns carry a fixed, friendly answer, so they are shown as is.
    return { ok: true, data: turn.body };
  } catch {
    return fail("The guide could not answer right now. Try again in a minute.");
  }
}

/**
 * Saves a contribution the person confirmed. The proposal came from model text, so everything is
 * validated again. Only the granted columns are written, and verification is never sent, so the
 * database default 'self_reported' always applies.
 */
export async function confirmContribution(input: unknown): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(SIGN_IN_MESSAGE);

  const parsed = contributionInputSchemaFor(utcToday()).safeParse(input);
  if (!parsed.success) return fail("Check the details and try again.");

  const { title, description, minutes, occurred_on } = parsed.data;
  const { data, error } = await supabase
    .from("contributions")
    .insert({ user_id: user.id, title, description, minutes, occurred_on })
    .select("id")
    .single();
  if (error || !data) return fail("We could not save that. Try again.");
  return { ok: true, data: { id: data.id } };
}
