import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/guide/actions", () => ({ sendGuideMessage: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
}));

import { GuideChat } from "@/features/guide/components/guide-chat";
import { GuidePage } from "@/features/guide/components/guide-page";
import { GuideProvider } from "@/features/guide/components/guide-provider";

function render(child: React.ReactElement, imageInputEnabled = false): string {
  return renderToStaticMarkup(createElement(GuideProvider, { imageInputEnabled }, child));
}

const chat = () => createElement(GuideChat, { inputId: "f" });

describe("guide empty state", () => {
  it("shows the headline, the composer, and the four task pills", () => {
    const html = render(chat());
    expect(html).toContain('data-mode="empty"');
    expect(html).toMatch(/<h2[^>]*>What small thing can we do for your community today\?<\/h2>/);
    expect(html).toMatch(
      /<textarea[^>]*placeholder="Tell me how you feel, what you did, or a claim to check"/,
    );
    const tasks = html.match(/<ul aria-label="Ways to start"[^>]*>(.*?)<\/ul>/)?.[1] ?? "";
    expect(tasks.match(/<button/g)).toHaveLength(4);
    for (const label of [
      "Find something small to do",
      "Log something I did",
      "What have I done so far?",
      "Check a claim",
    ]) {
      expect(tasks).toContain(`</svg>${label}</button>`);
    }
    expect(html).not.toContain("Or start from how you feel");
  });

  it("drops the old greeting and labels", () => {
    const html = render(chat());
    expect(html).not.toContain("Hi, I am the Spark Guide");
    expect(html).not.toContain("Or start with");
    expect(html).not.toContain("How are you feeling?");
  });

  it("keeps the AI disclosure as a quiet caption, and the log ready for the first answer", () => {
    const html = render(chat());
    expect(html).toContain(
      "The Spark Guide is an AI. It can be wrong and never replaces a real person.",
    );
    expect(html).toMatch(/<div role="log" aria-live="polite" aria-label="Conversation"/);
  });
});

describe("guide composer card", () => {
  it("has a round send button named Send, off with a reason while empty", () => {
    const html = render(chat());
    const button = html.match(/<button[^>]*type="submit"[^>]*>.*?<\/button>/)?.[0] ?? "";
    expect(button).toContain('<span class="sr-only">Send</span>');
    expect(button).toContain("disabled");
    expect(button).toContain('title="Write a message to send it."');
    expect(button).toContain("rounded-full");
  });

  it("drops the permanent helper lines under the box", () => {
    const html = render(chat(), true);
    expect(html).not.toContain("Images: PNG");
    expect(html).not.toMatch(/<p[^>]*class="text-xs text-muted"[^>]*>Write a message/);
  });

  it("renders attach only when image input is on, and no mic without speech support", () => {
    expect(render(chat())).not.toContain("Attach an image");
    expect(render(chat(), true)).toContain("Attach an image");
    expect(render(chat(), true)).not.toContain("Start voice input");
  });
});

describe("guide page", () => {
  it("has a title row with only the name and New chat, and the AI disclosure stays under the composer", () => {
    const html = render(createElement(GuidePage, { requested: null, chat: null }));
    expect(html).toMatch(/<h1[^>]*>Spark Guide<\/h1>/);
    expect(html).toContain("New chat");
    expect(html).not.toContain(">AI</span>");
    expect(html).not.toContain("Find one small step, get thanked");
    expect(html).not.toContain("An AI helper.");
    expect(html).toContain("is an AI");
  });
});
