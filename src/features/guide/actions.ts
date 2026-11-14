"use server";

import { fail, type ActionResult } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import { loadChatForCaller } from "./load-chat";
import { contributionInputSchemaFor, parseConversationId } from "./schemas";
import { runAuthenticatedGuideTurn, SIGN_IN_MESSAGE, utcToday } from "./run-turn";
import type { GuideTurnResult, LoadedChat } from "./types";

const MAX_MESSAGE_CHARS = 4000;

/**
 * Sends one message. An optional imageDataUrl gets the same strict checks as on the route, but
 * Next.js caps Server Action bodies at 1 MB, so the browser sends images through the route.
 */
export async function sendGuideMessage(formData: FormData): Promise<ActionResult<GuideTurnResult>> {
  const message = formData.get("message");
  if (typeof message !== "string" || message.length > MAX_MESSAGE_CHARS) {
    return fail("Write a shorter message and try again.");
  }
  const image = formData.get("imageDataUrl");
  if (image !== null && typeof image !== "string") return fail("That image could not be used.");
  try {
    const conversationId = formData.get("conversationId") ?? undefined;
    const turn = await runAuthenticatedGuideTurn(message, image ?? undefined, conversationId);
    if (turn.status === 401) return fail(SIGN_IN_MESSAGE);
    if (turn.status === 400) return fail(turn.body.error);
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

const CHAT_NOT_FOUND = "That chat could not be found.";

/**
 * Loads one saved chat of the signed-in person, so another view or another tab can continue it.
 * Ownership is checked by RLS through the user session client.
 */
export async function loadGuideChat(id: unknown): Promise<ActionResult<LoadedChat>> {
  try {
    const chat = await loadChatForCaller(id);
    return chat ? { ok: true, data: chat } : fail(CHAT_NOT_FOUND);
  } catch {
    return fail("The chat could not be loaded. Try again.");
  }
}

/**
 * Deletes one of the person's chats. Its messages go with it through the foreign key. RLS limits
 * the delete to their own chats, so another person's id deletes nothing and reads as not found.
 */
export async function deleteConversation(id: unknown): Promise<ActionResult> {
  const conversationId = parseConversationId(id);
  if (conversationId === undefined) return fail(CHAT_NOT_FOUND);
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail(SIGN_IN_MESSAGE);
    const { data, error } = await supabase
      .from("guide_conversations")
      .delete()
      .eq("id", conversationId)
      .select("id");
    if (error) return fail("The chat could not be deleted. Try again.");
    if (!data || data.length === 0) return fail(CHAT_NOT_FOUND);
    return { ok: true, data: undefined };
  } catch {
    return fail("The chat could not be deleted. Try again.");
  }
}
