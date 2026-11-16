-- Get Inspired: an opt-in feed of steps people chose to share. Nothing is shared by default.
-- A person can share a finished step (first name and last initial, the step, the group, the minutes)
-- and, separately, the thank-you the group sent back. Notes are never shared. Sharing can be turned
-- off at any time.

-- Opt-in columns --------------------------------------------------------------------------------
alter table public.task_completions
  add column share_publicly boolean not null default false,
  add column share_thank_you boolean not null default false,
  add column inspiration_hidden boolean not null default false,
  add column is_sample boolean not null default false,
  add constraint task_completions_thank_you_needs_share
    check (not share_thank_you or share_publicly);

create index task_completions_shared_idx
  on public.task_completions (created_at desc, id desc) where share_publicly;

-- Only the two sharing switches are editable, and only on your own rows. is_sample and
-- inspiration_hidden can never be set through the API.
grant update (share_publicly, share_thank_you) on public.task_completions to authenticated;
create policy "change sharing on your own completions" on public.task_completions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Full-text search over the step title (kept up to date by the database) ---------------------------
alter table public.tasks
  add column search tsvector generated always as (to_tsvector('simple'::regconfig, title)) stored;
create index tasks_search_idx on public.tasks using gin (search);

-- Reactions and saves: your own rows only --------------------------------------------------------
create table public.inspiration_reactions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  completion_id uuid not null references public.task_completions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, completion_id)
);
create index inspiration_reactions_completion_idx on public.inspiration_reactions (completion_id);

create table public.inspiration_saves (
  user_id uuid not null references public.profiles (id) on delete cascade,
  completion_id uuid not null references public.task_completions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, completion_id)
);
create index inspiration_saves_completion_idx on public.inspiration_saves (completion_id);

alter table public.inspiration_reactions enable row level security;
alter table public.inspiration_saves enable row level security;
revoke all on public.inspiration_reactions, public.inspiration_saves from anon, authenticated;
grant select, insert, delete on public.inspiration_reactions to authenticated;
grant select, insert, delete on public.inspiration_saves to authenticated;

create policy "read own reactions" on public.inspiration_reactions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "react as yourself" on public.inspiration_reactions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "remove own reactions" on public.inspiration_reactions
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "read own saves" on public.inspiration_saves
  for select to authenticated using (user_id = (select auth.uid()));
create policy "save as yourself" on public.inspiration_saves
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "remove own saves" on public.inspiration_saves
  for delete to authenticated using (user_id = (select auth.uid()));

-- Reports: the same reports table and the same three-reports threshold as discussions ----------
alter table public.reports drop constraint reports_target_type_check;
alter table public.reports
  add constraint reports_target_type_check
  check (target_type in ('thread', 'comment', 'group', 'inspiration'));

create or replace function private.can_report(ttype text, tid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select case ttype
    when 'group' then private.can_view_group(tid)
    when 'thread' then exists (
      select 1 from public.threads t where t.id = tid and private.can_view_group(t.group_id))
    when 'comment' then exists (
      select 1 from public.comments c
      join public.threads t on t.id = c.thread_id
      where c.id = tid and private.can_view_group(t.group_id))
    when 'inspiration' then exists (
      select 1 from public.task_completions c
      where c.id = tid and c.share_publicly and c.user_id <> (select auth.uid()))
    else false
  end;
$$;

create or replace function private.hide_after_reports() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  threshold constant int := 3;
  total int;
begin
  select count(distinct reporter_id) into total
  from public.reports where target_type = new.target_type and target_id = new.target_id;
  if total >= threshold then
    if new.target_type = 'thread' then
      update public.threads set hidden = true where id = new.target_id;
    elsif new.target_type = 'comment' then
      update public.comments set hidden = true where id = new.target_id;
    elsif new.target_type = 'inspiration' then
      update public.task_completions set inspiration_hidden = true where id = new.target_id;
    else
      update public.groups set hidden = true where id = new.target_id;
    end if;
  end if;
  return new;
end;
$$;

-- The feed --------------------------------------------------------------------------------------
-- Runs with the owner's rights on purpose: it is the only way other people's completions can be
-- read, and it returns only shared, visible rows with a first name and last initial. Never an
-- email, a username, or a note. The thank-you text appears only when its author shared it.
create view public.inspiration_feed as
select
  c.id,
  c.task_id,
  t.title,
  g.name as group_name,
  g.slug as group_slug,
  g.color as group_color,
  t.effort,
  t.minutes,
  c.created_at,
  coalesce(nullif(split_part(trim(p.display_name), ' ', 1), ''), 'A neighbor')
    || case
         when position(' ' in trim(p.display_name)) > 0
         then ' ' || upper(left((regexp_match(trim(p.display_name), '(\S+)$'))[1], 1)) || '.'
         else ''
       end as author_name,
  p.avatar_color,
  p.avatar_url,
  (c.share_thank_you and ty.id is not null) as has_thank_you,
  case when c.share_thank_you then ty.kind end as thank_kind,
  case when c.share_thank_you then ty.body end as thank_body,
  c.is_sample,
  (select count(*) from public.inspiration_reactions r where r.completion_id = c.id)::int
    as inspired_count,
  exists (
    select 1 from public.inspiration_reactions r
    where r.completion_id = c.id and r.user_id = (select auth.uid())
  ) as inspired_by_me,
  exists (
    select 1 from public.inspiration_saves s
    where s.completion_id = c.id and s.user_id = (select auth.uid())
  ) as saved_by_me,
  (c.user_id = (select auth.uid())) as is_mine,
  t.search
    || to_tsvector('simple'::regconfig, g.name)
    || to_tsvector(
         'simple'::regconfig,
         coalesce(case when c.share_thank_you then ty.body end, '')
       ) as search_doc
from public.task_completions c
join public.tasks t on t.id = c.task_id
join public.groups g on g.id = t.group_id
join public.profiles p on p.id = c.user_id
left join public.thank_yous ty on ty.completion_id = c.id
where c.share_publicly
  and not c.inspiration_hidden
  and not g.hidden
  and private.can_view_group(g.id)
  and not exists (
    select 1 from public.user_blocks b
    where b.blocker_id = (select auth.uid()) and b.blocked_id = c.user_id
  );

revoke all on public.inspiration_feed from anon, authenticated;
grant select on public.inspiration_feed to authenticated;

-- Sample posts so the feed is not empty. Every one is flagged is_sample and shown with a
-- "Sample data" badge. They belong to the sample people.
with people as (
  select id, row_number() over (order by display_name) as rn
  from public.profiles where is_demo and display_name <> 'Demo Account'
),
steps as (
  select id, created_by, row_number() over (order by created_at, id) as rn from public.tasks
),
picks as (
  select k, s.id as task_id, s.created_by, pe.id as user_id
  from generate_series(0, 9) as k
  join people pe on pe.rn = (k % (select count(*) from people)) + 1
  join steps s on s.rn = (k % (select count(*) from steps)) + 1
  where s.created_by <> pe.id
)
insert into public.task_completions
  (task_id, user_id, created_at, share_publicly, share_thank_you, is_sample)
select task_id, user_id, now() - (k * interval '5 hours'), true, (k % 2 = 0), true
from picks;

insert into public.thank_yous (completion_id, from_user_id, kind, body)
select c.id, t.created_by,
  case when (row_number() over (order by c.created_at)) % 2 = 0 then 'tap' else 'written' end,
  case when (row_number() over (order by c.created_at)) % 2 = 0 then null
       else 'Thank you. Sample reply: this really helped us.' end
from public.task_completions c
join public.tasks t on t.id = c.task_id
where c.is_sample and c.share_thank_you;
