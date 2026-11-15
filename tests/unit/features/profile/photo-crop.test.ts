import { describe, expect, it } from "vitest";
import { clampCrop, coverScale, INITIAL_CROP, MAX_ZOOM } from "@/features/profile/photo-crop";

describe("photo crop", () => {
  it("scales a wide picture so its short side fills the square", () => {
    expect(coverScale(2000, 1000, 0, 500)).toBe(0.5);
  });

  it("swaps the sides when the picture is turned a quarter", () => {
    expect(coverScale(2000, 1000, 90, 500)).toBe(0.5);
    expect(coverScale(1000, 3000, 90, 500)).toBe(0.5);
  });

  it("will not let a square picture slide at zoom 1", () => {
    expect(clampCrop({ ...INITIAL_CROP, x: 0.4, y: -0.4 }, 800, 800)).toEqual(INITIAL_CROP);
  });

  it("lets a wide picture slide sideways but not up or down", () => {
    const crop = clampCrop({ ...INITIAL_CROP, x: 5, y: 5 }, 2000, 1000);
    expect(crop.x).toBe(0.5);
    expect(crop.y).toBe(0);
  });

  it("keeps the corners covered when zoomed in, and caps the zoom", () => {
    const crop = clampCrop({ zoom: 99, rotation: 0, x: -9, y: 9 }, 1000, 1000);
    expect(crop.zoom).toBe(MAX_ZOOM);
    expect(crop.x).toBe(-(MAX_ZOOM - 1) / 2);
    expect(crop.y).toBe((MAX_ZOOM - 1) / 2);
  });
});
