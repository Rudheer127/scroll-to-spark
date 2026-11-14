# File tree

This is the planned layout of the repository. The goal is that someone who knows a bug is in "reply to a comment" can find the right file in under a minute by following folder names, without searching.

Folders marked "planned" do not exist until the app is scaffolded.

## Top level

```
scroll-to-spark/
  README.md                 overview and links
  docs/                     the four project rule documents
  public/                   static files such as the logo
  supabase/                 database migrations and seed data
  src/                      all application code
  tests/                    unit and end to end tests
  .env.example              names of environment variables, no values
  .gitignore
  package.json
  tsconfig.json
  next.config.ts
  eslint.config.mjs
```

## docs

```
docs/
  TECH_STACK.md             fixed technology choices
  BUILD_RULES.md            coding rules
  UI_UX_RULES.md            layout, copy and interaction rules
  FILE_TREE.md              this file
```

No other Markdown files are committed.

## supabase

```
supabase/
  migrations/               one SQL file per change, never edited after applying
  seed.sql                  sample data, labeled as sample
  config.toml
```

## src (planned)

```
src/
  app/                      routes only, kept thin
    (auth)/
      login/page.tsx
      signup/page.tsx
      check-email/page.tsx  shown after sign up, signs the person in once they confirm
      forgot-password/page.tsx  asks for an email and sends a reset link
      reset-password/page.tsx   choose a new password after opening the reset link
    auth/callback/route.ts  the email link lands here
    (app)/                  signed-in area with the app frame
      error.tsx             shown when a screen fails to load, with a Try again button
      layout.tsx            sidebar and top bar
      page.tsx              home dashboard
      steps/page.tsx        my steps and progress
      discussions/
        page.tsx            hub: your groups and discover groups
        [groupSlug]/
          page.tsx          one group
          not-found.tsx     shown for a group that does not exist
          [threadId]/page.tsx   one thread with nested comments
      guide/page.tsx        full-page Spark Guide
      messages/page.tsx
      notifications/page.tsx
      profile/page.tsx
    portal/                 partner group area
      layout.tsx
      page.tsx              overview
      tasks/page.tsx        post and manage tasks
      thank-yous/page.tsx   thank-you inbox
    api/
      gifs/route.ts         GIF search, server side only
      guide/route.ts        AI guide, server side only
      uploads/route.ts      image upload checks
    globals.css             design tokens and base styles

  components/
    ui/                     generic pieces: button, dialog, menu, input, avatar
    layout/                 app-shell, sidebar, top-bar, right-column
    shared/                 pieces used by several features: empty-state, error-state

  features/                 one folder per product feature
    groups/
      components/           group-story, discover-row, group-header, create-group-dialog, delete-group-dialog
      actions.ts            createGroup, joinGroup, leaveGroup, deleteGroup
      queries.ts            getGroups, getGroupBySlug
      schemas.ts            Zod schemas
      types.ts
    threads/
      components/           thread-card, thread-list, thread-composer
      actions.ts  queries.ts  schemas.ts  types.ts
    comments/
      components/           comment, comment-tree, comment-composer, attachment-preview
      actions.ts  queries.ts  schemas.ts  types.ts
    reactions/
      components/           emoji-picker, reaction-bar
      actions.ts
    gifs/
      components/           gif-picker
      queries.ts            calls the gif route
    uploads/
      actions.ts            image upload to storage
      constants.ts          size and type limits
    steps/
      components/           next-step-card, effort-picker, progress-ring, weekly-rhythm
      actions.ts  queries.ts  schemas.ts  types.ts
    thank-yous/
      components/           thank-you-card, thank-you-composer
      actions.ts  queries.ts  types.ts
    guide/
      components/           guide-popup, guide-page, message-bubble
      actions.ts            send message to the guide route
      types.ts
    partners/
      components/           task-form, waiting-list, task-card
      actions.ts  queries.ts  schemas.ts  types.ts
    auth/
      components/           login-form, signup-form, confirmation-watcher, resend-button
      actions.ts            signIn, signUp, resendConfirmation, signOut
      pending-email.ts      remembers the address waiting for confirmation, in a cookie
      queries.ts  schemas.ts

  lib/                      shared helpers and service clients
    supabase/
      client.ts             browser client
      server.ts             server client
      middleware.ts         session refresh
    env.ts                  the only place that reads process.env
    constants.ts            shared named constants
    format-time.ts          example of a single-purpose helper file
    cn.ts                   class name helper

  hooks/                    shared React hooks, one per file
  types/
    database.ts             generated by the Supabase CLI, never edited by hand
```

## tests (planned)

```
tests/
  unit/                     mirrors src, for example tests/unit/features/groups/schemas.test.ts
  e2e/                      Playwright flows
    groups.spec.ts          create, join, leave, delete
    comments.spec.ts        post, reply, image, GIF, emoji
```

## Rules for adding files

1. Find the feature folder first. If the code belongs to a feature, it goes in that feature.
2. If two features need it, move it to `src/lib`, `src/hooks` or `src/components/shared`, and update both callers.
3. Routes in `src/app` only import from `features` and `components`. They contain no database calls and no business rules.
4. A new feature gets its own folder with the same internal shape: `components`, `actions.ts`, `queries.ts`, `schemas.ts`, `types.ts`. Leave out files it does not need.
5. File names say what the file does. If you cannot name it in two or three words, it is doing too much.
6. Keep this document up to date when the tree changes.
