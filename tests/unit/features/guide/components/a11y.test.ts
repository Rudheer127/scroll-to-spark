import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/guide/actions", () => ({ sendGuideMessage: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import { GuideChat } from "@/features/guide/components/guide-chat";
import { GuideProvider } from "@/features/guide/components/guide-provider";
import { GuideWindow } from "@/features/guide/components/guide-window";
import { MessageBubblePending } from "@/features/guide/components/message-bubble";

function render(child: React.ReactElement, imageInputEnabled = false): string {
  return renderToStaticMarkup(createElement(GuideProvider, { imageInputEnabled }, child));
}

const chat = (variant: "popup" | "window" | "page") =>
  createElement(GuideChat, { variant, inputId: "f" });

describe("guide chat accessibility (minor g)", () => {
  it("ties the disabled Send button to the reason it is disabled", () => {
    const html = render(chat("page"));
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

describe("guide composer", () => {
  it("shows a labeled text box with the placeholder in every view", () => {
    for (const variant of ["popup", "window", "page"] as const) {
      const html = render(chat(variant));
      expect(html).toMatch(/<label[^>]*for="f"[^>]*>Message the Spark Guide<\/label>/);
      expect(html).toMatch(
        /<textarea[^>]*placeholder="Tell me how you feel, what you did, or a claim to check"/,
      );
      expect(html).toMatch(/<textarea[^>]*maxLength="1000"/);
    }
  });

  it("offers the mood pills under Or start from how you feel in the empty state", () => {
    const html = render(chat("popup"));
    expect(html).toContain("Or start from how you feel");
    expect(html).not.toContain("How are you feeling?");
    for (const label of ["Overwhelmed", "Angry", "Sad", "Restless", "Ready for more"]) {
      expect(html).toContain(`>${label}</button>`);
    }
  });

  it("renders no mic where speech recognition is unknown, such as the server", () => {
    expect(render(chat("window"))).not.toContain("Start voice input");
  });

  it("renders the attach button and the image limits only when image input is on", () => {
    expect(render(chat("window"))).not.toContain("Attach an image");
    const on = render(chat("window"), true);
    expect(on).toContain("Attach an image");
    // The limits are on the button itself (name and tooltip), before anything is picked.
    expect(on).toMatch(/<button[^>]*aria-label="Attach an image. PNG, JPEG or WebP, up to 5 MB/);
    expect(on).toMatch(/<button[^>]*title="PNG, JPEG or WebP, up to 5 MB/);
  });
});

describe("maximised window", () => {
  it("is a labeled modal dialog with Minimize and Close", () => {
    const html = render(createElement(GuideWindow));
    const dialog = html.match(/<dialog[^>]*>/)?.[0] ?? "";
    expect(dialog).toContain('aria-modal="true"');
    const labelledBy = dialog.match(/aria-labelledby="([^"]+)"/)?.[1] ?? "missing";
    expect(html).toContain(`id="${labelledBy}"`);
    expect(html).toContain("Minimize");
    expect(html).toContain('aria-label="Close Spark Guide"');
    // The header carries only the name; the AI disclosure sits under the composer.
    expect(html).not.toContain(">AI</span>");
    expect(html).toContain("is an AI");
  });
});
