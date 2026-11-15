export type Rotation = 0 | 90 | 180 | 270;

/** What the person has done to the picture. Offsets are fractions of the crop square, so any size can redraw it. */
export type CropState = { zoom: number; rotation: Rotation; x: number; y: number };

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const INITIAL_CROP: CropState = { zoom: 1, rotation: 0, x: 0, y: 0 };

/** The picture's size once it is turned, in the same units as its width and height. */
function turnedSize(width: number, height: number, rotation: Rotation) {
  return rotation % 180 === 0 ? { w: width, h: height } : { w: height, h: width };
}

/** Pixels per picture pixel so the picture just covers a square of `size` at zoom 1. */
export function coverScale(width: number, height: number, rotation: Rotation, size: number) {
  const turned = turnedSize(width, height, rotation);
  return size / Math.min(turned.w, turned.h);
}

/** Keeps the picture covering the whole square, so no empty corner can end up in the photo. */
export function clampCrop(crop: CropState, width: number, height: number): CropState {
  const turned = turnedSize(width, height, crop.rotation);
  const shortSide = Math.min(turned.w, turned.h);
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, crop.zoom));
  // How far the picture is wider or taller than the square, as a fraction of the square.
  const spreadX = (turned.w / shortSide) * zoom;
  const spreadY = (turned.h / shortSide) * zoom;
  const limitX = Math.max(0, (spreadX - 1) / 2);
  const limitY = Math.max(0, (spreadY - 1) / 2);
  return {
    zoom,
    rotation: crop.rotation,
    // `+ 0` turns a stray -0 into 0.
    x: Math.min(limitX, Math.max(-limitX, crop.x)) + 0,
    y: Math.min(limitY, Math.max(-limitY, crop.y)) + 0,
  };
}

/** Draws the cropped square onto a canvas context. The preview, the editor and the saved file all use this. */
export function drawCrop(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  width: number,
  height: number,
  crop: CropState,
  size: number,
) {
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size, size);
  context.save();
  context.translate(size / 2 + crop.x * size, size / 2 + crop.y * size);
  context.rotate((crop.rotation * Math.PI) / 180);
  const scale = coverScale(width, height, crop.rotation, size) * crop.zoom;
  context.scale(scale, scale);
  context.drawImage(image, -width / 2, -height / 2, width, height);
  context.restore();
}
