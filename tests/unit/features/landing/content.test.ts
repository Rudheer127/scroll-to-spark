import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ABOUT,
  CONTACT,
  FEATURES,
  FOOTER,
  HERO,
  HERO_EXAMPLES,
  MARQUEE_PHRASES,
  NAV_LINKS,
  PHOTOS,
  STEPS,
} from "@/features/landing/content";

const words = (text: string) => text.trim().split(/\s+/).length;
const sentences = (text: string) => text.split(/[.!?]+\s+/).filter(Boolean).length;
const allCopy = JSON.stringify([
  HERO,
  HERO_EXAMPLES,
  MARQUEE_PHRASES,
  STEPS,
  FEATURES,
  ABOUT,
  CONTACT,
  FOOTER,
  NAV_LINKS,
]);

describe("landing copy rules", () => {
  it("has no em or en dashes", () => {
    expect(allCopy).not.toMatch(new RegExp(`[${String.fromCharCode(0x2014, 0x2013)}]`));
  });

  it("keeps the headline to 8 words or fewer", () => {
    expect(words(HERO.headline)).toBeLessThanOrEqual(8);
  });

  it("has exactly 3 steps, each one sentence", () => {
    expect(STEPS).toHaveLength(3);
    for (const step of STEPS) expect(sentences(step.body)).toBe(1);
  });

  it("has at most 4 features with short titles and bodies of 20 words or fewer", () => {
    expect(FEATURES.length).toBeLessThanOrEqual(4);
    for (const feature of FEATURES) {
      expect(words(feature.title)).toBeLessThanOrEqual(3);
      expect(words(feature.body)).toBeLessThanOrEqual(20);
    }
  });

  it("keeps About to 3 sentences or fewer", () => {
    expect(sentences(ABOUT.body)).toBeLessThanOrEqual(3);
  });

  it("labels the Spark Guide feature as AI", () => {
    const guide = FEATURES.find((f) => f.icon === "guide");
    expect(guide && "badge" in guide ? guide.badge : null).toBe("AI");
  });

  it("makes no unsupported promises or statistics", () => {
    expect(allCopy).not.toMatch(/\d+\s?%|millions|change the world|guarantee|verified/i);
  });

  it("has unique nav section ids", () => {
    const ids = NAV_LINKS.map((link) => link.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("landing contact and photos", () => {
  it("uses the team's contact email", () => {
    expect(CONTACT.email).toBe("scrolltospark@gmail.com");
  });

  it("points every photo at a file that exists in public", () => {
    for (const src of [PHOTOS.hero, PHOTOS.about, PHOTOS.contact]) {
      expect(existsSync(join(process.cwd(), "public", src))).toBe(true);
    }
  });

  it("describes the photo that carries meaning", () => {
    expect(PHOTOS.aboutAlt.length).toBeGreaterThan(20);
  });
});
