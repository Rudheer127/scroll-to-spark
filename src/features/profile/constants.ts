export const AVATAR_BUCKET = "avatars";
/** Photos are cropped to a square and shrunk to this many pixels a side before they are uploaded. */
export const AVATAR_SIZE_PX = 512;
/** The only file name shape a photo may have, inside a folder named after its owner. */
export const AVATAR_FILE_PATTERN = /^avatar-\d{10,16}\.webp$/;
