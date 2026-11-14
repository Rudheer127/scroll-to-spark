import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/guide/actions", () => ({ sendGuideMessage: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
}));

import { GuideChat } from "@/features/guide/components/guide-chat";
import { GuideProvider } from "@/features/guide/components/guide-provider";
import { MessageBubblePending } from "@/features/guide/components/message-bubble";
import { PopupChat } from "@/features/guide/components/popup-chat";

function render(child: React.ReactElement, imageInputEnabled = false): string {
  return renderToStaticMarkup(createElement(GuideProvider, { imageInputEnabled }, child));
}

const page = () => createElement(GuideChat, { inputId: "f" });
const popup = () => createElement(PopupChat);

describe("guide chat accessibility (minor g)", () => {
  it("ties the disabled Send button to the reason it is disabled", () => {
    const html = render(page());
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
    for (const [view, id] of [
      [page, "f"],
      [popup, "guide-input-popup"],
    ] as const) {
      const html = render(view());
      expect(html).toMatch(
        new RegExp(`<label[^>]*for="${id}"[^>]*>Message the Spark Guide</label>`),
      );
      expect(html).toMatch(
        /<textarea[^>]*placeholder="Tell me how you feel, what you did, or a claim to check"/,
      );
      expect(html).toMatch(/<textarea[^>]*maxLength="1000"/);
    }
  });

  it("leaves feelings to be typed: no mood pills in the empty state", () => {
    const html = render(popup());
    expect(html).not.toContain("Or start from how you feel");
    expect(html).not.toContain("How are you feeling?");
    for (const label of ["Overwhelmed", "Angry", "Sad", "Restless", "Ready for more"]) {
      expect(html).not.toContain(`>${label}</button>`);
    }
  });

  it("renders no mic where speech recognition is unknown, such as the server", () => {
    expect(render(page())).not.toContain("Start voice input");
  });

  it("renders the attach button and the image limits only when image input is on", () => {
    expect(render(page())).not.toContain("Attach an image");
    const on = render(page(), true);
    expect(on).toContain("Attach an image");
    // The limits are on the button itself (name and tooltip), before anything is picked.
    expect(on).toMatch(/<button[^>]*aria-label="Attach an image. PNG, JPEG or WebP, up to 5 MB/);
    expect(on).toMatch(/<button[^>]*title="PNG, JPEG or WebP, up to 5 MB/);
  });
});
