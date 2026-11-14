import { CreateGroupDialog } from "@/features/groups/components/create-group-dialog";
import { GroupSearch } from "@/features/groups/components/group-search";
import { GroupSection } from "@/features/groups/components/group-section";
import { filterGroups } from "@/features/groups/filter-groups";
import { getGroups } from "@/features/groups/queries";

export default async function DiscussionsPage({ searchParams }: PageProps<"/discussions">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";

  const groups = filterGroups(await getGroups(), query);
  const mine = groups.filter((group) => group.isMember);
  const others = groups.filter((group) => !group.isMember);
  const searching = query.trim() !== "";

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-start gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-3xl font-bold">Discussions</h1>
          <p className="text-muted">Talk it out with people who care about the same things.</p>
        </div>
        <CreateGroupDialog />
      </header>
      <GroupSearch query={query} />
      <GroupSection
        title="Your groups"
        groups={mine}
        emptyText={
          searching
            ? "None of your groups match that search."
            : "You have not joined a group yet. Join one below, or create your own."
        }
      />
      <GroupSection
        title="Discover groups"
        groups={others}
        emptyText={
          searching
            ? "No other groups match that search."
            : "No other groups yet. Create the first one."
        }
      />
    </div>
  );
}
