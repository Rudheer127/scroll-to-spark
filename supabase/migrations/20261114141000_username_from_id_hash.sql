-- The first username was the start of the user id. Use a hash of the whole id so it is harder to collide.
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'user_' || substr(md5(new.id::text), 1, 12));
  return new;
end;
$$;
