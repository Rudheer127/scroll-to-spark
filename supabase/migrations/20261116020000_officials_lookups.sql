-- officials_lookups: the last few ZIP codes a person looked up on "Your officials", kept so they can
-- tap one to look again. Only the ZIP, its city and its state are stored, never an address or a
-- precise location. Each person sees and manages only their own rows, and the app keeps the
-- newest ten.
create table public.officials_lookups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  zip text not null check (zip ~ '^[0-9]{5}$'),
  city text not null check (char_length(city) between 1 and 100),
  state text not null check (state ~ '^[A-Z]{2}$'),
  created_at timestamptz not null default now(),
  unique (user_id, zip)
);
create index officials_lookups_user_id_created_at_idx
  on public.officials_lookups (user_id, created_at desc);

alter table public.officials_lookups enable row level security;
revoke all on public.officials_lookups from anon, authenticated;
grant select, delete on public.officials_lookups to authenticated;
grant insert (user_id, zip, city, state) on public.officials_lookups to authenticated;
-- Looking the same ZIP up again moves it to the top by bumping its time.
grant update (created_at) on public.officials_lookups to authenticated;

create policy "read own lookups" on public.officials_lookups
  for select to authenticated using (user_id = (select auth.uid()));
create policy "add own lookups" on public.officials_lookups
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "bump own lookups" on public.officials_lookups
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "remove own lookups" on public.officials_lookups
  for delete to authenticated using (user_id = (select auth.uid()));
