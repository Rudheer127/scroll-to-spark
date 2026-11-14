/** A small preview of the image a person sent, kept only in this browser tab. */
export function UserImageNote({ dataUrl }: { dataUrl: string }) {
  return (
    <span className="mt-2 flex items-center gap-2 text-sm text-muted">
      {/* A data URL from the person's own file, so next/image adds nothing here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt="Image you sent" className="size-16 rounded-lg object-cover" />
      Image attached
    </span>
  );
}
