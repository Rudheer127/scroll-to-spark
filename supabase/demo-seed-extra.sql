-- More sample activity so every group looks lived in. Safe to run once; membership rows skip duplicates.
insert into public.group_members (group_id, user_id)
select g.id, p.id from public.groups g cross join public.profiles p
where g.is_demo and p.is_demo
on conflict do nothing;

insert into public.threads (id, group_id, author_id, title, body, created_at) values
  ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-0000000000a1',
   'This Saturday: what the pantry needs most',
   'Canned beans, rice and diapers are low. If you cannot give things, a 5 minute thank-you note to our crew helps just as much.', now() - interval '6 hours'),
  ('30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-0000000000a5',
   'Algebra night: bring one question you are stuck on',
   'We will take them one at a time. No question is too basic.', now() - interval '8 hours'),
  ('30000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000a2',
   'First time helping? Read this',
   'You will not be handed a hard job. Pick a bag, pick a block, and we will meet you at the corner.', now() - interval '2 days'),
  ('30000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-0000000000a6',
   'One tiny thing that helped me sleep',
   'I write down one thing I can do tomorrow and then I put the phone away. Nothing magic, but it works for me.', now() - interval '2 days')
on conflict do nothing;

insert into public.comments (id, thread_id, parent_id, author_id, body, created_at) values
  ('40000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000005', null, '00000000-0000-4000-8000-0000000000a3', 'I can drop off rice on Friday.', now() - interval '5 hours'),
  ('40000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000006', null, '00000000-0000-4000-8000-0000000000a6', 'Can we do a few on factoring? I always freeze.', now() - interval '7 hours'),
  ('40000000-0000-4000-8000-00000000000a', '30000000-0000-4000-8000-000000000007', null, '00000000-0000-4000-8000-0000000000a4', 'I was nervous my first time too. Everyone was kind.', now() - interval '1 day'),
  ('40000000-0000-4000-8000-00000000000b', '30000000-0000-4000-8000-000000000008', null, '00000000-0000-4000-8000-0000000000a2', 'Trying this tonight, thank you.', now() - interval '1 day')
on conflict do nothing;

insert into public.thread_votes (thread_id, user_id, value)
select t.id, p.id, 1 from public.threads t cross join public.profiles p
where t.id in ('30000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000006','30000000-0000-4000-8000-000000000007','30000000-0000-4000-8000-000000000008')
  and p.is_demo and p.id <> t.author_id and right(p.id::text, 1) in ('2','3','4','5')
on conflict do nothing;
