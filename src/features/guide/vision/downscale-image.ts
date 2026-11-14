import { scaledSize } from "./check-image-file";
import { IMAGE_JPEG_QUALITY, IMAGE_MAX_SIDE_PX } from "./constants";

/**
 * Shrinks an image in the browser and returns a JPEG data URL. Drawing to a canvas also drops
 * metadata such as location. Browser only.
 */
export async function downscaleImage(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const size = scaledSize(bitmap.width, bitmap.height, IMAGE_MAX_SIDE_PX);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available");
    // JPEG has no transparency, so a white base keeps see-through areas readable.
    context.fillStyle = "white";
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(bitmap, 0, 0, size.width, size.height);
    return canvas.toDataURL("image/jpeg", IMAGE_JPEG_QUALITY);
  } finally {
    bitmap.close();
  }
}
