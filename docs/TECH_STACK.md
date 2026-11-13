# Tech stack

These choices are fixed. Changing one needs a written reason in the pull request and the agreement of the whole team. Versions are pinned in `package.json` when the app is scaffolded; this document names the tools, not version numbers.

## Core

| Area | Choice | Why |
|---|---|---|
| Framework | Next.js, App Router | One framework for pages, server actions and API routes, and it deploys to Vercel with no extra setup |
| Language | TypeScript, strict mode | Catches mistakes before they reach a user |
| UI library | React | Comes with Next.js |
| Styling | Tailwind CSS | Fast, consistent spacing and color through design tokens |
| Components | shadcn/ui primitives plus components from 21st.dev | Accessible, editable code that lives in our repo |
| Icons | lucide-react | One consistent vector icon set. No emoji as icons |
| Fonts | Inter for the interface | Matches the Instagram-style look we chose |

## Data and services

| Area | Choice | Why |
|---|---|---|
| Database | Supabase Postgres | Relational data fits groups, threads and comments |
| Security | Row Level Security on every table | The database enforces who can read, write and delete |
| Auth | Supabase Auth | Sign-in and sessions without building our own |
| File storage | Supabase Storage | Image uploads in comments and posts |
| Supabase client | `@supabase/supabase-js` and `@supabase/ssr` | Official clients for browser and server |
| Validation | Zod | One schema checks form input and server input |
| GIFs | A GIF search API called only from a server route | Keeps the API key off the browser. Provider to be confirmed before the GIF feature is built |
| AI helper | Anthropic Claude API, called only from a server route | Keeps the key off the browser. The helper may only suggest real partner groups |

## Data fetching and state

| Area | Rule |
|---|---|
| Reading data | Server Components call functions in `features/*/queries.ts` |
| Writing data | Server Actions in `features/*/actions.ts` |
| Client state | React state and URL search params. No global state library at the start |
| Forms | Native forms with Server Actions, validated with Zod |

If a global state library or a data fetching library is ever needed, add it through the change process above, not inside a feature.

## Tooling

| Area | Choice |
|---|---|
| Package manager | npm |
| Node.js | 24 or newer |
| Linting | ESLint with the Next.js config |
| Formatting | Prettier |
| Unit tests | Vitest |
| End to end tests | Playwright |
| Database migrations | Supabase CLI, files in `supabase/migrations` |
| Hosting | Vercel |
| Source control | Git and GitHub |

## Not allowed without approval

- A second UI component library or a second styling system
- A second database or any database outside Supabase
- Any state management library
- Calling third-party APIs from the browser with a secret key
- Committing secrets, tokens or `.env` files
- Adding a dependency for something about ten lines of code can do

## Environment variables

All variables are read in one file, `src/lib/env.ts`, which validates them with Zod. No other file reads `process.env`. The list of names lives in `.env.example` with empty values.
