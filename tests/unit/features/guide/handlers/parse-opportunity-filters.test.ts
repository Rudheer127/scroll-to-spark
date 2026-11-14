import { describe, expect, it } from "vitest";
import { parseOpportunityFilters } from "@/features/guide/handlers/parse-opportunity-filters";

describe("parseOpportunityFilters", () => {
  it("reads effort words", () => {
    expect(parseOpportunityFilters("something quick").effort).toBe("tiny");
    expect(parseOpportunityFilters("I have 5 min").effort).toBe("tiny");
    expect(parseOpportunityFilters("Find something small to do").effort).toBe("tiny");
    expect(parseOpportunityFilters("about half an hour").effort).toBe("medium");
    expect(parseOpportunityFilters("a medium task").effort).toBe("medium");
    expect(parseOpportunityFilters("I have a few hours").effort).toBe("big");
    expect(parseOpportunityFilters("something big this weekend").effort).toBe("big");
    expect(parseOpportunityFilters("food bank").effort).toBeNull();
  });

  it("reads remote words", () => {
    for (const text of ["from home", "remote please", "online only", "a virtual thing"]) {
      expect(parseOpportunityFilters(text).remoteOnly).toBe(true);
    }
    expect(parseOpportunityFilters("at the park").remoteOnly).toBe(false);
  });

  it("picks the most significant topic word, ignoring request words and numbers", () => {
    expect(parseOpportunityFilters("find me a quick food bank task").keyword).toBe("food");
    expect(parseOpportunityFilters("anything with animals or shelters?").keyword).toBe("shelters");
    expect(parseOpportunityFilters("Find something small to do").keyword).toBeNull();
    expect(parseOpportunityFilters("I'm feeling overwhelmed").keyword).toBeNull();
    expect(parseOpportunityFilters("I have 20 minutes").keyword).toBeNull();
  });

  it("returns empty filters for an empty message", () => {
    expect(parseOpportunityFilters("")).toEqual({ effort: null, remoteOnly: false, keyword: null });
  });
});
