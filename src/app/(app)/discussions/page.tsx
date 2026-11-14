import { getCurrentProfile } from "@/features/auth/queries";
import { CreateGroupDialog } from "@/features/groups/components/create-group-dialog";
import { DiscoverRow } from "@/features/groups/components/discover-row";
import { GroupAvatar } from "@/features/groups/components/group-avatar";
import { GroupStory } from "@/features/groups/components/group-story";
import { getGroups } from "@/features/groups/queries";
import { FeedTabs } from "@/features/threads/components/feed-tabs";
import { ThreadCard } from "@/features/threads/components/thread-card";
import { getFeed, isFeedTab } from "@/features/threads/queries";

export default async function DiscussionsPage({ searchParams }: PageProps<"/discussions">) {
  const { tab: tabParam } = await searchParams;
  const tab = isFeedTab(tabParam) ? tabParam : "trending";

  const [profile, groups] = await Promise.all([getCurrentProfile(), getGroups()]);
  const mine = groups.filter((group) => group.isMember || group.isOwner);
  const mineIds = new Set(mine.map((group) => group.id));
  const feed = await getFeed(tab, mineIds);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="flex min-w-0 flex-col gap-6">
        <header className="flex items-start gap-4">
          <div className="flex flex-1 flex-col gap-1">
            <h1 className="text-4xl font-bold">Discussions</h1>
            <p className="text-lg text-muted">
              Talk it out with people who care about the same things.
            </p>
          </div>
          <CreateGroupDialog />
        </header>
        {mine.length > 0 ? (
          <section aria-label="Your groups" className="flex gap-4 overflow-x-auto pb-1">
            {mine.map((group) => (
              <GroupStory key={group.id} name={group.name} slug={group.slug} color={group.color} />
            ))}
          </section>
        ) : null}
        <FeedTabs current={tab} />
        {feed.length === 0 ? (
          <p className="rounded-(--radius-card) border border-border bg-surface p-6 text-muted shadow-card">
            {tab === "following"
              ? "Nothing here yet. Join a group on the right to see its threads."
              : "No threads yet. Open a group and start one."}
          </p>
        ) : (
          feed.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} canVote={mineIds.has(thread.groupId)} />
          ))
        )}
      </div>
      <aside className="flex h-fit flex-col gap-4 xl:sticky xl:top-8">
        {profile ? (
          <div className="flex items-center gap-3">
            <GroupAvatar name={profile.username} color="green" />
            <div className="flex flex-col">
              <p className="font-extrabold">{profile.username}</p>
              <p className="text-sm text-muted">
                {mine.length} {mine.length === 1 ? "group" : "groups"} joined
              </p>
            </div>
          </div>
        ) : null}
        <section className="flex flex-col gap-4 rounded-(--radius-card) border border-border bg-surface p-5 shadow-card">
          <h2 className="text-lg font-semibold">Discover groups</h2>
          {groups.length === 0 ? (
            <p className="text-sm text-muted">No groups yet. Create the first one.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {groups.map((group) => (
                <DiscoverRow key={group.id} group={group} />
              ))}
            </ul>
          )}
        </section>
        <section className="flex flex-col gap-2 rounded-(--radius-card) border border-border bg-surface p-5 shadow-card">
          <h2 className="text-base font-semibold">Community promise</h2>
          <p className="text-sm text-muted">
            Be kind. No guilt, no pressure. Share small wins. Every voice counts.
          </p>
        </section>
      </aside>
    </div>
  );
}
