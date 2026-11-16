import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/steps" }));

import { MobileNav } from "@/components/layout/mobile-nav";
import { isActive, NAV_ITEMS, TAB_BAR_ITEMS } from "@/components/layout/nav-items";

describe("nav items", () => {
  it("has one name per destination, shared by the sidebar and the tab bar", () => {
    const labels = NAV_ITEMS.map((item) => item.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toEqual([
      "Home",
      "My steps",
      "Discussions",
      "Events",
      "Inspire",
      "Officials",
      "Impact",
      "Guide",
      "Portal",
      "Settings",
    ]);
    for (const item of TAB_BAR_ITEMS) {
      expect(NAV_ITEMS.find((full) => full.href === item.href)?.label).toBe(item.label);
    }
  });

  it("keeps the tab bar to six columns, with Settings, Inspire and Officials in the sidebar only", () => {
    expect(TAB_BAR_ITEMS).toHaveLength(6);
    for (const href of ["/settings", "/inspire", "/officials", "/impact"]) {
      expect(TAB_BAR_ITEMS.some((item) => item.href === href)).toBe(false);
    }
  });

  it("only links to routes that exist", () => {
    const known = [
      "/",
      "/steps",
      "/discussions",
      "/events",
      "/inspire",
      "/officials",
      "/impact",
      "/guide",
      "/portal",
      "/settings",
    ];
    expect(NAV_ITEMS.map((item) => item.href)).toEqual(known);
  });

  it("marks the active destination, and Home only on the exact path", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/steps/abc", "/")).toBe(false);
    expect(isActive("/steps/abc", "/steps")).toBe(true);
  });

  it("renders a six-column bar with the shared labels and the current page marked", () => {
    const html = renderToStaticMarkup(createElement(MobileNav));
    expect(html).toContain("grid-cols-6");
    expect(html).not.toContain("grid-cols-5");
    for (const name of ["Home", "My steps", "Discussions", "Events", "Guide", "Portal"]) {
      expect(html).toContain(`>${name}</span>`);
    }
    expect(html).not.toContain(">Settings</span>");
    expect(html).toMatch(
      /<a[^>]*aria-current="page"[^>]*href="\/steps"|href="\/steps"[^>]*aria-current="page"/,
    );
  });
});
