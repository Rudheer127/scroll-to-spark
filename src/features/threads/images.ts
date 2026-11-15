import { IMAGE_BUCKET } from "@/features/threads/image-rules";
import { loose } from "@/features/threads/loose-db";

const ONE_HOUR = 60 * 60;

/** Signed links for private images, keyed by path. Paths that cannot be signed are left out. */
export async function signImagePaths(
  supabase: unknown,
  paths: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter((path): path is string => Boolean(path)))];
  const urls = new Map<string, string>();
  if (unique.length === 0) return urls;

  const { data } = await loose(supabase)
    .storage.from(IMAGE_BUCKET)
    .createSignedUrls(unique, ONE_HOUR);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return urls;
}
