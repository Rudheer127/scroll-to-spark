import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button-link";
import { getTask } from "@/features/steps/queries";

export default async function StepDonePage({ params }: PageProps<"/steps/[taskId]/done">) {
  const { taskId } = await params;
  const task = await getTask(taskId);
  if (!task) notFound();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">You did it. Thank you.</h1>
        <p className="text-lg">
          Your note is on its way to {task.groupName}. A real person from the group promises to
          reply within {task.replyWithinHours} hours, and the reply will show up under My steps.
        </p>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink href="/" variant="brand">
          See another step
        </ButtonLink>
        <ButtonLink href={`/discussions/${task.groupSlug}`} variant="outline">
          Visit {task.groupName}
        </ButtonLink>
      </div>
    </div>
  );
}
