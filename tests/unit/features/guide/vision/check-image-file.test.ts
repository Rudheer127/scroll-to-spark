import { describe, expect, it } from "vitest";
import { checkImageFile, scaledSize } from "@/features/guide/vision/check-image-file";
import { MAX_IMAGE_FILE_BYTES } from "@/features/guide/vision/constants";

describe("checkImageFile", () => {
  it("accepts png, jpeg and webp up to the limit", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      expect(checkImageFile({ type, size: MAX_IMAGE_FILE_BYTES })).toBeNull();
    }
  });

  it("explains a wrong type, an oversized file and an empty file", () => {
    expect(checkImageFile({ type: "image/gif", size: 10 })).toMatch(/PNG, JPEG or WebP/);
    expect(checkImageFile({ type: "application/pdf", size: 10 })).toMatch(/not supported/);
    expect(checkImageFile({ type: "image/png", size: MAX_IMAGE_FILE_BYTES + 1 })).toMatch(/5 MB/);
    expect(checkImageFile({ type: "image/png", size: 0 })).toMatch(/empty/);
  });
});

describe("scaledSize", () => {
  it("scales the longest side down and never up", () => {
    expect(scaledSize(4000, 3000, 1280)).toEqual({ width: 1280, height: 960 });
    expect(scaledSize(1000, 3000, 1280)).toEqual({ width: 427, height: 1280 });
    expect(scaledSize(800, 600, 1280)).toEqual({ width: 800, height: 600 });
    expect(scaledSize(10000, 1, 1280)).toEqual({ width: 1280, height: 1 });
  });
});
