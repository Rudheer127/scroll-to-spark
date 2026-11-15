-- Discussions safety: reports, hide-after-threshold, blocking, group rules,
-- image alt text, write rate limits and no self-voting.

-- Columns ---------------------------------------------------------------------

alter table public.groups
  add column rules text check (char_length(rules) <= 1000),
  add column hidden boolean not null default false;

alter table public.threads
  add column image_alt text check (char_length(image_alt) between 1 and 200),
  add column hidden boolean not null default false,
  add constraint threads_image_needs_alt check (image_path is null or image_alt is not null),
  add constraint threads_image_in_own_folder
    check (image_path is null or image_path like author_id::text || '/%');

alter table public.comments
  add column image_alt text check (char_length(image_alt) between 1 and 200),
  add column hidden boolean not null default false,
  add constraint comments_image_needs_alt check (attachment_url is null or image_alt is not null),
  add constraint comments_image_in_own_folder
    check (attachment_kind is distinct from 'image' or attachment_url like author_id::text || '/%');

-- Nobody can set or clear `hidden` from the API. Only the report trigger (nesting depth 2) can.
create function private.protect_hidden() returns trigger
language plpgsql set search_path = '' as $$
begin
  if pg_trigger_depth() = 1 then
    if tg_op = 'INSERT' then
      new.hidden := false;
    else
      new.hidden := old.hidden;
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_hidden_groups before insert or update on public.groups
  for each row execute function private.protect_hidden();
create trigger protect_hidden_threads before insert or update on public.threads
  for each row execute function private.protect_hidden();
create trigger protect_hidden_comments before insert or update on public.comments
  for each row execute function private.protect_hidden();

-- Reports ---------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('thread', 'comment', 'group')),
  target_id uuid not null,
  reason text not null
    check (reason in ('harassment', 'personal_info', 'spam', 'unsafe', 'other')),
  details text check (char_length(details) <= 500),
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
create index reports_target_idx on public.reports (target_type, target_id);

-- You may report only something you can see.
create function private.can_report(ttype text, tid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select case ttype
    when 'group' then private.can_view_group(tid)
    when 'thread' then exists (
      select 1 from public.threads t where t.id = tid and private.can_view_group(t.group_id))
    when 'comment' then exists (
      select 1 from public.comments c
      join public.threads t on t.id = c.thread_id
      where c.id = tid and private.can_view_group(t.group_id))
    else false
  end;
$$;

alter table public.reports enable row level security;

create policy "report what you can see" on public.reports
  for insert to authenticated
  with check (
    reporter_id = (select auth.uid()) and private.can_report(target_type, target_id)
  );
create policy "read own reports" on public.reports
  for select to authenticated using (reporter_id = (select auth.uid()));

grant select, insert on public.reports to authenticated;

-- Three different people reporting the same thing hides it for everyone but its author.
create function private.hide_after_reports() returns trigger
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
    else
      update public.groups set hidden = true where id = new.target_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger hide_after_reports after insert on public.reports
  for each row execute function private.hide_after_reports();

-- Blocking --------------------------------------------------------------------

create table public.user_blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index user_blocks_blocked_id_idx on public.user_blocks (blocked_id);

alter table public.user_blocks enable row level security;
create policy "read own blocks" on public.user_blocks
  for select to authenticated using (blocker_id = (select auth.uid()));
create policy "block someone" on public.user_blocks
  for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "unblock" on public.user_blocks
  for delete to authenticated using (blocker_id = (select auth.uid()));
grant select, insert, delete on public.user_blocks to authenticated;

-- Per-person write rate limits (skipped for the service role and seed scripts) -----

create function private.limit_writes() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  who uuid;
  recent int;
  max_writes int;
  window_len interval;
begin
  if (select auth.uid()) is null then
    return new;
  end if;
  if tg_table_name = 'threads' then
    who := new.author_id; max_writes := 10; window_len := interval '1 hour';
    select count(*) into recent from public.threads
      where author_id = who and created_at > now() - window_len;
  elsif tg_table_name = 'comments' then
    who := new.author_id; max_writes := 30; window_len := interval '1 hour';
    select count(*) into recent from public.comments
      where author_id = who and created_at > now() - window_len;
  else
    who := new.owner_id; max_writes := 5; window_len := interval '1 day';
    select count(*) into recent from public.groups
      where owner_id = who and created_at > now() - window_len;
  end if;
  if recent >= max_writes then
    raise exception 'rate_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger limit_threads before insert on public.threads
  for each row execute function private.limit_writes();
create trigger limit_comments before insert on public.comments
  for each row execute function private.limit_writes();
create trigger limit_groups before insert on public.groups
  for each row execute function private.limit_writes();

-- No voting on your own thread -----------------------------------------------------

create function private.is_thread_author(tid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.threads t where t.id = tid and t.author_id = (select auth.uid())
  );
$$;

drop policy "members vote" on public.thread_votes;
create policy "members vote" on public.thread_votes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.is_group_member(private.thread_group_id(thread_id))
    and not private.is_thread_author(thread_id)
  );

drop policy "change own vote" on public.thread_votes;
create policy "change own vote" on public.thread_votes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid()) and not private.is_thread_author(thread_id)
  );

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
