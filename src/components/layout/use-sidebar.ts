"use client";

import { useEffect, useReducer, useSyncExternalStore } from "react";
import {
  hoverReducer,
  INITIAL_HOVER,
  isOverlay,
  pendingDelay,
  SIDEBAR_COLLAPSED,
  SIDEBAR_STORAGE_KEY,
} from "./sidebar-state";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-sidebar"],
  });
  return () => observer.disconnect();
}

const isCollapsedNow = () => document.documentElement.dataset.sidebar === SIDEBAR_COLLAPSED;

function remember(collapsed: boolean) {
  if (collapsed) document.documentElement.dataset.sidebar = SIDEBAR_COLLAPSED;
  else delete document.documentElement.dataset.sidebar;
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? SIDEBAR_COLLAPSED : "expanded");
  } catch {
    // Not remembered, but it still applies now.
  }
}

/**
 * The sidebar's state. Collapsed or pinned open lives on <html> (set before first paint by the
 * head script, so there is no flash) and in localStorage. Hover and focus open a collapsed rail
 * as an overlay after the delays in sidebar-state.
 */
export function useSidebar() {
  const collapsed = useSyncExternalStore(subscribe, isCollapsedNow, () => false);
  const [hover, dispatch] = useReducer(hoverReducer, INITIAL_HOVER);

  useEffect(() => {
    const delay = pendingDelay(hover, collapsed);
    if (delay === null) return;
    const timer = window.setTimeout(() => dispatch({ type: "timer", collapsed }), delay);
    return () => window.clearTimeout(timer);
  }, [hover, collapsed]);

  function toggle() {
    if (collapsed) {
      remember(false);
      dispatch({ type: "pin" });
    } else {
      remember(true);
      dispatch({ type: "collapse" });
    }
  }

  return { collapsed, overlay: isOverlay(hover, collapsed), dispatch, toggle };
}
