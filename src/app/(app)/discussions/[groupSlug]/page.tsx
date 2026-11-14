import { notFound } from "next/navigation";
import { GroupHeader } from "@/features/groups/components/group-header";
import { getGroupBySlug } from "@/features/groups/queries";

export default async function GroupPage({ params }: PageProps<"/discussions/[groupSlug]">) {
  const { groupSlug } = await params;
  const group = await getGroupBySlug(groupSlug);
  if (!group) notFound();

  return (
    <div className="flex flex-col gap-6">
      <GroupHeader group={group} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="flex flex-col gap-2 rounded-(--radius-card) border border-border bg-surface p-6">
          <h2 className="text-lg font-bold">No threads yet</h2>
          <p className="text-muted">Posting threads is the next thing being built.</p>
        </section>
        <aside className="flex flex-col gap-2 rounded-(--radius-card) border border-border bg-surface p-6">
          <h2 className="text-lg font-bold">About this group</h2>
          <p className="text-muted">{group.description ?? "No description yet."}</p>
        </aside>
      </div>
    </div>
  );
}
