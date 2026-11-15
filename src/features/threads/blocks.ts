import { createClient } from "@/lib/supabase/server";
import { loose } from "@/features/threads/loose-db";

/** The people this person has blocked, with their names. */
export async function getBlockedUsers(userId: string): Promise<{ id: string; username: string }[]> {
  const supabase = loose(await createClient());
  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocked_id, profiles!user_blocks_blocked_id_fkey(username)")
    .eq("blocker_id", userId);
  if (error) return [];
  return (data as unknown as { blocked_id: string; profiles: { username: string } | null }[]).map(
    (row) => ({ id: row.blocked_id, username: row.profiles?.username ?? "someone" }),
  );
}

export async function getBlockedIds(userId: string): Promise<Set<string>> {
  return new Set((await getBlockedUsers(userId)).map((user) => user.id));
}
