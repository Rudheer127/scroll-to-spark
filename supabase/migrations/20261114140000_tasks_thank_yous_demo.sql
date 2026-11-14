-- Small tasks, task completions and thank-yous, plus a way to hide sample (demo) data from everyone
-- except the demo account.

-- Demo flags ------------------------------------------------------------------------------------
alter table public.profiles add column is_demo boolean not null default false;
alter table public.groups add column is_demo boolean not null default false;

create function private.viewer_is_demo() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_demo
  );
$$;

-- Sample groups, and everything inside them, are only visible to the demo account.
create or replace function private.can_view_group(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.groups g
    where g.id = gid
      and (not g.is_demo or private.viewer_is_demo())
      and (
        not g.is_private
        or g.owner_id = (select auth.uid())
        or exists (
          select 1 from public.group_members m
          where m.group_id = g.id and m.user_id = (select auth.uid())
        )
      )
  );
$$;

-- Sample people are only visible to the demo account (and a person always sees themselves).
create policy "hide sample profiles" on public.profiles
  as restrictive for select to authenticated
  using (not is_demo or private.viewer_is_demo() or id = (select auth.uid()));

-- Nobody can mark their own profile or group as sample data through the API.
revoke update on public.profiles from authenticated;
grant update (username, display_name, avatar_color) on public.profiles to authenticated;
revoke insert, update on public.groups from authenticated;
grant insert (slug, name, description, is_private, color, owner_id) on public.groups to authenticated;
grant update (name, description, color, is_private) on public.groups to authenticated;

-- Tables ----------------------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text check (char_length(description) <= 500),
  minutes smallint not null check (minutes between 1 and 600),
  effort text not null check (effort in ('tiny', 'medium', 'big')),
  place text not null default 'either' check (place in ('home', 'in_person', 'either')),
  reply_within_hours smallint not null default 48 check (reply_within_hours between 1 and 168),
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);
create index tasks_group_id_idx on public.tasks (group_id);
create index tasks_created_by_idx on public.tasks (created_by);

create table public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  unique (task_id, user_id)
);
create index task_completions_user_id_idx on public.task_completions (user_id);

create table public.thank_yous (
  id uuid primary key default gen_random_uuid(),
  completion_id uuid not null unique references public.task_completions (id) on delete cascade,
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('tap', 'written')),
  body text check (char_length(body) <= 1000),
  created_at timestamptz not null default now(),
  check ((kind = 'written') = (body is not null))
);
create index thank_yous_from_user_id_idx on public.thank_yous (from_user_id);

-- Helper functions ------------------------------------------------------------------------------
create function private.task_group_id(tid uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select t.group_id from public.tasks t where t.id = tid;
$$;

create function private.completion_group_id(cid uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select t.group_id
  from public.task_completions c join public.tasks t on t.id = c.task_id
  where c.id = cid;
$$;

create function private.completion_user_id(cid uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select c.user_id from public.task_completions c where c.id = cid;
$$;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- Row Level Security ----------------------------------------------------------------------------
alter table public.tasks enable row level security;
alter table public.task_completions enable row level security;
alter table public.thank_yous enable row level security;

create policy "view tasks in visible groups" on public.tasks
  for select to authenticated using (private.can_view_group(group_id));
create policy "owners post tasks" on public.tasks
  for insert to authenticated
  with check (created_by = (select auth.uid()) and private.is_group_owner(group_id));
create policy "owners edit tasks" on public.tasks
  for update to authenticated
  using (private.is_group_owner(group_id)) with check (private.is_group_owner(group_id));
create policy "owners delete tasks" on public.tasks
  for delete to authenticated using (private.is_group_owner(group_id));

create policy "view own completions or those in groups you own" on public.task_completions
  for select to authenticated
  using (
    user_id = (select auth.uid()) or private.is_group_owner(private.task_group_id(task_id))
  );
create policy "complete a visible task" on public.task_completions
  for insert to authenticated
  with check (
    user_id = (select auth.uid()) and private.can_view_group(private.task_group_id(task_id))
  );

create policy "view thank-yous for your completions or your group" on public.thank_yous
  for select to authenticated
  using (
    private.completion_user_id(completion_id) = (select auth.uid())
    or private.is_group_owner(private.completion_group_id(completion_id))
  );
create policy "owners send thank-yous" on public.thank_yous
  for insert to authenticated
  with check (
    from_user_id = (select auth.uid())
    and private.is_group_owner(private.completion_group_id(completion_id))
  );

-- Data API access, limited to what the policies allow ------------------------------------------
grant select on public.tasks to authenticated;
grant insert (group_id, created_by, title, description, minutes, effort, place) on public.tasks to authenticated;
grant update (title, description, minutes, effort, place, is_open) on public.tasks to authenticated;
grant delete on public.tasks to authenticated;
grant select on public.task_completions to authenticated;
grant insert (task_id, user_id, note) on public.task_completions to authenticated;
grant select on public.thank_yous to authenticated;
grant insert (completion_id, from_user_id, kind, body) on public.thank_yous to authenticated;
