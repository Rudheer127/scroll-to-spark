-- Onboarding answers live on the profile. Clients may update only these columns (plus the ones already
-- granted earlier); onboarded_at cannot be set until the 18+ confirmation exists.
alter table public.profiles
  add column onboarded_at timestamptz,
  add column age_confirmed_at timestamptz,
  add column minutes_per_week smallint check (minutes_per_week between 5 and 600),
  add column place_pref text check (place_pref in ('home', 'in_person', 'either')),
  add column interests text[] not null default '{}' check (cardinality(interests) <= 8),
  add column needs text check (needs is null or char_length(needs) <= 300),
  add constraint profiles_onboarded_needs_age
    check (onboarded_at is null or age_confirmed_at is not null);

grant update (onboarded_at, age_confirmed_at, minutes_per_week, place_pref, interests, needs)
  on public.profiles to authenticated;
