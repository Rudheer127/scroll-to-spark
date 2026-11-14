import { CreateGroupDialog } from "@/features/groups/components/create-group-dialog";
import { GroupSection } from "@/features/groups/components/group-section";
import { getGroups } from "@/features/groups/queries";

export default async function DiscussionsPage() {
  const groups = await getGroups();
  const mine = groups.filter((group) => group.isMember);
  const others = groups.filter((group) => !group.isMember);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex items-start gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-3xl font-bold">Discussions</h1>
          <p className="text-muted">Talk it out with people who care about the same things.</p>
        </div>
        <CreateGroupDialog />
      </header>
      <GroupSection
        title="Your groups"
        groups={mine}
        emptyText="You have not joined a group yet. Join one below, or create your own."
      />
      <GroupSection
        title="Discover groups"
        groups={others}
        emptyText="No other groups yet. Create the first one."
      />
    </div>
  );
}
