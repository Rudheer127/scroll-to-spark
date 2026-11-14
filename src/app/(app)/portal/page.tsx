import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { OwnedTaskList } from "@/features/steps/components/owned-task-list";
import { WaitingList } from "@/features/steps/components/waiting-list";
import { getOwnedTasks, getWaitingCompletions } from "@/features/steps/queries";
import { getGroups } from "@/features/groups/queries";

export default async function PortalPage() {
  const [groups, waiting, tasks] = await Promise.all([
    getGroups(),
    getWaitingCompletions(),
    getOwnedTasks(),
  ]);
  const owned = groups.filter((group) => group.isOwner);

  if (owned.length === 0) {
    return (
      <div className="flex max-w-2xl flex-col gap-4">
        <h1 className="text-3xl font-bold">Partner portal</h1>
        <p className="text-muted">
          The portal is for people who run a group. Post small tasks, and send a real reply to
          everyone who does one.{" "}
          <Link href="/discussions" className="font-semibold text-action hover:underline">
            Create a group to get started
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex items-start gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="text-3xl font-bold">Partner portal</h1>
          <p className="text-muted">
            {waiting.length === 0
              ? "You are all caught up."
              : `${waiting.length} ${waiting.length === 1 ? "person is" : "people are"} waiting to hear from you.`}
          </p>
        </div>
        <ButtonLink href="/portal/tasks/new" variant="brand">
          Post a task
        </ButtonLink>
      </header>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Waiting for your reply</h2>
        <WaitingList items={waiting} />
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Your tasks</h2>
        <OwnedTaskList tasks={tasks} />
      </section>
    </div>
  );
}
