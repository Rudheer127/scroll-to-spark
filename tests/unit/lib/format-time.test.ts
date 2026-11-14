import { describe, expect, it } from "vitest";
import { formatMinutes, formatRelativeTime } from "@/lib/format-time";

const NOW = new Date("2026-11-14T12:00:00Z");

describe("formatRelativeTime", () => {
  it("says just now for the last minute", () => {
    expect(formatRelativeTime("2026-11-14T11:59:40Z", NOW)).toBe("just now");
  });

  it("uses minutes, hours and days with the right plural", () => {
    expect(formatRelativeTime("2026-11-14T11:59:00Z", NOW)).toBe("1 minute ago");
    expect(formatRelativeTime("2026-11-14T09:00:00Z", NOW)).toBe("3 hours ago");
    expect(formatRelativeTime("2026-11-12T12:00:00Z", NOW)).toBe("2 days ago");
  });

  it("falls back to a short date after a month", () => {
    expect(formatRelativeTime("2026-09-01T12:00:00Z", NOW)).toBe("Sep 1");
  });
});

describe("formatMinutes", () => {
  it("shows minutes under an hour and hours after", () => {
    expect(formatMinutes(5)).toBe("5 min");
    expect(formatMinutes(120)).toBe("2 hr");
    expect(formatMinutes(90)).toBe("1.5 hr");
  });
});
