-- Onboarding now asks for a first name, a last name and a display name, and nothing else.
-- first_name and last_name are nullable so accounts made before this change stay valid; the setup
-- form requires both for new accounts. A client may update only these two new columns here.
alter table public.profiles
  add column first_name text check (first_name is null or char_length(first_name) between 1 and 40),
  add column last_name text check (last_name is null or char_length(last_name) between 1 and 40);

grant update (first_name, last_name) on public.profiles to authenticated;
