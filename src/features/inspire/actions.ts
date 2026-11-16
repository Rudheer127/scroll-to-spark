"use server";

import { revalidatePath } from "next/cache";
import { fail, type ActionResult } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";
import { loose } from "@/features/threads/loose-db";
import { getFeedPage } from "@/features/inspire/queries";
import {
  feedRequestSchema,
  searchTermSchema,
  setSharingSchema,
  toggleSchema,
} from "@/features/inspire/schemas";
import type { FeedPage } from "@/features/inspire/types";

const UNIQUE_VIOLATION = "23505";
const SIGN_IN = "Please sign in to do that.";
const SEARCH_KEEP = 5;

async function currentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/** Turn sharing on or off for one of your own finished steps. The thank-you is shared only with the step. */
export async function setSharing(input: unknown): Promise<ActionResult> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return fail(SIGN_IN);
  const parsed = setSharingSchema.safeParse(input);
  if (!parsed.success) return fail("We could not change sharing for that step.");

  const { completionId, sharePublicly } = parsed.data;
  const { error } = await loose(supabase)
    .from("task_completions")
    .update({
      share_publicly: sharePublicly,
      share_thank_you: sharePublicly && parsed.data.shareThankYou,
    })
    .eq("id", completionId)
    .eq("user_id", userId);
  if (error) return fail("We could not change sharing. Try again.");

  revalidatePath("/inspire");
  revalidatePath("/steps");
  return { ok: true, data: undefined };
}

async function setMark(
  table: "inspiration_reactions" | "inspiration_saves",
  input: unknown,
  failure: string,
): Promise<ActionResult> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return fail(SIGN_IN);
  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) return fail(failure);

  const db = loose(supabase);
  const { error } = parsed.data.on
    ? await db.from(table).insert({ user_id: userId, completion_id: parsed.data.completionId })
    : await db
        .from(table)
        .delete()
        .eq("user_id", userId)
        .eq("completion_id", parsed.data.completionId);
  if (error && error.code !== UNIQUE_VIOLATION) return fail(failure);

  revalidatePath("/inspire");
  return { ok: true, data: undefined };
}

/** "This inspired me": once per person, and you can take it back. */
export async function setInspired(input: unknown): Promise<ActionResult> {
  return setMark("inspiration_reactions", input, "We could not save that. Try again.");
}

/** Save a post for later, or unsave it. */
export async function setSaved(input: unknown): Promise<ActionResult> {
  return setMark("inspiration_saves", input, "We could not save that post. Try again.");
}

/** The next page of the feed for the current filters. */
export async function loadMorePosts(input: unknown): Promise<ActionResult<FeedPage>> {
  const { userId } = await currentUserId();
  if (!userId) return fail(SIGN_IN);
  const parsed = feedRequestSchema.safeParse(input);
  if (!parsed.success) return fail("We could not load more posts.");
  try {
    return { ok: true, data: await getFeedPage(parsed.data.filters, parsed.data.cursor) };
  } catch {
    return fail("We could not load more posts. Try again.");
  }
}

/** Remembers a search as a chip. Searching the same words again moves them to the top. */
export async function rememberSearch(input: unknown): Promise<ActionResult<{ terms: string[] }>> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return fail(SIGN_IN);
  const parsed = searchTermSchema.safeParse(input);
  if (!parsed.success) return fail("That search cannot be saved.");

  const db = loose(supabase);
  const { error } = await db
    .from("search_history")
    .insert({ user_id: userId, scope: "inspire", term: parsed.data });
  if (error) {
    if (error.code !== UNIQUE_VIOLATION) return fail("We could not save that search.");
    await db
      .from("search_history")
      .update({ created_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("scope", "inspire")
      .eq("term", parsed.data);
  }

  const { data } = await db
    .from("search_history")
    .select("term")
    .eq("user_id", userId)
    .eq("scope", "inspire")
    .order("created_at", { ascending: false });
  const terms = ((data ?? []) as { term: string }[]).map((row) => row.term);
  const extra = terms.slice(SEARCH_KEEP);
  if (extra.length > 0) {
    await db
      .from("search_history")
      .delete()
      .eq("user_id", userId)
      .eq("scope", "inspire")
      .in("term", extra);
  }
  return { ok: true, data: { terms: terms.slice(0, SEARCH_KEEP) } };
}

/** Forgets one remembered search, or all of them when no term is given. Safe to repeat. */
export async function forgetSearches(term?: unknown): Promise<ActionResult> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return fail(SIGN_IN);
  let query = loose(supabase)
    .from("search_history")
    .delete()
    .eq("user_id", userId)
    .eq("scope", "inspire");
  if (term !== undefined) {
    const parsed = searchTermSchema.safeParse(term);
    if (!parsed.success) return fail("That search cannot be changed.");
    query = query.eq("term", parsed.data);
  }
  const { error } = await query;
  if (error) return fail("We could not forget that. Try again.");
  return { ok: true, data: undefined };
}
