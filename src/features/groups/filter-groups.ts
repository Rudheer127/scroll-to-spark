import type { GroupSummary } from "@/features/groups/types";

/** Keep the groups whose name or description contains the search text, ignoring case. */
export function filterGroups(groups: GroupSummary[], query: string): GroupSummary[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return groups;
  return groups.filter(
    (group) =>
      group.name.toLowerCase().includes(needle) ||
      (group.description ?? "").toLowerCase().includes(needle),
  );
}
