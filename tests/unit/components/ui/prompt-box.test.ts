import { createElement, createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Sprout } from "lucide-react";
import { PromptBox } from "@/components/ui/prompt-box";
import { PromptSendButton } from "@/components/ui/prompt-send-button";
import { SuggestionPills } from "@/components/ui/suggestion-pills";

function box(extra: Partial<React.ComponentProps<typeof PromptBox>> = {}): string {
  return renderToStaticMarkup(
    createElement(PromptBox, {
      label: "Message",
      textarea: { id: "t", value: "", ref: createRef<HTMLTextAreaElement>(), onChange: () => {} },
      send: createElement(PromptSendButton, { disabled: true }),
      ...extra,
    }),
  );
}

describe("PromptBox", () => {
  it("is a form with a labeled text box and the send button", () => {
    const html = box();
    expect(html).toMatch(/^<form/);
    expect(html).toMatch(/<label for="t" class="sr-only">Message<\/label>/);
    expect(html).toMatch(/<textarea[^>]*id="t"/);
    expect(html).toContain('<span class="sr-only">Send</span>');
  });

  it("renders the optional slots only when given", () => {
    expect(box()).not.toContain("tool-slot");
    const html = box({
      tools: createElement("span", null, "tool-slot"),
      meta: createElement("span", null, "meta-slot"),
      caption: createElement("span", null, "caption-slot"),
      attachments: createElement("span", null, "attachment-slot"),
    });
    for (const slot of ["tool-slot", "meta-slot", "caption-slot", "attachment-slot"]) {
      expect(html).toContain(slot);
    }
    expect(html.indexOf("attachment-slot")).toBeLessThan(html.indexOf("<textarea"));
    expect(html.indexOf("tool-slot")).toBeGreaterThan(html.indexOf("<textarea"));
  });

  it("marks the edge while highlighted", () => {
    expect(box({ highlighted: true })).toContain("border-action");
    expect(box()).not.toContain("border-action");
  });
});

describe("PromptSendButton", () => {
  it("is a submit button with a name, and shows busy while sending", () => {
    const idle = renderToStaticMarkup(createElement(PromptSendButton));
    expect(idle).toContain('type="submit"');
    expect(idle).not.toContain("aria-busy");
    const busy = renderToStaticMarkup(
      createElement(PromptSendButton, { busy: true, disabled: true }),
    );
    expect(busy).toContain('aria-busy="true"');
    expect(busy).toContain("animate-spin");
  });
});

describe("SuggestionPills", () => {
  it("renders one button per item with its icon and label", () => {
    const html = renderToStaticMarkup(
      createElement(SuggestionPills, {
        items: [
          { id: "a", label: "First", icon: Sprout },
          { id: "b", label: "Second" },
        ],
        onSelect: () => {},
        label: "Ideas",
      }),
    );
    expect(html).toMatch(/^<ul aria-label="Ideas"/);
    expect(html.match(/<button type="button"/g)).toHaveLength(2);
    expect(html).toContain("</svg>First</button>");
    expect(html).toMatch(/<button[^>]*>Second<\/button>/);
    expect(html).toContain("rounded-full");
  });
});
