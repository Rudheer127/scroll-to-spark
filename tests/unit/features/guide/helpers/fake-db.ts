import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type Insert = { client: string; table: string; row: Record<string, unknown> };

export type FakeDbOptions = {
  label: string;
  log: Insert[];
  tasks?: unknown[];
  minuteCount?: number;
  dayCount?: number;
  throwOnTable?: string;
  insertError?: boolean;
};

export const taskRow = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  title: `Task ${id}`,
  description: "Help sort donations.",
  effort: "tiny",
  minutes: 10,
  place: "home",
  reply_within_hours: 48,
  groups: { name: "Org" },
  ...over,
});

/** The ONE place a fake query builder is cast to the typed client. */
export function fakeSupabase(opts: FakeDbOptions) {
  const tablesRead: string[] = [];
  const from = (table: string) => {
    if (opts.throwOnTable === table) throw new Error("secret db detail");
    tablesRead.push(table);
    let gte: string | null = null;
    let counting = false;
    const builder: Record<string, unknown> = {
      then: (resolve: (v: unknown) => unknown) => {
        if (counting) {
          const recent = gte !== null && Date.now() - new Date(gte).getTime() < 120_000;
          return resolve({
            count: recent ? (opts.minuteCount ?? 0) : (opts.dayCount ?? 0),
            error: null,
          });
        }
        return resolve({ data: opts.tasks ?? [], error: null });
      },
      select: (_cols: string, o?: { head?: boolean }) => {
        counting = o?.head === true;
        return builder;
      },
      gte: (_col: string, value: string) => {
        gte = value;
        return builder;
      },
      insert: (row: Record<string, unknown>) => {
        opts.log.push({ client: opts.label, table, row });
        const error = opts.insertError ? { message: "denied" } : null;
        return Promise.resolve({ data: null, error });
      },
    };
    for (const m of ["eq", "in", "or", "order", "limit"]) builder[m] = () => builder;
    return builder;
  };
  return { client: { from } as unknown as SupabaseClient<Database>, tablesRead };
}
