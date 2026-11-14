import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { fakeSupabase, type FakeDbOptions, type Insert } from "./fake-db";
import { FakeLlm } from "./fake-llm";

type Script = ConstructorParameters<typeof FakeLlm>[0];
type DbOpts = Partial<Omit<FakeDbOptions, "label" | "log">>;

/** Shared by the actions and route tests. Holds what the mocked factories hand back. */
export const mocks = {
  user: null as { id: string } | null,
  db: null as SupabaseClient<Database> | null,
  admin: null as SupabaseClient<Database> | null,
  llm: null as FakeLlm | null,
  serviceCreated: 0,
  throwOnService: false,
};

/** Builds the user client (with an auth.getUser fake), admin client and llm for one test. */
export function arrange(opts: {
  user: { id: string } | null;
  script?: Script;
  db?: DbOpts;
  admin?: DbOpts;
}) {
  const log: Insert[] = [];
  const llm = new FakeLlm(opts.script ?? {}, log);
  const db = fakeSupabase({ label: "db", log, ...opts.db });
  const admin = fakeSupabase({ label: "admin", log, ...opts.admin });
  const getUser = vi.fn(async () => ({ data: { user: opts.user }, error: null }));
  // The one place the user client gains an auth fake.
  mocks.db = { ...db.client, auth: { getUser } } as unknown as SupabaseClient<Database>;
  mocks.admin = admin.client;
  mocks.llm = llm;
  mocks.user = opts.user;
  mocks.serviceCreated = 0;
  mocks.throwOnService = false;
  return { log, llm, getUser };
}
