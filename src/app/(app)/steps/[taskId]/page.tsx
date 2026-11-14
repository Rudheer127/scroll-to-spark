import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { CompleteTaskForm } from "@/features/steps/components/complete-task-form";
import { TaskMeta } from "@/features/steps/components/task-meta";
import { getTask } from "@/features/steps/queries";

export default async function StepPage({ params }: PageProps<"/steps/[taskId]">) {
  const { taskId } = await params;
  const task = await getTask(taskId);
  if (!task) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Your step" }]} />
      <header className="flex max-w-3xl flex-col gap-3">
        <p className="text-sm font-semibold text-muted">For {task.groupName}</p>
        <h1 className="text-3xl font-bold">{task.title}</h1>
        {task.description ? <p className="text-muted">{task.description}</p> : null}
        <TaskMeta task={task} />
      </header>
      <CompleteTaskForm taskId={task.id} />
    </div>
  );
}
