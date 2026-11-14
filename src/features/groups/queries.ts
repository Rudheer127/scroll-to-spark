import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries";
import { GROUP_COLUMNS, toGroupSummary, type GroupRow } from "@/features/groups/map-group";
import type { GroupSummary } from "@/features/groups/types";

async function getMemberGroupIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);
  if (error) throw new Error(`Could not load memberships: ${error.message}`);
  return new Set(data.map((row) => row.group_id));
}

/** Every group the signed-in person is allowed to see, newest first. */
export async function getGroups(): Promise<GroupSummary[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const [groups, memberGroupIds] = await Promise.all([
    supabase.from("groups").select(GROUP_COLUMNS).order("created_at", { ascending: false }),
    getMemberGroupIds(user.id),
  ]);
  if (groups.error) throw new Error(`Could not load groups: ${groups.error.message}`);

  return (groups.data as unknown as GroupRow[]).map((row) =>
    toGroupSummary(row, user.id, memberGroupIds),
  );
}

/** One group by its address, or null when it does not exist or is not visible. */
export async function getGroupBySlug(slug: string): Promise<GroupSummary | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const [group, memberGroupIds] = await Promise.all([
    supabase.from("groups").select(GROUP_COLUMNS).eq("slug", slug).maybeSingle(),
    getMemberGroupIds(user.id),
  ]);
  if (group.error) throw new Error(`Could not load the group: ${group.error.message}`);
  if (!group.data) return null;

  return toGroupSummary(group.data as unknown as GroupRow, user.id, memberGroupIds);
}
