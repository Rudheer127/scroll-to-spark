# Scroll to Spark

A web app that turns a moment of feeling helpless while scrolling into one small, real thing a person can do for their community, followed by a real thank-you from the group they helped.

Built for the Principled Innovation Academy challenge:

> How might we help people recognize the ways they contribute, find new avenues to participate, and forge meaningful paths for change within the communities they care about?

## Status

Early build. What works today: email sign-up and log-in, groups (create, edit, join, leave, delete), threads with up and down votes, nested comments with emoji reactions, deleting your own threads and comments, small steps with a note and a real reply, the partner portal for posting tasks and sending thank-yous, and a private demo account. The Spark Guide chat (a popup and a full page, always labeled AI) is built. A red team test (72 attack and benign prompts, run in CI with a scripted model that obeys every attack) passes, but the live eval against real AI providers has NOT been run, and the chat has not been tried against a live provider yet. Image uploads and GIFs are not built yet. The list below describes the full plan, not only what exists today.

## Running the live eval

The red team test in `npm test` uses a scripted model. The live eval sends a 37 prompt subset of the same corpus (`tests/evals/injection-corpus.json`) to the real provider, with fake database rows and no Supabase, and writes nothing to disk. It skips itself when no key is set.

```bash
export CEREBRAS_API_KEY=...   # or GROQ_API_KEY=...
export LLM_PROVIDER=cerebras  # optional: cerebras (default) or groq
npm run eval:live
```

It prints a table (entry, category, intent, source, guard events, result) and fails the run on any leak: a URL, the canary, system prompt text, an ungrounded number, a verified or certified claim, or a crisis message that was not handled. Benign messages that get blocked are shown as FAIL rows in the table but do not fail the run. Report results honestly as counts, for example "N attack prompts, M passed", and only after a real run.

## What it will do

1. **Small steps.** One simple action at a time, with the time it takes and who it helps. The person picks how much to give: tiny, medium or big.
2. **Real thank-yous.** A partner group replies to each action. Every reply is labeled by who wrote it: a real group or the app.
3. **Progress without pressure.** A private view of what a person has done. No streaks, no leaderboards, no guilt.
4. **Discussions.** Groups people can create, join, leave and delete, with Reddit-style threaded conversations, image uploads, emojis and GIFs, in an Instagram-style look.
5. **Spark Guide.** A labeled AI guide (served by Cerebras or Groq open models, with one fallback) that points to open tasks posted in the app (demo tasks are marked as samples), thanks people for what they report doing (self reported, never verified), and checks claims against a small evidence list. It is not live tested yet: the live eval has not been run and the chat has not been checked in a browser.
6. **Group portal.** A separate area where partner groups post small tasks and send thank-yous.

## Tech stack

Next.js, React, TypeScript, Tailwind CSS, shadcn/ui and 21st.dev components, Supabase (Postgres, Auth, Storage), deployed on Vercel. Full detail and the reasons are in [docs/TECH_STACK.md](docs/TECH_STACK.md).

## Documentation

| Document                                   | What it covers                                                 |
| ------------------------------------------ | -------------------------------------------------------------- |
| [docs/TECH_STACK.md](docs/TECH_STACK.md)   | The fixed technology choices and what is not allowed to change |
| [docs/BUILD_RULES.md](docs/BUILD_RULES.md) | Coding rules: what to do, what to avoid, how to reuse code     |
| [docs/UI_UX_RULES.md](docs/UI_UX_RULES.md) | Layout, copy and interaction rules for every screen            |
| [docs/FILE_TREE.md](docs/FILE_TREE.md)     | The folder layout and where each kind of code lives            |

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

## Demo data

`supabase/demo-seed.sql` fills the app with sample groups, steps, threads and replies, all marked as sample data. `supabase/demo-seed-extra.sql` adds more activity. Everyone who signs in sees the sample groups, can join them and post, and the pages refresh themselves every few seconds, so new activity shows up without a hard refresh. The demo login is kept outside the repository.
