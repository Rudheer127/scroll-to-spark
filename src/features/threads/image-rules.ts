export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_ALT_MAX = 200;
export const IMAGE_BUCKET = "comment-images";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const IMAGE_ACCEPT = Object.keys(EXTENSIONS).join(",");

export function imageExtension(type: string): string | null {
  return EXTENSIONS[type] ?? null;
}

/** A plain-words problem with the chosen file, or null when it is fine to upload. */
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!imageExtension(file.type)) return "Use a JPEG, PNG or WebP image.";
  if (file.size > IMAGE_MAX_BYTES) return "That image is over 5 MB. Choose a smaller one.";
  if (file.size === 0) return "That file is empty.";
  return null;
}

/** Image paths are `<user id>/<file>`; a post may only point at the poster's own folder. */
export function isOwnImagePath(path: string, userId: string): boolean {
  return (
    path.startsWith(`${userId}/`) &&
    !path.includes("..") &&
    /^[0-9a-f-]{36}\/[\w.-]+\.(jpg|png|webp)$/.test(path)
  );
}
