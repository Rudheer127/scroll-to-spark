import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MessageBubble, MessageBubblePending } from "@/features/guide/components/message-bubble";

const render = (node: React.ReactElement) => renderToStaticMarkup(node);

/** Builds a bubble with its text as a child argument, which is what the linter wants and the types allow. */
const bubble = (props: { role: "user" | "assistant"; label?: string }, text: string) =>
  createElement(MessageBubble, props as React.ComponentProps<typeof MessageBubble>, text);

describe("assistant message", () => {
  const html = render(bubble({ role: "assistant" }, "Here is one small step."));

  it("shows the eagle avatar, named for screen readers as an AI assistant", () => {
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Spark Guide, an AI assistant"');
    expect(html).toContain("spark-guide-mascot.png");
  });

  it("drifts gently, and only for people who allow motion", () => {
    expect(html).toContain("motion-safe:animate-float");
    expect(html).not.toMatch(/(^|[\s"])animate-float/);
  });

  it("no longer shows the AI chip or the visible app label", () => {
    expect(html).not.toContain(">AI</span>");
    expect(html).not.toContain(">From the app (AI)</span>");
    expect(html).toContain("Here is one small step.");
  });

  it("still tells screen readers the words are from the app, using the label it is given", () => {
    expect(html).toContain('<span class="sr-only">From the app (AI). </span>');
    const labelled = render(bubble({ role: "assistant", label: "From the app (AI)" }, "Thanks."));
    expect(labelled).toContain("From the app (AI). ");
    expect(labelled).toContain('class="sr-only"');
  });
});

describe("your message", () => {
  it("keeps the You label and has no avatar", () => {
    const html = render(bubble({ role: "user" }, "I picked up litter."));
    expect(html).toContain("You");
    expect(html).toContain("I picked up litter.");
    expect(html).not.toContain("spark-guide-mascot.png");
    expect(html).not.toContain('role="img"');
  });
});

describe("pending answer", () => {
  const html = render(createElement(MessageBubblePending));

  it("is marked busy, bobs faster, and says the guide is thinking to screen readers", () => {
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("motion-safe:animate-float-fast");
    expect(html).toContain("The guide is thinking");
    expect(html).not.toContain(">Thinking<");
    expect(html).not.toContain(">AI</span>");
  });
});
