/**
 * Pure rules for the collapsible sidebar. Pinned open or collapsed is remembered on the device
 * (localStorage plus a data attribute on <html> set before first paint). While collapsed, hovering
 * the rail or moving keyboard focus into it opens it as an overlay after a short delay, and it
 * closes shortly after the pointer and focus leave.
 */

export const SIDEBAR_STORAGE_KEY = "sidebar";
export const SIDEBAR_COLLAPSED = "collapsed";
/** Wait this long before opening, so a pointer passing by does not flicker the rail. */
export const HOVER_OPEN_DELAY_MS = 120;
/** Wait this long before closing, so a pointer that slips off for a moment does not close it. */
export const HOVER_CLOSE_DELAY_MS = 200;

export type HoverState = {
  hovered: boolean;
  /** Keyboard focus is inside the rail. */
  focused: boolean;
  /** The overlay is showing. */
  open: boolean;
  /**
   * Set right after collapsing with the pointer still on the rail, so it does not reopen under
   * the pointer. Cleared when the pointer leaves.
   */
  suppressed: boolean;
};

export type HoverAction =
  | { type: "pointer-enter" }
  | { type: "pointer-leave" }
  | { type: "focus-in" }
  | { type: "focus-out" }
  | { type: "open-now" }
  | { type: "collapse" }
  | { type: "pin" }
  | { type: "timer"; collapsed: boolean };

export const INITIAL_HOVER: HoverState = {
  hovered: false,
  focused: false,
  open: false,
  suppressed: false,
};

export function wantsOpen(state: HoverState, collapsed: boolean): boolean {
  return collapsed && !state.suppressed && (state.hovered || state.focused);
}

export function hoverReducer(state: HoverState, action: HoverAction): HoverState {
  switch (action.type) {
    case "pointer-enter":
      return state.suppressed ? state : { ...state, hovered: true };
    case "pointer-leave":
      return { ...state, hovered: false, suppressed: false };
    case "focus-in":
      return { ...state, focused: true };
    case "focus-out":
      return { ...state, focused: false };
    case "open-now":
      return { ...state, hovered: true, suppressed: false, open: true };
    case "collapse":
      return { hovered: false, focused: false, open: false, suppressed: true };
    case "pin":
      return { ...state, open: false, suppressed: false };
    case "timer":
      return { ...state, open: wantsOpen(state, action.collapsed) };
  }
}

/** How long to wait before the next "timer" action, or null when nothing is about to change. */
export function pendingDelay(state: HoverState, collapsed: boolean): number | null {
  const want = wantsOpen(state, collapsed);
  if (want && !state.open) return state.focused && !state.hovered ? 0 : HOVER_OPEN_DELAY_MS;
  if (!want && state.open) return HOVER_CLOSE_DELAY_MS;
  return null;
}

/** The rail floats over the page, at full width, with a shadow. */
export function isOverlay(state: HoverState, collapsed: boolean): boolean {
  return collapsed && state.open;
}

/** Labels, the chat list and the account name are shown. */
export function showsLabels(state: HoverState, collapsed: boolean): boolean {
  return !collapsed || state.open;
}
