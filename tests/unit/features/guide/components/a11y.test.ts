import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/guide/actions", () => ({ sendGuideMessage: vi.fn() }));

import { GuideChat } from "@/features/guide/components/guide-chat";
import { MessageBubblePending } from "@/features/guide/components/message-bubble";

describe("guide chat accessibility (minor g)", () => {
  it("ties the disabled Send button to the reason it is disabled", () => {
    const html = renderToStaticMarkup(createElement(GuideChat, { variant: "page", inputId: "f" }));
    const button = html.match(/<button[^>]*type="submit"[^>]*>/)?.[0] ?? "";
    expect(button).toContain("disabled");
    const describedBy = button.match(/aria-describedby="([^"]+)"/)?.[1];
    expect(describedBy).toBeTruthy();
    const reason = new RegExp(`<p[^>]*id="${describedBy}"[^>]*>Write a message to send it.</p>`);
    expect(html).toMatch(reason);
  });

  it("the pending placeholder announces that the guide is thinking", () => {
    const html = renderToStaticMarkup(createElement(MessageBubblePending));
    expect(html).toMatch(/<span class="sr-only">The guide is thinking<\/span>/);
  });
});
