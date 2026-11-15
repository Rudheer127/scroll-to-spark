-- Like (1) and dislike (-1) on comments, one vote per person per comment.
-- Same rules as thread_votes: members vote, people change or remove only their own.
create table public.comment_votes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
create index comment_votes_user_id_idx on public.comment_votes (user_id);

alter table public.comment_votes enable row level security;

create policy "view comment votes in visible groups" on public.comment_votes
  for select to authenticated
  using (
    private.can_view_group(private.thread_group_id(private.comment_thread_id(comment_id)))
  );
create policy "members vote on comments" on public.comment_votes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.is_group_member(private.thread_group_id(private.comment_thread_id(comment_id)))
  );
create policy "change own comment vote" on public.comment_votes
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "remove own comment vote" on public.comment_votes
  for delete to authenticated using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.comment_votes to authenticated;
