-- event_rsvps: "I'm going" notes people keep for themselves about public events.
-- This is the app's own bookmark. It does NOT register anyone with the event's organizer, and
-- 'attended' is self-reported, never checked by anyone. Events come from a live feed that changes,
-- so each row keeps a small snapshot (title, organizer, link, time) to stay readable later.
create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_key text not null check (event_key ~ '^mobilize:[0-9]+(:[0-9]+)?$'),
  source text not null default 'mobilize' check (source in ('mobilize')),
  title text not null check (char_length(title) between 1 and 200),
  organizer text check (char_length(organizer) <= 200),
  url text not null check (char_length(url) <= 500 and url ~ '^https://([a-z0-9-]+\.)?mobilize\.us/'),
  starts_at timestamptz not null,
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 64),
  is_virtual boolean not null default false,
  city text check (char_length(city) <= 100),
  status text not null default 'going' check (status in ('going', 'attended')),
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);
create index event_rsvps_user_id_starts_at_idx on public.event_rsvps (user_id, starts_at);

alter table public.event_rsvps enable row level security;
revoke all on public.event_rsvps from anon, authenticated;
grant select, delete on public.event_rsvps to authenticated;
-- Only these columns are writable by a client. id and created_at are always set by the database,
-- and after the first save only status can change, so a saved snapshot cannot be rewritten.
grant insert (user_id, event_key, source, title, organizer, url, starts_at, timezone, is_virtual, city, status)
  on public.event_rsvps to authenticated;
grant update (status) on public.event_rsvps to authenticated;

create policy "read own rsvps" on public.event_rsvps
  for select to authenticated using (user_id = (select auth.uid()));
create policy "add own rsvps" on public.event_rsvps
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "change own rsvp status" on public.event_rsvps
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "remove own rsvps" on public.event_rsvps
  for delete to authenticated using (user_id = (select auth.uid()));
