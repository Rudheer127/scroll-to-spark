-- Trust model and repeat completions.
-- 1. A group earns a "verified" flag. Only the service role or the SQL editor can set it; no client
--    grant covers the column, so the Data API cannot write it.
-- 2. Groups ask for verification with a form. One pending request per group.
-- 3. A person can complete the same step more than once, each with its own note.
-- 4. Closed steps cannot be completed, owners cannot complete their own group's steps, and
--    owners cannot thank their own completion.

alter table public.groups add column verified boolean not null default false;
comment on column public.groups.verified is
  'Set by hand after the group is checked. No role granted to clients can write this column.';

-- Verification requests -------------------------------------------------------------------------
create table public.group_verification_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  requested_by uuid not null references public.profiles (id) on delete cascade,
  contact text not null check (char_length(contact) between 5 and 200),
  proof_note text not null check (char_length(proof_note) between 10 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now()
);
create index group_verification_requests_group_id_idx
  on public.group_verification_requests (group_id);
create index group_verification_requests_requested_by_idx
  on public.group_verification_requests (requested_by);
create unique index group_verification_one_pending_idx
  on public.group_verification_requests (group_id) where status = 'pending';

alter table public.group_verification_requests enable row level security;

create policy "owners ask for verification" on public.group_verification_requests
  for insert to authenticated
  with check (
    requested_by = (select auth.uid()) and private.is_group_owner(group_id)
  );
create policy "owners see their requests" on public.group_verification_requests
  for select to authenticated
  using (private.is_group_owner(group_id));

grant select on public.group_verification_requests to authenticated;
grant insert (group_id, requested_by, contact, proof_note)
  on public.group_verification_requests to authenticated;

-- Repeat completions ----------------------------------------------------------------------------
alter table public.task_completions drop constraint task_completions_task_id_user_id_key;
create index task_completions_task_id_idx on public.task_completions (task_id);

-- Helper: is this task still open? Security definer so the policy can read tasks.
create function private.task_is_open(tid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select t.is_open from public.tasks t where t.id = tid), false);
$$;
revoke execute on function private.task_is_open(uuid) from public, anon;
grant execute on function private.task_is_open(uuid) to authenticated;

-- Completing: your own row, a visible and open task, and not a step from a group you own.
drop policy "complete a visible task" on public.task_completions;
create policy "complete a visible task" on public.task_completions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.can_view_group(private.task_group_id(task_id))
    and private.task_is_open(task_id)
    and not private.is_group_owner(private.task_group_id(task_id))
  );

-- Thanking: only the group owner, and never for their own completion.
drop policy "owners send thank-yous" on public.thank_yous;
create policy "owners send thank-yous" on public.thank_yous
  for insert to authenticated
  with check (
    from_user_id = (select auth.uid())
    and private.is_group_owner(private.completion_group_id(completion_id))
    and private.completion_user_id(completion_id) <> (select auth.uid())
  );
