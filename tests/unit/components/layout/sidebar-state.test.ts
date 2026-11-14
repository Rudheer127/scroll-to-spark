import { describe, expect, it } from "vitest";
import {
  HOVER_CLOSE_DELAY_MS,
  HOVER_OPEN_DELAY_MS,
  hoverReducer,
  INITIAL_HOVER,
  isOverlay,
  pendingDelay,
  showsLabels,
  type HoverAction,
  type HoverState,
} from "@/components/layout/sidebar-state";

const run = (actions: HoverAction[], start: HoverState = INITIAL_HOVER) =>
  actions.reduce(hoverReducer, start);

describe("sidebar hover rules", () => {
  it("expanded: always shows labels, never floats, never schedules anything", () => {
    const hovered = run([{ type: "pointer-enter" }]);
    expect(showsLabels(hovered, false)).toBe(true);
    expect(isOverlay(hovered, false)).toBe(false);
    expect(pendingDelay(hovered, false)).toBeNull();
  });

  it("collapsed: shows icons only until hovered", () => {
    expect(showsLabels(INITIAL_HOVER, true)).toBe(false);
    expect(pendingDelay(INITIAL_HOVER, true)).toBeNull();
  });

  it("opens after the hover delay, as an overlay", () => {
    const hovered = run([{ type: "pointer-enter" }]);
    expect(hovered.open).toBe(false);
    expect(pendingDelay(hovered, true)).toBe(HOVER_OPEN_DELAY_MS);
    const open = hoverReducer(hovered, { type: "timer", collapsed: true });
    expect(isOverlay(open, true)).toBe(true);
    expect(showsLabels(open, true)).toBe(true);
  });

  it("a pointer passing by before the delay never opens it", () => {
    const passed = run([{ type: "pointer-enter" }, { type: "pointer-leave" }]);
    expect(pendingDelay(passed, true)).toBeNull();
    expect(hoverReducer(passed, { type: "timer", collapsed: true }).open).toBe(false);
  });

  it("closes after the close delay once the pointer leaves", () => {
    const open = run([
      { type: "pointer-enter" },
      { type: "timer", collapsed: true },
      { type: "pointer-leave" },
    ]);
    expect(open.open).toBe(true);
    expect(pendingDelay(open, true)).toBe(HOVER_CLOSE_DELAY_MS);
    expect(hoverReducer(open, { type: "timer", collapsed: true }).open).toBe(false);
  });

  it("keyboard focus opens it at once and keeps it open after the pointer leaves", () => {
    const focused = run([{ type: "focus-in" }]);
    expect(pendingDelay(focused, true)).toBe(0);
    const open = run([{ type: "timer", collapsed: true }, { type: "pointer-leave" }], focused);
    expect(open.open).toBe(true);
    expect(pendingDelay(open, true)).toBeNull();
    const left = hoverReducer(open, { type: "focus-out" });
    expect(pendingDelay(left, true)).toBe(HOVER_CLOSE_DELAY_MS);
  });

  it("does not reopen under the pointer right after collapsing", () => {
    const collapsed = run([
      { type: "pointer-enter" },
      { type: "collapse" },
      { type: "pointer-enter" },
    ]);
    expect(collapsed.hovered).toBe(false);
    expect(pendingDelay(collapsed, true)).toBeNull();
    const back = run([{ type: "pointer-leave" }, { type: "pointer-enter" }], collapsed);
    expect(pendingDelay(back, true)).toBe(HOVER_OPEN_DELAY_MS);
  });

  it("open-now opens immediately, and pin drops the overlay", () => {
    const open = run([{ type: "open-now" }]);
    expect(isOverlay(open, true)).toBe(true);
    const pinned = hoverReducer(open, { type: "pin" });
    expect(pinned.open).toBe(false);
    expect(showsLabels(pinned, false)).toBe(true);
  });
});
