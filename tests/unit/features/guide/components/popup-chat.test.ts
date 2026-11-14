import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/guide/actions", () => ({ sendGuideMessage: vi.fn(), loadGuideChat: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
}));

import { GuideProvider } from "@/features/guide/components/guide-provider";
import { PopupChat } from "@/features/guide/components/popup-chat";

const html = renderToStaticMarkup(
  createElement(GuideProvider, { imageInputEnabled: false }, createElement(PopupChat)),
);
const header = html.slice(html.indexOf("<header"), html.indexOf('role="log"'));

describe("popup mini chat", () => {
  it("has a slim header with New chat, Expand as a link to /guide, and Close", () => {
    expect(header).toMatch(/<h2[^>]*>Spark Guide<\/h2>/);
    expect(header).toMatch(/<button[^>]*title="New chat"[^>]*aria-label="New chat"/);
    const expand = header.match(/<a [^>]*>/)?.[0] ?? "";
    expect(expand).toContain('href="/guide"');
    expect(expand).toContain('aria-label="Expand"');
    expect(expand).toMatch(/title="[^"]+"/);
    expect(header).toMatch(/<button[^>]*aria-label="Close Spark Guide"[^>]*title="Close"/);
  });

  it("puts the message area before the composer, then the short AI caption", () => {
    const log = html.indexOf('role="log"');
    const composer = html.indexOf("<form");
    const caption = html.indexOf("The Spark Guide is an AI. It can be wrong.");
    expect(log).toBeGreaterThan(0);
    expect(composer).toBeGreaterThan(log);
    expect(caption).toBeGreaterThan(composer);
  });

  it("shows a compact, top aligned welcome with four stacked starters", () => {
    expect(html).toMatch(/<h3[^>]*>What can we do today\?<\/h3>/);
    const list = html.match(/<ul aria-label="Ways to start" class="([^"]*)"[^>]*>(.*?)<\/ul>/);
    expect(list?.[1]).toContain("flex-col");
    expect(list?.[2].match(/<button/g)).toHaveLength(4);
    expect(html).not.toContain("justify-center-safe");
  });

  it("has no full page link text and no maximised window", () => {
    expect(html).not.toContain("Open the full page");
    // The only dialog is the New chat confirmation, never a maximised modal window.
    expect(html.match(/<dialog/g)).toHaveLength(1);
    expect(html).not.toContain('aria-modal="true"');
    expect(html).not.toContain("Minimize");
  });
});
