-- Two fixes found in QA of the Get Inspired feed.
--
-- 1. task_completions had table-wide INSERT, UPDATE and DELETE for signed-in users (the project's
--    default grants), so the column-level grants added earlier did nothing. A person could set
--    is_sample (fake the "Sample data" badge) or inspiration_hidden (undo moderation) on their own
--    row, or change task_id and note after the fact. Reset to exactly what the app needs.
revoke all on public.task_completions from anon, authenticated;
grant select on public.task_completions to authenticated;
grant insert (task_id, user_id, note) on public.task_completions to authenticated;
grant update (share_publicly, share_thank_you) on public.task_completions to authenticated;

-- 2. The feed showed the first word of a display name as-is. A name with no space, such as an email
--    or a handle, leaked whole. Show a name only when its first word is a plain name (letters,
--    hyphen or apostrophe, at most 20 characters). Anything else becomes "A neighbor".
create or replace view public.inspiration_feed as
select
  c.id,
  c.task_id,
  t.title,
  g.name as group_name,
  g.slug as group_slug,
  g.color as group_color,
  t.effort,
  t.minutes,
  c.created_at,
  case
    when split_part(trim(p.display_name), ' ', 1) ~ '^[[:alpha:]''’-]{1,20}$'
    then split_part(trim(p.display_name), ' ', 1)
         || case
              when position(' ' in trim(p.display_name)) > 0
                and (regexp_match(trim(p.display_name), '(\S+)$'))[1] ~ '^[[:alpha:]]'
              then ' ' || upper(left((regexp_match(trim(p.display_name), '(\S+)$'))[1], 1)) || '.'
              else ''
            end
    else 'A neighbor'
  end as author_name,
  p.avatar_color,
  p.avatar_url,
  (c.share_thank_you and ty.id is not null) as has_thank_you,
  case when c.share_thank_you then ty.kind end as thank_kind,
  case when c.share_thank_you then ty.body end as thank_body,
  c.is_sample,
  (select count(*) from public.inspiration_reactions r where r.completion_id = c.id)::int
    as inspired_count,
  exists (
    select 1 from public.inspiration_reactions r
    where r.completion_id = c.id and r.user_id = (select auth.uid())
  ) as inspired_by_me,
  exists (
    select 1 from public.inspiration_saves s
    where s.completion_id = c.id and s.user_id = (select auth.uid())
  ) as saved_by_me,
  (c.user_id = (select auth.uid())) as is_mine,
  t.search
    || to_tsvector('simple'::regconfig, g.name)
    || to_tsvector(
         'simple'::regconfig,
         coalesce(case when c.share_thank_you then ty.body end, '')
       ) as search_doc
from public.task_completions c
join public.tasks t on t.id = c.task_id
join public.groups g on g.id = t.group_id
join public.profiles p on p.id = c.user_id
left join public.thank_yous ty on ty.completion_id = c.id
where c.share_publicly
  and not c.inspiration_hidden
  and not g.hidden
  and private.can_view_group(g.id)
  and not exists (
    select 1 from public.user_blocks b
    where b.blocker_id = (select auth.uid()) and b.blocked_id = c.user_id
  );
