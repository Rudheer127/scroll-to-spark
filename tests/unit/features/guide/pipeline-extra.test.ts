import { describe, expect, it } from "vitest";
import { RATE_PER_MINUTE } from "@/features/guide/constants";
import {
  NO_MATCH_MESSAGE,
  UNAVAILABLE_MESSAGE,
  CRISIS_MESSAGE,
  RATE_LIMIT_MESSAGE,
} from "@/features/guide/fallbacks";
import { fail, filtersReply, guideReply, routerReply } from "./helpers/fake-llm";
import { taskRow } from "./helpers/fake-db";
import { setup } from "./helpers/setup";

const chat = (message = "Hello, I'm an AI guide.") => ({
  router_output: [routerReply("chitchat")],
  guide_response: [guideReply({ intent: "chitchat", message })],
});

describe("runGuideTurn: more behavior", () => {
  it("a weak signal (fake_delimiter) is logged and the pipeline continues", async () => {
    const t = setup(chat());
    const res = await t.run("The council page has <system> tags, hello");
    expect(t.events()).toEqual(["injection_signal"]);
    expect(t.llm.callsFor("router_output")).toHaveLength(1);
    expect(res.source).toBe("ai");
  });

  it("a thrown tool error yields UNAVAILABLE_MESSAGE with no error text", async () => {
    const t = setup(
      {
        router_output: [routerReply("find_opportunity")],
        opportunity_filters: [filtersReply()],
        guide_response: [guideReply()],
      },
      { throwOnTable: "tasks" },
    );
    const res = await t.run("something small please");
    expect(res.response.message).toBe(UNAVAILABLE_MESSAGE);
    expect(JSON.stringify(res)).not.toContain("secret db detail");
  });

  it("writes the user row through db and the assistant row through admin", async () => {
    const t = setup(chat());
    await t.run("hello");
    const rows = t.log.filter((i) => i.table === "guide_messages");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      client: "db",
      row: { user_id: "u1", role: "user", content: "hello" },
    });
    expect(rows[1]).toMatchObject({
      client: "admin",
      row: { user_id: "u1", role: "assistant", intent: "chitchat" },
    });
  });

  it("a failed assistant row save never reaches the user", async () => {
    const t = setup(chat(), {}, { insertError: true });
    const res = await t.run("hello");
    expect(res.source).toBe("ai");
  });

  it("persists fallback answers too, but not empty or rate limited turns", async () => {
    const t = setup({ router_output: [fail()], guide_response: [fail()] });
    await t.run("hello");
    expect(t.log.filter((i) => i.table === "guide_messages")).toHaveLength(2);
    const limited = setup({}, { dayCount: 60 });
    await limited.run("hello");
    expect(limited.log.filter((i) => i.table === "guide_messages")).toHaveLength(0);
  });

  it("shows the model exactly system plus one user message, never history", async () => {
    const t = setup(chat());
    await t.run("hello");
    for (const call of t.llm.calls) {
      expect(call.messages.map((m) => m.role)).toEqual(["system", "user"]);
    }
    const handler = t.llm.callsFor("guide_response")[0].messages;
    expect(handler[1].content).toContain("<<DATA label=user_message");
  });

  it("router crisis flag returns CRISIS_MESSAGE without running a handler", async () => {
    const t = setup({ router_output: [routerReply("chitchat", "crisis")], guide_response: [] });
    const res = await t.run("everything feels pointless lately");
    expect(res.response.message).toBe(CRISIS_MESSAGE);
    expect(t.llm.callsFor("guide_response")).toHaveLength(0);
    expect(t.events()).toContain("crisis");
  });

  it("fact_check temporarily redirects without a handler call", async () => {
    for (const intent of ["fact_check"]) {
      const t = setup({ router_output: [routerReply(intent)] });
      const res = await t.run("I did something");
      expect(res.source).toBe("fallback");
      expect(t.llm.callsFor("guide_response")).toHaveLength(0);
    }
  });

  it("zero matching rows answers honestly without calling the model for the answer", async () => {
    const t = setup(
      {
        router_output: [routerReply("find_opportunity")],
        opportunity_filters: [filtersReply({ keyword: "zoo" })],
      },
      { tasks: [] },
    );
    const res = await t.run("anything about zoos?");
    expect(res.response.message).toBe(NO_MATCH_MESSAGE);
    expect(t.llm.callsFor("guide_response")).toHaveLength(0);
    expect(res.cards).toEqual([]);
  });

  it("a successful repair retry returns the model answer", async () => {
    const t = setup(
      {
        router_output: [routerReply("find_opportunity")],
        opportunity_filters: [filtersReply()],
        guide_response: [
          guideReply({ intent: "find_opportunity", message: "See https://x.org now" }),
          guideReply({ intent: "find_opportunity", message: "Try one small step." }),
        ],
      },
      { tasks: [taskRow("t1")] },
    );
    const res = await t.run("something small");
    expect(res.source).toBe("ai");
    expect(res.response.message).toBe("Try one small step.");
  });
});

describe("runGuideTurn: user row first (R18)", () => {
  it("inserts the user row through db before the first llm call", async () => {
    const t = setup(chat());
    await t.run("hello");
    const userInsert = t.log.findIndex(
      (i) => i.table === "guide_messages" && i.row.role === "user",
    );
    const firstLlm = t.log.findIndex((i) => i.client === "llm");
    expect(userInsert).toBeGreaterThanOrEqual(0);
    expect(userInsert).toBeLessThan(firstLlm);
    expect(t.log[userInsert].client).toBe("db");
    expect(t.log.filter((i) => i.row.role === "user")).toHaveLength(1);
  });

  it("fails closed when the user row insert errors: UNAVAILABLE, fallback, zero llm calls", async () => {
    const t = setup(chat(), { insertError: true });
    const res = await t.run("hello");
    expect(res.response.message).toBe(UNAVAILABLE_MESSAGE);
    expect(res.source).toBe("fallback");
    expect(t.llm.calls).toHaveLength(0);
    expect(JSON.stringify(t.log.filter((i) => i.table === "guide_events"))).not.toContain("hello");
  });

  it("crisis turns write the user row and the assistant row", async () => {
    const t = setup({});
    await t.run("I want to die");
    expect(t.log.filter((i) => i.table === "guide_messages").map((i) => i.row.role)).toEqual([
      "user",
      "assistant",
    ]);
  });

  it("of two concurrent turns at the edge of the cap, exactly one proceeds", async () => {
    const t = setup(chat(), { minuteCount: RATE_PER_MINUTE - 1, dayCount: RATE_PER_MINUTE - 1 });
    const results = await Promise.all([t.run("hello"), t.run("hello again")]);
    const limited = results.filter((r) => r.response.message === RATE_LIMIT_MESSAGE);
    expect(limited).toHaveLength(1);
    expect(t.llm.callsFor("router_output")).toHaveLength(1);
  });

  it("counts only this user's user-role rows", async () => {
    const t = setup(chat());
    await t.run("hello");
    expect(t.db.eqCalls).toEqual(
      expect.arrayContaining([
        ["user_id", "u1"],
        ["role", "user"],
      ]),
    );
  });
});
