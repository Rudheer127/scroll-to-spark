import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { getGroups } from "@/features/groups/queries";
import { TaskForm } from "@/features/steps/components/task-form";

export default async function NewTaskPage() {
  const groups = (await getGroups()).filter((group) => group.isOwner);
  if (groups.length === 0) redirect("/portal");

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[{ label: "Partner portal", href: "/portal" }, { label: "Post a task" }]}
      />
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Post a small task</h1>
        <p className="text-muted">Small and clear beats big and vague.</p>
      </header>
      <TaskForm groups={groups.map(({ id, name }) => ({ id, name }))} />
    </div>
  );
}
