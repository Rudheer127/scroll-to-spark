import { describe, expect, it } from "vitest";
import { MAX_IMAGE_DECODED_BYTES } from "@/features/guide/vision/constants";
import {
  checkImageDataUrl,
  decodedLength,
  sniffImageType,
} from "@/features/guide/vision/image-data-url";
import { JPEG_HEAD, fakeJpegUrl, jpegUrl, pngUrl, toUrl, webpUrl } from "./images";

describe("checkImageDataUrl", () => {
  it("accepts png, jpeg and webp whose bytes match the claimed type", () => {
    expect(checkImageDataUrl(pngUrl)).toMatchObject({ ok: true, mime: "image/png", bytes: 24 });
    expect(checkImageDataUrl(jpegUrl)).toMatchObject({ ok: true, mime: "image/jpeg" });
    expect(checkImageDataUrl(webpUrl)).toMatchObject({ ok: true, mime: "image/webp" });
  });

  it("rejects other types, other schemes and broken base64", () => {
    for (const bad of [
      "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
      "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
      "https://example.com/a.jpg",
      "data:image/jpeg,notbase64",
      "data:image/jpeg;base64,abc",
      "data:image/jpeg;base64,!!!!AAAAAAAAAAAAAAAAAAAA",
      `${jpegUrl}\n`,
      "",
    ]) {
      expect(checkImageDataUrl(bad)).toMatchObject({ ok: false, reason: "format" });
    }
  });

  it("rejects bytes that do not match the claimed type", () => {
    expect(checkImageDataUrl(fakeJpegUrl)).toEqual({ ok: false, reason: "mismatch" });
    const pngAsJpeg = pngUrl.replace("image/png", "image/jpeg");
    expect(checkImageDataUrl(pngAsJpeg)).toEqual({ ok: false, reason: "mismatch" });
  });

  it("rejects an image over the decoded size cap", () => {
    const big = [...JPEG_HEAD, ...new Array(MAX_IMAGE_DECODED_BYTES).fill(0)];
    expect(checkImageDataUrl(toUrl("image/jpeg", big))).toEqual({ ok: false, reason: "too_large" });
  });
});

describe("decodedLength and sniffImageType", () => {
  it("computes decoded bytes from base64 length and padding", () => {
    expect(decodedLength("AAAA")).toBe(3);
    expect(decodedLength("AAA=")).toBe(2);
    expect(decodedLength("AA==")).toBe(1);
  });

  it("returns null for unknown headers", () => {
    expect(sniffImageType(new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });
});
