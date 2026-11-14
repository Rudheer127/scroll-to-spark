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
    <div className="flex max-w-3xl flex-col gap-6">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Your step" }]} />
      <header className="flex flex-col gap-3 rounded-(--radius-card) bg-coral p-7 text-white shadow-card">
        <p className="w-fit rounded-full bg-white/25 px-3 py-1 text-sm font-bold">
          For {task.groupName}
        </p>
        <h1 className="text-4xl font-bold">{task.title}</h1>
        {task.description ? <p className="text-lg">{task.description}</p> : null}
        <div className="text-white [&_*]:text-white">
          <TaskMeta task={task} />
        </div>
      </header>
      <div className="rounded-(--radius-card) border border-border bg-surface p-6 shadow-card">
        <CompleteTaskForm taskId={task.id} />
      </div>
    </div>
  );
}
