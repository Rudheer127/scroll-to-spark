/** All landing page copy in one place. Short on purpose: a visitor should get it from headings and buttons alone. */

export const NAV_LINKS = [
  { id: "top", label: "Home" },
  { id: "how-it-works", label: "How it works" },
  { id: "features", label: "Features" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
] as const;

export const SIGN_UP_HREF = "/signup";
export const SIGN_IN_HREF = "/login";
/** Where a signed-in person goes. The home screen shows their next small step. */
export const APP_HREF = "/";

export const HERO = {
  headline: "One small thing, instead of scrolling.",
  support:
    "When the news feels heavy, pick one small, real way to help your community. A real group writes back to say thanks.",
  primaryCta: "Find one small thing to do",
  secondaryCta: "See how it works",
  tagline: "Small steps. Real thank-yous.",
} as const;

/** Stock photos from Unsplash (free to use, no attribution required). Files live in public/images/landing. */
export const PHOTOS = {
  hero: "/images/landing/hero-volunteers.jpg",
  about: "/images/landing/about-volunteer.jpg",
  contact: "/images/landing/contact-sunset.jpg",
  aboutAlt:
    "A smiling volunteer holding a trash bag during a park cleanup, with other volunteers behind",
} as const;

/** Sample steps shown in the hero animation. The scene labels them as examples. */
export const HERO_EXAMPLES = [
  { minutes: "5 minutes", text: "Write a thank-you note to a local food pantry" },
  { minutes: "10 minutes", text: "Share a neighborhood cleanup with one friend" },
  { minutes: "15 minutes", text: "Call a neighbor who lives alone" },
] as const;

export const MARQUEE_PHRASES = [
  "One small step",
  "A real thank-you",
  "You choose the size",
  "No streaks, no guilt",
] as const;

export const STEPS = [
  {
    title: "Pause",
    body: "When the news feels heavy, we offer one small thing to do instead of more scrolling.",
  },
  {
    title: "Pick a size",
    body: "Choose tiny, medium or big, and see the time it takes and who it helps first.",
  },
  {
    title: "Get thanked",
    body: "The group you helped replies, and every reply says who wrote it.",
  },
] as const;

export type FeatureIcon = "steps" | "thanks" | "guide" | "private";

export const FEATURES = [
  {
    icon: "steps",
    title: "Small steps",
    body: "Tiny, medium or big. Each shows the time it takes and who it helps.",
  },
  {
    icon: "thanks",
    title: "Real thank-yous",
    body: "A real group replies to what you did, and says who wrote the reply.",
  },
  {
    icon: "guide",
    title: "Spark Guide",
    body: "An AI helper, always labeled. It finds a step, notes what you did, and checks a claim.",
    badge: "AI",
  },
  {
    icon: "private",
    title: "Private progress",
    body: "See what you have done. No points, streaks or leaderboards.",
  },
] as const;

export const ABOUT = {
  heading: "Why we built this",
  body: "Scroll to Spark started as a student team's answer to one question: how might we help people see how they already contribute, find new ways to take part, and see their effort lead somewhere? We think one small action and a real thank-you is a good place to start.",
  neverTitle: "What we will not do",
  never: [
    "Use points or leaderboards",
    "Make you feel guilty",
    "Post your actions publicly by default",
  ],
} as const;

export const CONTACT = {
  heading: "Questions, or want your group involved?",
  body: "Create an account to join as a person or as a group. Groups post small tasks and write thank-yous from the partner portal. Or just email us.",
  signedInBody:
    "Groups post small tasks and write thank-yous from the partner portal. Questions? Just email us.",
  primaryCta: "Create an account",
  signedInCta: "Open the app",
  secondaryCta: "Sign in",
  email: "scrolltospark@gmail.com",
} as const;

export const FOOTER = {
  year: 2026,
  tagline:
    "Turn a moment of feeling helpless into one small, real thing you can do for your community.",
  note: "Made by a student team.",
  legal: "No points. No streaks. No guilt.",
} as const;
