import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/guide/actions", () => ({ sendGuideMessage: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import { GuideChat } from "@/features/guide/components/guide-chat";
import { GuidePage } from "@/features/guide/components/guide-page";
import { GuideProvider } from "@/features/guide/components/guide-provider";

function render(child: React.ReactElement, imageInputEnabled = false): string {
  return renderToStaticMarkup(createElement(GuideProvider, { imageInputEnabled }, child));
}

const chat = (variant: "popup" | "window" | "page") =>
  createElement(GuideChat, { variant, inputId: "f" });

describe("guide empty state", () => {
  it("shows the headline, the composer, the four task pills and the mood row", () => {
    const html = render(chat("page"));
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
    const leadId = html.match(/<p id="([^"]+)"[^>]*>Or start from how you feel<\/p>/)?.[1];
    expect(leadId).toBeTruthy();
    const moods = html.match(new RegExp(`<ul aria-labelledby="${leadId}"[^>]*>(.*?)</ul>`))?.[1];
    expect(moods?.match(/<button/g)).toHaveLength(5);
  });

  it("drops the old greeting and labels", () => {
    const html = render(chat("page"));
    expect(html).not.toContain("Hi, I am the Spark Guide");
    expect(html).not.toContain("Or start with");
    expect(html).not.toContain("How are you feeling?");
  });

  it("keeps the AI disclosure as a quiet caption, and the log ready for the first answer", () => {
    const html = render(chat("window"));
    expect(html).toContain(
      "The Spark Guide is an AI. It can be wrong and never replaces a real person.",
    );
    expect(html).toMatch(/<div role="log" aria-live="polite" aria-label="Conversation"/);
  });

  it("uses the short headline in the popup", () => {
    const html = render(chat("popup"));
    expect(html).toMatch(/<h3[^>]*>What can we do today\?<\/h3>/);
    expect(html).not.toContain("What small thing can we do");
  });
});

describe("guide composer card", () => {
  it("has a round send button named Send, off with a reason while empty", () => {
    const html = render(chat("page"));
    const button = html.match(/<button[^>]*type="submit"[^>]*>.*?<\/button>/)?.[0] ?? "";
    expect(button).toContain('<span class="sr-only">Send</span>');
    expect(button).toContain("disabled");
    expect(button).toContain('title="Write a message to send it."');
    expect(button).toContain("rounded-full");
  });

  it("drops the permanent helper lines under the box", () => {
    const html = render(chat("page"), true);
    expect(html).not.toContain("Images: PNG");
    expect(html).not.toMatch(/<p[^>]*class="text-xs text-muted"[^>]*>Write a message/);
  });

  it("renders attach only when image input is on, and no mic without speech support", () => {
    expect(render(chat("page"))).not.toContain("Attach an image");
    expect(render(chat("page"), true)).toContain("Attach an image");
    expect(render(chat("page"), true)).not.toContain("Start voice input");
  });
});

describe("guide page", () => {
  it("has a small title row with the AI chip, the subtitle and New chat", () => {
    const html = render(createElement(GuidePage));
    expect(html).toMatch(/<h1[^>]*>Spark Guide<\/h1>/);
    expect(html).toContain(">AI</span>");
    expect(html).toContain(
      "Find one small step, get thanked for what you already did, or check a claim.",
    );
    expect(html).toContain("New chat");
    expect(html).not.toContain("An AI helper.");
  });
});
