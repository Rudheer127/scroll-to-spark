-- This project hands every new public table full privileges to anon and authenticated by default.
-- Remove what the app does not need. Row Level Security does not cover TRUNCATE, so it must not be granted.

-- Signed-out visitors get nothing yet.
revoke all on all tables in schema public from anon;

-- Signed-in users keep only the select, insert, update and delete grants made in the schema migration.
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- Stop future public tables from receiving these privileges automatically.
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger on tables from authenticated;
