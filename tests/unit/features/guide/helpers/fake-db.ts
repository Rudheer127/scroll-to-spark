import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type Insert = { client: string; table: string; row: Record<string, unknown> };

export type FakeDbOptions = {
  label: string;
  log: Insert[];
  tasks?: unknown[];
  contributions?: unknown[];
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
  const eqCalls: [string, unknown][] = [];
  const from = (table: string) => {
    if (opts.throwOnTable === table) throw new Error("secret db detail");
    tablesRead.push(table);
    let gte: string | null = null;
    let counting = false;
    const filters: Record<string, unknown> = {};
    const builder: Record<string, unknown> = {
      then: (resolve: (v: unknown) => unknown) => {
        if (counting) {
          const recent = gte !== null && Date.now() - new Date(gte).getTime() < 120_000;
          const seeded = recent ? (opts.minuteCount ?? 0) : (opts.dayCount ?? 0);
          const mine = filters.user_id !== undefined && filters.role === "user";
          const inserted = opts.log.filter(
            (i) =>
              i.table === "guide_messages" &&
              i.row.user_id === filters.user_id &&
              i.row.role === filters.role,
          ).length;
          return resolve({ count: mine ? seeded + inserted : 0, error: null });
        }
        const data = table === "contributions" ? opts.contributions : opts.tasks;
        return resolve({ data: data ?? [], error: null });
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
    builder.eq = (col: string, value: unknown) => {
      eqCalls.push([col, value]);
      filters[col] = value;
      return builder;
    };
    for (const m of ["in", "or", "order", "limit"]) builder[m] = () => builder;
    return builder;
  };
  return { client: { from } as unknown as SupabaseClient<Database>, tablesRead, eqCalls };
}

export const contributionRow = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  user_id: "u1",
  title: `Did ${id}`,
  description: null,
  minutes: 60,
  occurred_on: "2026-11-01",
  verification: "self_reported",
  created_at: "2026-11-01T00:00:00Z",
  ...over,
});
