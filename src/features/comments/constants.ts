export const COMMENT_MAX = 5000;

/** Reactions people can add. One of each per person per comment. */
export const REACTION_CHOICES = ["❤️", "🙌", "🌱", "😂", "🥹", "👏"] as const;

/** Replies stop moving further right after this many levels, so deep threads stay readable. */
export const MAX_INDENT_DEPTH = 4;
