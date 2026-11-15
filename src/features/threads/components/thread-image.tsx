/** A signed, private image from a post. Capped in height so one picture cannot take over a feed. */
export function PostImage({ url, alt }: { url: string; alt: string | null }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- signed private URL, not optimizable
    <img
      src={url}
      alt={alt ?? "Image attached to this post"}
      loading="lazy"
      className="max-h-96 max-w-full rounded-lg border border-border object-contain"
    />
  );
}
