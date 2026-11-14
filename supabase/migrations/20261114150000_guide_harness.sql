-- Spark Guide AI harness: evidence, contributions, chat history and safety events.
-- Opportunities are rows of public.tasks, so there is no opportunities table here.

-- evidence_claims: reference data the guide may cite ---------------------------------------------
create table public.evidence_claims (
  id uuid primary key default gen_random_uuid(),
  claim text not null check (char_length(claim) between 3 and 600),
  source_name text not null check (char_length(source_name) between 1 and 200),
  source_url text check (char_length(source_url) <= 500),
  year integer check (year between 1900 and 2100),
  population text,
  strength text not null check (strength in ('strong', 'moderate', 'weak')),
  verified_at timestamptz,
  caveat text check (char_length(caveat) <= 500),
  fts tsvector generated always as (to_tsvector('english', claim || ' ' || coalesce(caveat, ''))) stored,
  created_at timestamptz not null default now()
);
create index evidence_claims_fts_idx on public.evidence_claims using gin (fts);

alter table public.evidence_claims enable row level security;
revoke all on public.evidence_claims from anon, authenticated;
grant select on public.evidence_claims to authenticated;
create policy "signed-in users read evidence" on public.evidence_claims
  for select to authenticated using ((select auth.uid()) is not null);

-- contributions: things a person did, typed in by that person ------------------------------------
create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text check (char_length(description) <= 500),
  minutes integer not null check (minutes between 1 and 1440),
  occurred_on date not null,
  verification text not null default 'self_reported'
    check (verification in ('self_reported', 'partner_confirmed')),
  created_at timestamptz not null default now()
);
create index contributions_user_id_idx on public.contributions (user_id, occurred_on desc);

-- A CHECK with current_date is not immutable and can break pg_restore, so a trigger enforces it.
-- One day of slack covers people whose local date is ahead of the database's date.
create function private.reject_future_contribution() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.occurred_on > current_date + 1 then
    raise exception 'occurred_on cannot be in the future' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke execute on function private.reject_future_contribution() from public, anon, authenticated;
create trigger contributions_no_future_date
  before insert on public.contributions
  for each row execute function private.reject_future_contribution();

alter table public.contributions enable row level security;
revoke all on public.contributions from anon, authenticated;
grant select, delete on public.contributions to authenticated;
-- verification is left out so a client can never mark its own entry partner_confirmed.
grant insert (user_id, title, description, minutes, occurred_on) on public.contributions to authenticated;
create policy "read own contributions" on public.contributions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "add own contributions" on public.contributions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "delete own contributions" on public.contributions
  for delete to authenticated using (user_id = (select auth.uid()));

-- guide_messages: the private chat history with the AI guide -------------------------------------
create table public.guide_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 8000),
  intent text,
  created_at timestamptz not null default now()
);
create index guide_messages_user_id_created_at_idx on public.guide_messages (user_id, created_at desc);

alter table public.guide_messages enable row level security;
revoke all on public.guide_messages from anon, authenticated;
grant select, insert on public.guide_messages to authenticated;
create policy "read own guide messages" on public.guide_messages
  for select to authenticated using (user_id = (select auth.uid()));
create policy "add own guide messages" on public.guide_messages
  for insert to authenticated with check (user_id = (select auth.uid()));

-- guide_events: safety signals, written by the server only (detail holds signal names, never text)
create table public.guide_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null
    check (kind in ('injection_signal', 'crisis', 'output_blocked', 'provider_failure', 'rate_limited')),
  detail jsonb,
  created_at timestamptz not null default now()
);
create index guide_events_user_id_idx on public.guide_events (user_id, created_at desc);

-- RLS on with no policy and no grant: only the service role, which bypasses RLS, can touch it.
alter table public.guide_events enable row level security;
revoke all on public.guide_events from anon, authenticated;

-- Evidence seed ------------------------------------------------------------------------------------
insert into public.evidence_claims
  (claim, source_name, source_url, year, population, strength, verified_at, caveat)
values
  ('About 54% of Americans informally helped neighbors in 2023.',
   'U.S. Census Bureau and AmeriCorps', 'https://www.census.gov', 2023, 'All Americans', 'moderate', null,
   'All Americans, not 18 to 24. Link needs a re-check.'),
  ('About 28.3% of Americans formally volunteered in 2023.',
   'U.S. Census Bureau and AmeriCorps', 'https://www.americorps.gov', 2023, 'All Americans', 'moderate', null,
   'All Americans, not 18 to 24. Link needs a re-check.'),
  ('Recognition and hearing back are linked to volunteers staying involved.',
   'IUPUI study on recognition and turnover', null, null, 'Volunteers', 'moderate', null,
   'Mostly measures intent to stay, mostly among people who already volunteer.'),
  ('Recognition and hearing back are linked to keeping volunteers, per a 2025 evidence summary.',
   'Switchboard', null, 2025, 'Volunteers', 'moderate', null,
   'Mostly measures intent to stay, mostly among people who already volunteer.'),
  ('Studies on swapping screen time for another activity disagree. One 642-person trial found benefits, and a smaller 3-month trial found reducing use alone worked better.',
   'Screen time swap trials', null, null, 'Trial participants', 'weak', null,
   'Research against our idea. The trials disagree.'),
  ('Peer endorsement emails to 100,000+ UK students reduced clicks instead of raising them.',
   'UK peer endorsement email trial', null, null, 'UK students', 'moderate', null,
   'Research against our idea. Endorsement can backfire.'),
  ('We found no long-term study showing that tiny actions lead to bigger involvement.',
   'Spark Guide evidence review', null, null, 'Not applicable', 'weak', null,
   'Research against our idea. The research calls this the slacktivism risk.'),
  ('Badges and points can crowd out real motivation, and pressure lowers motivation to keep volunteering.',
   'Motivation research', null, null, 'Volunteers', 'moderate', null,
   'Research against our idea. This is why the guide uses no points or streaks.');
