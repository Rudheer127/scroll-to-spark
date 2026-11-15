import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NAV_ITEMS } from "@/components/layout/nav-items";

vi.mock("@/features/guide/actions", () => ({
  sendGuideMessage: vi.fn(),
  loadGuideChat: vi.fn(),
  deleteConversation: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/guide",
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
}));

import { AccountRow } from "@/components/layout/account-row";
import { SidebarPanel } from "@/components/layout/sidebar-panel";
import { GuideProvider } from "@/features/guide/components/guide-provider";
import { ChatHistoryList } from "@/features/guide/components/history/chat-history-list";
import { ChatHistorySection } from "@/features/guide/components/history/chat-history-section";

const CHATS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Find something small",
    updatedAt: "2026-11-14T10:00:00Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Check a claim",
    updatedAt: "2026-11-13T10:00:00Z",
  },
];

const signOut = async () => undefined;

function render(collapsed: boolean, chats = CHATS): string {
  const panel = createElement(SidebarPanel, {
    pathname: "/guide",
    collapsed,
    overlay: false,
    onToggle: () => undefined,
    onOpenChats: () => undefined,
    chats: createElement(ChatHistorySection, null, createElement(ChatHistoryList, { chats })),
    footer: createElement(AccountRow, { name: "rudy", signOut }),
  });
  return renderToStaticMarkup(createElement(GuideProvider, { imageInputEnabled: false }, panel));
}

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

describe("sidebar panel", () => {
  it("every nav link carries its name as aria-label and title, with the Guide icon", () => {
    const html = render(true);
    for (const name of ["Home", "My steps", "Discussions", "Guide", "Portal", "Settings"]) {
      expect(html).toMatch(new RegExp(`<a[^>]*aria-label="${name}"[^>]*title="${name}"`));
    }
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*aria-label="Guide"/);
    expect(html).toContain("lucide-sparkles");
  });

  it("collapsed: labels are marked so CSS hides them, and the rail has a chats icon", () => {
    const html = render(true);
    expect(html).toContain('data-state="collapsed"');
    expect(html.match(/<span data-sidebar-label="true" aria-hidden="true"/g)).toHaveLength(
      NAV_ITEMS.length,
    );
    expect(html).toMatch(/<div data-sidebar-collapsed-only[^>]*>.*?aria-label="Show chats"/);
    expect(html).toMatch(/<button[^>]*aria-label="Pin sidebar open"[^>]*title="Pin sidebar open"/);
    expect(css).toMatch(/\[data-sidebar-label\]\s*\{\s*opacity: 0;/);
    expect(css).toMatch(/\[data-sidebar-expanded-only\]\s*\{\s*display: none;/);
  });

  it("expanded: labels, the toggle to collapse, and the Chats section with its rows", () => {
    const html = render(false);
    expect(html).toContain('data-state="expanded"');
    expect(html).toMatch(/<button[^>]*aria-label="Collapse sidebar"/);
    expect(html).toMatch(/<h2[^>]*>Chats<\/h2>/);
    expect(html).toContain("New chat");
    expect(html).not.toContain("Chats are saved to your account.");
    expect(html).toContain(`href="/guide?chat=${CHATS[0].id}"`);
    expect(html).toContain('title="Find something small"');
    expect(html).toMatch(/aria-label="Delete chat: Check a claim"/);
  });

  it("shows the empty state when there are no chats", () => {
    expect(render(false, [])).toContain("No chats yet. Ask the guide something.");
  });

  it("the account row has the name, the theme switch and one account menu, with one sign out", () => {
    const html = render(false);
    expect(html).not.toMatch(/signed in/i);
    expect(html).toMatch(/<p data-sidebar-expanded-only="true" title="rudy"[^>]*>rudy<\/p>/);
    expect(html).toMatch(/<button[^>]*aria-label="Switch to dark mode"[^>]*title="Dark mode"/);
    expect(html).toMatch(/<button[^>]*aria-label="Account menu"/);
    // Sign out lives in the account menu only, not as a second icon button beside it.
    expect(html).not.toMatch(/aria-label="Sign out"/);
  });
});
