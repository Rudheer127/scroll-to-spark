import Link from "next/link";
import { GroupSection } from "@/features/groups/components/group-section";
import { getGroups } from "@/features/groups/queries";

const PREVIEW_COUNT = 6;

export default async function HomePage() {
  const groups = await getGroups();
  const mine = groups.filter((group) => group.isMember);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Home</h1>
        <p className="text-muted">Pick up where you left off.</p>
      </header>
      {mine.length === 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">Your groups</h2>
          <p className="text-muted">
            You have not joined a group yet.{" "}
            <Link href="/discussions" className="font-semibold text-action hover:underline">
              Find a group to join
            </Link>
          </p>
        </section>
      ) : (
        <>
          <GroupSection
            title="Your groups"
            groups={mine.slice(0, PREVIEW_COUNT)}
            emptyText="You have not joined a group yet."
          />
          <p>
            <Link href="/discussions" className="font-semibold text-action hover:underline">
              See all groups
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
