-- Sample groups and people are now ordinary, live data that every signed-in account can see and
-- join. is_demo stays only as a label for the "Sample data" badge.
create or replace function private.can_view_group(gid uuid) returns boolean
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

drop policy "hide sample profiles" on public.profiles;
