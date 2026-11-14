import { describe, expect, it } from "vitest";
import { checkImageRequest } from "@/features/guide/vision/check-image-request";
import { fakeJpegUrl, jpegUrl } from "./images";

const on = () => true;
const off = () => false;

describe("checkImageRequest", () => {
  it("lets a text only request through without checking the setting", () => {
    expect(
      checkImageRequest(undefined, () => {
        throw new Error("must not be called");
      }),
    ).toEqual({ ok: true });
  });

  it("refuses an image when image reading is off", () => {
    const res = checkImageRequest(jpegUrl, off);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/not turned on/);
  });

  it("accepts a valid image and refuses a disguised one, in plain words", () => {
    expect(checkImageRequest(jpegUrl, on)).toEqual({ ok: true, dataUrl: jpegUrl });
    const res = checkImageRequest(fakeJpegUrl, on);
    expect(res).toMatchObject({ ok: false });
    if (!res.ok) expect(res.error).toMatch(/not the image type it claims/);
    expect(checkImageRequest("javascript:alert(1)", on)).toMatchObject({ ok: false });
  });
});
