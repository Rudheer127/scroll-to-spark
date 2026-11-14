import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/queries";
import { isEffort, type Effort } from "@/features/steps/constants";
import type {
  CompletionSummary,
  OwnedTask,
  TaskSummary,
  WaitingCompletion,
} from "@/features/steps/types";

type GroupEmbed = { name: string; slug: string; color: string; is_demo: boolean };

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  minutes: number;
  effort: string;
  place: string;
  reply_within_hours: number;
  group_id: string;
  groups: GroupEmbed;
};

const TASK_COLUMNS =
  "id, title, description, minutes, effort, place, reply_within_hours, group_id, groups(name, slug, color, is_demo)";

function toTask(row: TaskRow): TaskSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    minutes: row.minutes,
    effort: isEffort(row.effort) ? row.effort : "tiny",
    place: row.place as TaskSummary["place"],
    replyWithinHours: row.reply_within_hours,
    groupId: row.group_id,
    groupName: row.groups.name,
    groupSlug: row.groups.slug,
    groupColor: row.groups.color,
    groupIsDemo: row.groups.is_demo,
  };
}

async function getDoneTaskIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_completions")
    .select("task_id")
    .eq("user_id", userId);
  if (error) throw new Error(`Could not load your steps: ${error.message}`);
  return new Set(data.map((row) => row.task_id));
}

type NextTaskOptions = { effort?: Effort; skip?: string };

/** The first open task you can still do. Tasks from groups you own are left out. */
export async function getNextTask({
  effort,
  skip,
}: NextTaskOptions = {}): Promise<TaskSummary | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const [tasks, doneIds] = await Promise.all([
    supabase
      .from("tasks")
      .select(TASK_COLUMNS)
      .eq("is_open", true)
      .neq("created_by", user.id)
      .order("created_at", { ascending: false }),
    getDoneTaskIds(user.id),
  ]);
  if (tasks.error) throw new Error(`Could not load tasks: ${tasks.error.message}`);

  const rows = tasks.data as unknown as TaskRow[];
  const match = rows.find(
    (row) => !doneIds.has(row.id) && row.id !== skip && (!effort || row.effort === effort),
  );
  return match ? toTask(match) : null;
}

/** One task you can see, with the group it belongs to. */
export async function getTask(taskId: string): Promise<TaskSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .eq("id", taskId)
    .maybeSingle();
  if (error) throw new Error(`Could not load the task: ${error.message}`);
  return data ? toTask(data as unknown as TaskRow) : null;
}

type CompletionRow = {
  id: string;
  task_id: string;
  note: string | null;
  created_at: string;
  tasks: { title: string; groups: GroupEmbed };
  thank_yous: {
    kind: "tap" | "written";
    body: string | null;
    created_at: string;
    profiles: { username: string };
  } | null;
};

/** Everything you have done, newest first, with the reply if one has arrived. */
export async function getMyCompletions(): Promise<CompletionSummary[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_completions")
    .select(
      "id, task_id, note, created_at, tasks(title, groups(name, slug, color, is_demo)), thank_yous(kind, body, created_at, profiles!thank_yous_from_user_id_fkey(username))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load your steps: ${error.message}`);

  return (data as unknown as CompletionRow[]).map((row) => ({
    id: row.id,
    taskId: row.task_id,
    taskTitle: row.tasks.title,
    groupName: row.tasks.groups.name,
    groupSlug: row.tasks.groups.slug,
    groupColor: row.tasks.groups.color,
    groupIsDemo: row.tasks.groups.is_demo,
    note: row.note,
    createdAt: row.created_at,
    thankYou: row.thank_yous
      ? {
          kind: row.thank_yous.kind,
          body: row.thank_yous.body,
          fromName: row.tasks.groups.name,
          createdAt: row.thank_yous.created_at,
        }
      : null,
  }));
}

type WaitingRow = {
  id: string;
  note: string | null;
  created_at: string;
  user_id: string;
  tasks: { title: string; groups: { name: string } };
  profiles: { username: string };
  thank_yous: { id: string } | null;
};

/** Steps people did for groups you own that you have not replied to yet. */
export async function getWaitingCompletions(): Promise<WaitingCompletion[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_completions")
    .select(
      "id, note, created_at, user_id, tasks(title, groups(name)), profiles!task_completions_user_id_fkey(username), thank_yous(id)",
    )
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load replies to send: ${error.message}`);

  return (data as unknown as WaitingRow[])
    .filter((row) => row.user_id !== user.id && !row.thank_yous)
    .map((row) => ({
      id: row.id,
      taskTitle: row.tasks.title,
      groupName: row.tasks.groups.name,
      personName: row.profiles.username,
      note: row.note,
      createdAt: row.created_at,
    }));
}

type OwnedTaskRow = {
  id: string;
  title: string;
  minutes: number;
  effort: string;
  is_open: boolean;
  groups: { name: string };
  task_completions: { count: number }[];
};

/** The tasks you posted for your groups. */
export async function getOwnedTasks(): Promise<OwnedTask[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, minutes, effort, is_open, groups(name), task_completions(count)")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load your tasks: ${error.message}`);

  return (data as unknown as OwnedTaskRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    minutes: row.minutes,
    effort: isEffort(row.effort) ? row.effort : "tiny",
    isOpen: row.is_open,
    groupName: row.groups.name,
    completionCount: row.task_completions[0]?.count ?? 0,
  }));
}
