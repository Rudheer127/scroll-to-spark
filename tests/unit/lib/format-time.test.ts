import { describe, expect, it } from "vitest";
import { formatMinutes, formatRelativeTime, formatShortRelativeTime } from "@/lib/format-time";

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

describe("formatShortRelativeTime", () => {
  it("uses short units", () => {
    expect(formatShortRelativeTime("2026-11-14T11:59:40Z", NOW)).toBe("now");
    expect(formatShortRelativeTime("2026-11-14T11:55:00Z", NOW)).toBe("5m ago");
    expect(formatShortRelativeTime("2026-11-14T10:00:00Z", NOW)).toBe("2h ago");
    expect(formatShortRelativeTime("2026-11-11T12:00:00Z", NOW)).toBe("3d ago");
  });

  it("falls back to a short date after a month, and never goes negative", () => {
    expect(formatShortRelativeTime("2026-09-01T12:00:00Z", NOW)).toBe("Sep 1");
    expect(formatShortRelativeTime("2026-11-14T12:05:00Z", NOW)).toBe("now");
  });
});
