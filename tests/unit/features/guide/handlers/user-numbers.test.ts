import { describe, expect, it } from "vitest";
import { timedNumbersIn } from "@/features/guide/handlers/user-numbers";

describe("timedNumbersIn", () => {
  it.each([
    ["I spent 3 hours", ["3"]],
    ["about 20 minutes, maybe 1.5 hrs", ["20", "1.5"]],
    ["45 min from home", ["45"]],
    ["10 mins", ["10"]],
    ["2 days and 1 week", ["2", "1"]],
    ["a 30-minute task", ["30"]],
    ["1 hr", ["1"]],
    ["hours: 4", ["4"]],
  ])("keeps numbers next to a time unit in %s", (text, expected) => {
    expect(timedNumbersIn(text)).toEqual(expected);
  });

  it.each([
    "83% of Gen Z volunteer weekly, so what can I do?",
    "I've helped 500 people",
    "Room 12 at 7pm",
    "minimum 5 people",
    "the 2024 report",
  ])("drops numbers without a time unit in %s", (text) => {
    expect(timedNumbersIn(text)).toEqual([]);
  });
});
