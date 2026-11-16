import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries";
import { loose } from "@/features/threads/loose-db";
import type { RecentLookup } from "@/features/officials/types";

export const LOOKUPS_KEEP = 10;

/** The signed-in person's last lookups, newest first. Row-level security means only their own come back. */
export async function getRecentLookups(): Promise<RecentLookup[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = loose(await createClient());
  const { data } = await supabase
    .from("officials_lookups")
    .select("zip, city, state")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(LOOKUPS_KEEP);
  return (data ?? []) as RecentLookup[];
}
