-- Scroll to Spark: initial schema for profiles, groups, threads, comments and reactions.
-- Every table has Row Level Security. Only signed-in users get any access.

-- Helper functions live in a private schema that the API does not expose.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- Tables --------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text check (char_length(display_name) <= 60),
  avatar_color text not null default 'pink'
    check (avatar_color in ('orange', 'pink', 'purple', 'indigo', 'blue', 'green')),
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 40),
  name text not null check (char_length(name) between 2 and 60),
  description text check (char_length(description) <= 500),
  is_private boolean not null default false,
  color text not null default 'pink'
    check (color in ('orange', 'pink', 'purple', 'indigo', 'blue', 'green')),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index groups_owner_id_idx on public.groups (owner_id);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_id_idx on public.group_members (user_id);

create table public.threads (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  body text check (char_length(body) <= 10000),
  image_path text,
  created_at timestamptz not null default now()
);
create index threads_group_id_created_at_idx on public.threads (group_id, created_at desc);
create index threads_author_id_idx on public.threads (author_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  parent_id uuid,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text check (char_length(body) <= 5000),
  attachment_kind text check (attachment_kind in ('image', 'gif')),
  attachment_url text,
  created_at timestamptz not null default now(),
  unique (id, thread_id),
  -- A reply must belong to the same thread as its parent.
  foreign key (parent_id, thread_id) references public.comments (id, thread_id) on delete cascade,
  check (body is not null or attachment_url is not null),
  check ((attachment_kind is null) = (attachment_url is null))
);
create index comments_thread_id_created_at_idx on public.comments (thread_id, created_at);
create index comments_parent_id_idx on public.comments (parent_id);
create index comments_author_id_idx on public.comments (author_id);

create table public.comment_reactions (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id, emoji)
);
create index comment_reactions_user_id_idx on public.comment_reactions (user_id);

create table public.thread_votes (
  thread_id uuid not null references public.threads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);
create index thread_votes_user_id_idx on public.thread_votes (user_id);

-- Helper functions used by the policies --------------------------------------
-- They run as the function owner so a policy can look at other tables without
-- recursing. They sit in the private schema and always check auth.uid().

create function private.is_group_member(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = gid and m.user_id = (select auth.uid())
  );
$$;

create function private.is_group_owner(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.groups g
    where g.id = gid and g.owner_id = (select auth.uid())
  );
$$;

create function private.is_public_group(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.groups g where g.id = gid and not g.is_private);
$$;

create function private.can_view_group(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.groups g
    where g.id = gid
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

create function private.thread_group_id(tid uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select t.group_id from public.threads t where t.id = tid;
$$;

create function private.comment_thread_id(cid uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select c.thread_id from public.comments c where c.id = cid;
$$;

-- Trigger functions ----------------------------------------------------------

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'user_' || left(replace(new.id::text, '-', ''), 8));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.add_group_owner_as_member() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_group_created
  after insert on public.groups
  for each row execute function private.add_group_owner_as_member();

-- Nobody but signed-in users may call the helpers.
revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- Row Level Security ---------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.threads enable row level security;
alter table public.comments enable row level security;
alter table public.comment_reactions enable row level security;
alter table public.thread_votes enable row level security;

-- profiles: everyone signed in can read, each person edits only their own.
create policy "profiles are readable" on public.profiles
  for select to authenticated using (true);
create policy "update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- groups: public groups and groups you belong to are visible. Only the owner edits or deletes.
create policy "view visible groups" on public.groups
  for select to authenticated using (private.can_view_group(id));
create policy "create own group" on public.groups
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "owner edits group" on public.groups
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "owner deletes group" on public.groups
  for delete to authenticated using (owner_id = (select auth.uid()));

-- group_members: join a public group yourself, leave it yourself, owners cannot leave.
create policy "view members of visible groups" on public.group_members
  for select to authenticated using (private.can_view_group(group_id));
create policy "join public group" on public.group_members
  for insert to authenticated
  with check (
    user_id = (select auth.uid()) and role = 'member' and private.is_public_group(group_id)
  );
create policy "leave group" on public.group_members
  for delete to authenticated
  using (user_id = (select auth.uid()) and role = 'member');

-- threads: members post. Authors edit. Authors and group owners delete.
create policy "view threads in visible groups" on public.threads
  for select to authenticated using (private.can_view_group(group_id));
create policy "members post threads" on public.threads
  for insert to authenticated
  with check (author_id = (select auth.uid()) and private.is_group_member(group_id));
create policy "author edits thread" on public.threads
  for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy "author or owner deletes thread" on public.threads
  for delete to authenticated
  using (author_id = (select auth.uid()) or private.is_group_owner(group_id));

-- comments: same shape as threads.
create policy "view comments in visible groups" on public.comments
  for select to authenticated
  using (private.can_view_group(private.thread_group_id(thread_id)));
create policy "members post comments" on public.comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and private.is_group_member(private.thread_group_id(thread_id))
  );
create policy "author edits comment" on public.comments
  for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy "author or owner deletes comment" on public.comments
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    or private.is_group_owner(private.thread_group_id(thread_id))
  );

-- comment_reactions: members react, people remove only their own.
create policy "view reactions in visible groups" on public.comment_reactions
  for select to authenticated
  using (
    private.can_view_group(private.thread_group_id(private.comment_thread_id(comment_id)))
  );
create policy "members react" on public.comment_reactions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.is_group_member(private.thread_group_id(private.comment_thread_id(comment_id)))
  );
create policy "remove own reaction" on public.comment_reactions
  for delete to authenticated using (user_id = (select auth.uid()));

-- thread_votes: members vote and change or remove only their own vote.
create policy "view votes in visible groups" on public.thread_votes
  for select to authenticated using (private.can_view_group(private.thread_group_id(thread_id)));
create policy "members vote" on public.thread_votes
  for insert to authenticated
  with check (
    user_id = (select auth.uid()) and private.is_group_member(private.thread_group_id(thread_id))
  );
create policy "change own vote" on public.thread_votes
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "remove own vote" on public.thread_votes
  for delete to authenticated using (user_id = (select auth.uid()));

-- Data API access. New tables are not exposed automatically, so grant exactly what is needed.
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.groups to authenticated;
grant select, insert, delete on public.group_members to authenticated;
grant select, insert, update, delete on public.threads to authenticated;
grant select, insert, update, delete on public.comments to authenticated;
grant select, insert, delete on public.comment_reactions to authenticated;
grant select, insert, update, delete on public.thread_votes to authenticated;
