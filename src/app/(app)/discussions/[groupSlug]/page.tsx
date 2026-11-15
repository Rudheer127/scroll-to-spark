import { getCurrentUser } from "@/features/auth/queries";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { DEFAULT_GROUP_RULES } from "@/features/groups/constants";
import { GroupHeader } from "@/features/groups/components/group-header";
import { getGroupBySlug } from "@/features/groups/queries";
import { ThreadCard } from "@/features/threads/components/thread-card";
import { ThreadComposer } from "@/features/threads/components/thread-composer";
import { getThreads } from "@/features/threads/queries";

export default async function GroupPage({ params }: PageProps<"/discussions/[groupSlug]">) {
  const { groupSlug } = await params;
  const group = await getGroupBySlug(groupSlug);
  if (!group) notFound();

  const [threads, user] = await Promise.all([getThreads(group.id), getCurrentUser()]);
  const canParticipate = group.isMember || group.isOwner;

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb items={[{ label: "Discussions", href: "/discussions" }, { label: group.name }]} />
      <GroupHeader group={group} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="flex min-w-0 flex-col gap-4">
          {canParticipate ? (
            <ThreadComposer groupId={group.id} groupName={group.name} rules={group.rules} />
          ) : (
            <p className="rounded-(--radius-card) shadow-card border border-border bg-surface p-5 text-muted">
              Join this group to start threads, vote and comment.
            </p>
          )}
          <h2 className="font-display text-2xl font-bold">Threads</h2>
          {threads.length === 0 ? (
            <p className="text-muted">No threads yet.</p>
          ) : (
            threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                canVote={canParticipate}
                viewerId={user?.id ?? ""}
              />
            ))
          )}
        </section>
        <aside className="flex h-fit min-w-0 flex-col gap-4 rounded-(--radius-card) shadow-card border border-border bg-surface p-6">
          {group.description ? (
            <section className="flex min-w-0 flex-col gap-2">
              <h2 className="font-display text-xl font-bold">About this group</h2>
              <p className="text-muted [overflow-wrap:anywhere]">{group.description}</p>
            </section>
          ) : null}
          <section className="flex min-w-0 flex-col gap-2">
            <h2 className="font-display text-xl font-bold">Group rules</h2>
            <p className="whitespace-pre-wrap text-muted [overflow-wrap:anywhere]">
              {group.rules ?? DEFAULT_GROUP_RULES}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
