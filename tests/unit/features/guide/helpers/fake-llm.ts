import type { LlmClient, LlmFailure, LlmRequest, LlmResult } from "@/features/guide/llm/types";

type Reply = LlmResult | ((req: LlmRequest) => LlmResult);

/** Scripted client. Replies are chosen by schemaName and consumed in order; the last one repeats. */
export class FakeLlm implements LlmClient {
  calls: LlmRequest[] = [];
  private used = new Map<string, number>();

  constructor(
    private script: Record<string, Reply[]>,
    private log: { client: string; table: string; row: Record<string, unknown> }[] = [],
  ) {}

  async complete(req: LlmRequest): Promise<LlmResult> {
    this.calls.push(req);
    this.log.push({ client: "llm", table: "complete", row: {} });
    const list = this.script[req.schemaName] ?? [];
    const n = this.used.get(req.schemaName) ?? 0;
    this.used.set(req.schemaName, n + 1);
    const reply = list[Math.min(n, list.length - 1)];
    if (!reply) return { ok: false, reason: "provider_error" };
    return typeof reply === "function" ? reply(req) : reply;
  }

  callsFor(schemaName: string): LlmRequest[] {
    return this.calls.filter((c) => c.schemaName === schemaName);
  }
}

export const ok = (value: unknown): LlmResult => ({
  ok: true,
  text: JSON.stringify(value),
  provider: "cerebras",
  model: "m",
});

export const fail = (reason: LlmFailure = "provider_error"): LlmResult => ({ ok: false, reason });

export const guideReply = (over: Record<string, unknown> = {}): LlmResult =>
  ok({
    intent: "out_of_scope",
    message: "Fine.",
    cards: [],
    proposed_contribution: null,
    verdict: null,
    next_step: null,
    ...over,
  });

export const routerReply = (intent: string, safety = "ok"): LlmResult => ok({ intent, safety });

export const filtersReply = (over: Record<string, unknown> = {}): LlmResult =>
  ok({ effort: null, remoteOnly: false, keyword: null, ...over });
