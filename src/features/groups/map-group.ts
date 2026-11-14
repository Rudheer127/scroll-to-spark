import type { Tables } from "@/types/database";
import type { GroupSummary } from "@/features/groups/types";

/** The columns every group query asks for, including the member count. */
export const GROUP_COLUMNS =
  "id, slug, name, description, color, is_private, owner_id, group_members(count)";

export type GroupRow = Pick<
  Tables<"groups">,
  "id" | "slug" | "name" | "description" | "color" | "is_private" | "owner_id"
> & { group_members: { count: number }[] };

export function toGroupSummary(
  row: GroupRow,
  userId: string,
  memberGroupIds: Set<string>,
): GroupSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    color: row.color,
    isPrivate: row.is_private,
    memberCount: row.group_members[0]?.count ?? 0,
    isMember: memberGroupIds.has(row.id),
    isOwner: row.owner_id === userId,
  };
}
