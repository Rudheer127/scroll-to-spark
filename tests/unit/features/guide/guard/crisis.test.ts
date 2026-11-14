import { describe, expect, it } from "vitest";
import { detectCrisis } from "@/features/guide/guard/crisis";
import { sanitizeInput } from "@/features/guide/guard/sanitize-input";

const crisis = (raw: string) => detectCrisis(sanitizeInput(raw).text);

describe("detectCrisis: wider English phrasing", () => {
  it("catches the plan's own example phrase", () => {
    expect(crisis("I feel helpless and want to end it")).toBe(true);
  });

  it.each([
    "I want to end it",
    "I'm going to end it.",
    "I'm planning to end it tonight",
    "I am ready to end it",
    "I just want to end things",
    "I can't go on anymore",
    "I can’t go on any longer",
    "I cannot go on anymore",
    "I don't want to wake up tomorrow",
    "I do not want to wake up",
    "everyone would be better off without me",
    "there is no reason to live",
  ])("is true for %s", (text) => {
    expect(crisis(text)).toBe(true);
  });

  it.each([
    "I want to end it with the landlord and move on",
    "We are ready to end it for today, thanks",
    "Let's plan to end it on a good note",
    "I can't go on watching the news without doing something",
    "I want to end the meeting early and go volunteer",
    "I don't want to wake up early on Saturday for the cleanup",
    "the news makes me want to quit scrolling",
  ])("is false for %s", (text) => {
    expect(crisis(text)).toBe(false);
  });
});

describe("detectCrisis: other languages", () => {
  it.each([
    "quiero acabar con todo",
    "ya no puedo seguir",
    "no quiero despertar mañana",
    "estarían mejor sin mí",
    "我活不下去了",
    "我不想醒来",
    "मैं जीना नहीं चाहता",
  ])("is true for %s", (text) => {
    expect(crisis(text)).toBe(true);
  });

  it("is false for ordinary Spanish civic text", () => {
    expect(crisis("quiero ayudar en el banco de comida")).toBe(false);
  });
});
