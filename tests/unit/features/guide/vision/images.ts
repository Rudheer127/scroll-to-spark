/** Tiny data URLs whose first bytes match real image headers. Test only. */
const pad = (bytes: number[]) => [...bytes, ...new Array(Math.max(0, 24 - bytes.length)).fill(0)];

const toUrl = (mime: string, bytes: number[]) =>
  `data:${mime};base64,${Buffer.from(pad(bytes)).toString("base64")}`;

export const PNG_HEAD = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
export const JPEG_HEAD = [0xff, 0xd8, 0xff, 0xe0];
export const WEBP_HEAD = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];

export const pngUrl = toUrl("image/png", PNG_HEAD);
export const jpegUrl = toUrl("image/jpeg", JPEG_HEAD);
export const webpUrl = toUrl("image/webp", WEBP_HEAD);
export const fakeJpegUrl = toUrl("image/jpeg", [0x3c, 0x73, 0x76, 0x67]);

export { toUrl };
