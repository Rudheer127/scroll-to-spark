-- Usernames may use capitals, dots and hyphens. They are still unique ignoring case, so "Maya" and
-- "maya" cannot both exist and nobody can pose as someone else with a different capital.
alter table public.profiles drop constraint profiles_username_check;
alter table public.profiles add constraint profiles_username_check
  check (username ~ '^[A-Za-z0-9_.-]{3,30}$');

alter table public.profiles drop constraint profiles_username_key;
create unique index profiles_username_lower_key on public.profiles (lower(username));
