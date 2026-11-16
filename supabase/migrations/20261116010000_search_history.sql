-- search_history: the last few things a person searched for on a page, kept so they can tap one to
-- search again. Only the typed words are stored, never a place or an address. Each person sees and
-- manages only their own rows, and the app keeps the newest few per page.
create table public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  scope text not null check (scope in ('events', 'officials', 'inspire')),
  term text not null check (char_length(term) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (user_id, scope, term)
);
create index search_history_user_scope_created_idx
  on public.search_history (user_id, scope, created_at desc);

alter table public.search_history enable row level security;
revoke all on public.search_history from anon, authenticated;
grant select, delete on public.search_history to authenticated;
grant insert (user_id, scope, term) on public.search_history to authenticated;
-- Searching again moves a term to the top by bumping its time.
grant update (created_at) on public.search_history to authenticated;

create policy "read own searches" on public.search_history
  for select to authenticated using (user_id = (select auth.uid()));
create policy "add own searches" on public.search_history
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "bump own searches" on public.search_history
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "remove own searches" on public.search_history
  for delete to authenticated using (user_id = (select auth.uid()));
