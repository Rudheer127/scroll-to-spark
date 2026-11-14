import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { GroupHeader } from "@/features/groups/components/group-header";
import { getGroupBySlug } from "@/features/groups/queries";
import { ThreadCard } from "@/features/threads/components/thread-card";
import { ThreadComposer } from "@/features/threads/components/thread-composer";
import { getThreads } from "@/features/threads/queries";

export default async function GroupPage({ params }: PageProps<"/discussions/[groupSlug]">) {
  const { groupSlug } = await params;
  const group = await getGroupBySlug(groupSlug);
  if (!group) notFound();

  const threads = await getThreads(group.id);
  const canParticipate = group.isMember || group.isOwner;

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb items={[{ label: "Discussions", href: "/discussions" }, { label: group.name }]} />
      <GroupHeader group={group} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="flex flex-col gap-4">
          {canParticipate ? (
            <ThreadComposer groupId={group.id} groupName={group.name} />
          ) : (
            <p className="rounded-(--radius-card) border border-border bg-surface p-5 text-muted">
              Join this group to start threads, vote and comment.
            </p>
          )}
          <h2 className="text-xl font-bold">Threads</h2>
          {threads.length === 0 ? (
            <p className="text-muted">No threads yet.</p>
          ) : (
            threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                groupSlug={group.slug}
                canVote={canParticipate}
              />
            ))
          )}
        </section>
        {group.description ? (
          <aside className="flex h-fit flex-col gap-2 rounded-(--radius-card) border border-border bg-surface p-6">
            <h2 className="text-lg font-bold">About this group</h2>
            <p className="text-muted">{group.description}</p>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
