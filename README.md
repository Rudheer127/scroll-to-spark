# Scroll to Spark

A web app that turns a moment of feeling helpless while scrolling into one small, real thing a person can do for their community, followed by a real thank-you from the group they helped.

Built for the Principled Innovation Academy challenge:

> How might we help people recognize the ways they contribute, find new avenues to participate, and forge meaningful paths for change within the communities they care about?

## Status

Early build. What works today: email sign-up and log-in, signed-out visitors are sent to the login page, and the Discussions area lets a signed-in person create, join, leave and delete groups. The database and its security rules are in place. Threads, comments, uploads, GIFs, the Spark Guide and the partner portal are not built yet. The list below describes the full plan, not only what exists today.

## What it will do

1. **Small steps.** One simple action at a time, with the time it takes and who it helps. The person picks how much to give: tiny, medium or big.
2. **Real thank-yous.** A partner group replies to each action. Every reply is labeled by who wrote it: a real group or the app.
3. **Progress without pressure.** A private view of what a person has done. No streaks, no leaderboards, no guilt.
4. **Discussions.** Groups people can create, join, leave and delete, with Reddit-style threaded conversations, image uploads, emojis and GIFs, in an Instagram-style look.
5. **Spark Guide.** An AI helper that declutters options, listens, and helps a person contribute. It only suggests real partner groups and is always labeled as AI.
6. **Group portal.** A separate area where partner groups post small tasks and send thank-yous.

## Tech stack

Next.js, React, TypeScript, Tailwind CSS, shadcn/ui and 21st.dev components, Supabase (Postgres, Auth, Storage), deployed on Vercel. Full detail and the reasons are in [docs/TECH_STACK.md](docs/TECH_STACK.md).

## Documentation

| Document | What it covers |
|---|---|
| [docs/TECH_STACK.md](docs/TECH_STACK.md) | The fixed technology choices and what is not allowed to change |
| [docs/BUILD_RULES.md](docs/BUILD_RULES.md) | Coding rules: what to do, what to avoid, how to reuse code |
| [docs/UI_UX_RULES.md](docs/UI_UX_RULES.md) | Layout, copy and interaction rules for every screen |
| [docs/FILE_TREE.md](docs/FILE_TREE.md) | The folder layout and where each kind of code lives |

Read the three rule documents before writing any code.

## File tree (summary)

```
scroll-to-spark/
  README.md
  docs/                 project rules (four documents)
  public/               static files
  supabase/             database migrations and seed data
  src/
    app/                routes only, kept thin
    components/         shared UI: ui, layout, shared
    features/           one folder per product feature
    lib/                shared helpers and service clients
    hooks/              shared React hooks
    types/              shared types
  tests/                unit and end to end tests
```

The full tree with a rule for every folder is in [docs/FILE_TREE.md](docs/FILE_TREE.md).

## Getting started

Requirements: Node.js 24 or newer, npm, and a Supabase project with the migrations in `supabase/migrations` applied.

1. Copy `.env.example` to `.env.local` and fill in the Supabase values.
2. Install and start:

```bash
npm install
npm run dev
```

Other scripts: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

In the Supabase dashboard, set the Site URL and add `/auth/callback` on your site address to the allowed redirect URLs, so the email confirmation link can sign people in.

## Deployment

The app will be deployed to Vercel. The database, sign-in and file storage run on Supabase. Secrets are set in Vercel and Supabase, never committed.

## Principles

- Nudge, never push. No pressure, no guilt, no fake urgency.
- Never present something as real that is not. Sample content is labeled as sample content.
- Make it easy to leave. Every flow has a warm way to stop.
- Keep the code easy to read and easy to debug by hand.

## License

Not chosen yet.
