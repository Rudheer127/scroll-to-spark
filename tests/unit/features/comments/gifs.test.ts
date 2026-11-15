import { describe, expect, it } from "vitest";
import {
  altFromTitle,
  buildGiphyUrl,
  cleanGifQuery,
  createRateLimiter,
  GIF_QUERY_MAX,
  GIF_RESULT_LIMIT,
  isGiphyMediaUrl,
  shapeGiphyResponse,
} from "@/features/comments/gifs";
import { addCommentSchema } from "@/features/comments/schemas";

const MEDIA = "https://media2.giphy.com/media/abc/giphy.gif";
const gif = (id: string, url: unknown = MEDIA) => ({
  id,
  title: " Happy Dance GIF by Someone ",
  images: {
    downsized: { url },
    fixed_width_small: { url: "https://media2.giphy.com/media/abc/100w.gif" },
  },
  extra: "ignored",
});
const UUID = "2f1c1c52-6d7e-4a53-9a4f-2a8d0a4b9c11";

describe("giphy url checks", () => {
  it("accepts only https giphy media hosts", () => {
    expect(isGiphyMediaUrl(MEDIA)).toBe(true);
    expect(isGiphyMediaUrl("https://i.giphy.com/x.gif")).toBe(true);
    expect(isGiphyMediaUrl("http://media.giphy.com/x.gif")).toBe(false);
    expect(isGiphyMediaUrl("https://giphy.com.evil.com/x.gif")).toBe(false);
    expect(isGiphyMediaUrl("https://evil.com/media.giphy.com/x.gif")).toBe(false);
    expect(isGiphyMediaUrl(42)).toBe(false);
  });
});

describe("query and url building", () => {
  it("trims and caps the search, and picks trending when empty", () => {
    expect(cleanGifQuery("  hello   world ")).toBe("hello world");
    expect(cleanGifQuery("x".repeat(500))).toHaveLength(GIF_QUERY_MAX);
    expect(cleanGifQuery(null)).toBe("");
    expect(buildGiphyUrl("", "K")).toContain("/trending?");
    const search = buildGiphyUrl("cats", "K");
    expect(search).toContain("/search?");
    expect(search).toContain("q=cats");
    expect(search).toContain(`limit=${GIF_RESULT_LIMIT}`);
    expect(search).toContain("rating=g");
  });
});

describe("shapeGiphyResponse", () => {
  it("keeps only id, title, preview and full url", () => {
    const [first] = shapeGiphyResponse({ data: [gif("1")] });
    expect(Object.keys(first).sort()).toEqual(["id", "previewUrl", "title", "url"]);
    expect(first.title).toBe("Happy Dance GIF by Someone");
  });
  it("drops malformed or off-host items and caps the list", () => {
    expect(
      shapeGiphyResponse({ data: [gif("1", "https://evil.com/a.gif"), { id: 3 }, null] }),
    ).toEqual([]);
    expect(shapeGiphyResponse(null)).toEqual([]);
    expect(shapeGiphyResponse({ data: "no" })).toEqual([]);
    const many = Array.from({ length: 40 }, (_, i) => gif(String(i)));
    expect(shapeGiphyResponse({ data: many })).toHaveLength(GIF_RESULT_LIMIT);
  });
});

describe("alt text", () => {
  it("prefills from the title without the GIF credit", () => {
    expect(altFromTitle("Happy Dance GIF by Someone")).toBe("Happy Dance");
    expect(altFromTitle("")).toBe("");
  });
  it("blocks a comment with a GIF and no description", () => {
    const base = {
      threadId: UUID,
      parentId: null,
      body: "",
      imagePath: null,
      gifUrl: MEDIA,
      imageAlt: null,
    };
    expect(addCommentSchema.safeParse(base).success).toBe(false);
    expect(addCommentSchema.safeParse({ ...base, imageAlt: "Dancing" }).success).toBe(true);
  });
  it("rejects non-giphy links and image plus GIF together", () => {
    const base = {
      threadId: UUID,
      parentId: null,
      body: "hi",
      imagePath: null,
      gifUrl: null,
      imageAlt: "x",
    };
    expect(addCommentSchema.safeParse({ ...base, gifUrl: "https://evil.com/a.gif" }).success).toBe(
      false,
    );
    expect(addCommentSchema.safeParse({ ...base, gifUrl: MEDIA, imagePath: "p.png" }).success).toBe(
      false,
    );
  });
});

describe("rate limiter", () => {
  it("allows max calls per window per user", () => {
    const allow = createRateLimiter(2, 1000);
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 1)).toBe(true);
    expect(allow("a", 2)).toBe(false);
    expect(allow("b", 2)).toBe(true);
    expect(allow("a", 1500)).toBe(true);
  });
});
