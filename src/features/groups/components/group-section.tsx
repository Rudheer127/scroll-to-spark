import { GroupCard } from "@/features/groups/components/group-card";
import type { GroupSummary } from "@/features/groups/types";

type GroupSectionProps = { title: string; groups: GroupSummary[]; emptyText: string };

/** A titled grid of group cards that fills the available width, or a short message when empty. */
export function GroupSection({ title, groups, emptyText }: GroupSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {groups.length === 0 ? (
        <p className="text-muted">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-5">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </section>
  );
}
