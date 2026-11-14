import { runGuideTurn } from "@/features/guide/pipeline";
import { fakeSupabase, type FakeDbOptions, type Insert } from "./fake-db";
import { FakeLlm } from "./fake-llm";

type Script = ConstructorParameters<typeof FakeLlm>[0];
type DbOpts = Partial<Omit<FakeDbOptions, "label" | "log">>;

export function setup(script: Script, dbOpts: DbOpts = {}) {
  const log: Insert[] = [];
  const llm = new FakeLlm(script);
  const db = fakeSupabase({ label: "db", log, ...dbOpts });
  const admin = fakeSupabase({ label: "admin", log });
  const run = (message: string) =>
    runGuideTurn({
      userId: "u1",
      message,
      db: db.client,
      admin: admin.client,
      llm,
      today: "2026-11-14",
    });
  const events = () => log.filter((i) => i.table === "guide_events").map((i) => String(i.row.kind));
  return { run, llm, log, db, admin, events };
}
