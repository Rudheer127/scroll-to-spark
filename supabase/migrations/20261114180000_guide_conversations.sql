-- Spark Guide chats: group guide messages into conversations a person can reopen and delete.
-- Old guide_messages rows keep a null conversation_id and are simply not listed.

-- guide_conversations: one row per chat, owned by one person ----------------------------------
create table public.guide_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index guide_conversations_user_id_updated_at_idx
  on public.guide_conversations (user_id, updated_at desc);

alter table public.guide_conversations enable row level security;
revoke all on public.guide_conversations from anon, authenticated;
grant select, delete on public.guide_conversations to authenticated;
-- No update grant: the server bumps updated_at with the service role, which bypasses grants.
grant insert (user_id, title) on public.guide_conversations to authenticated;
create policy "read own guide conversations" on public.guide_conversations
  for select to authenticated using (user_id = (select auth.uid()));
create policy "add own guide conversations" on public.guide_conversations
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "delete own guide conversations" on public.guide_conversations
  for delete to authenticated using (user_id = (select auth.uid()));

-- guide_messages: each message can belong to a conversation ------------------------------------
-- Deleting a conversation removes its messages through the foreign key, even though clients
-- have no delete grant on guide_messages.
alter table public.guide_messages
  add column conversation_id uuid references public.guide_conversations (id) on delete cascade;
create index guide_messages_conversation_id_created_at_idx
  on public.guide_messages (conversation_id, created_at);

grant insert (user_id, role, content, conversation_id) on public.guide_messages to authenticated;
drop policy "add own guide messages" on public.guide_messages;
create policy "add own guide messages" on public.guide_messages
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and role = 'user'
    and (
      conversation_id is null
      or exists (
        select 1 from public.guide_conversations c
        where c.id = conversation_id and c.user_id = (select auth.uid())
      )
    )
  );
