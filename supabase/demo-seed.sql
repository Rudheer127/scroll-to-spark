-- Sample data for the demo account. Run once. Everything here is marked is_demo, so only the demo
-- account can see it. Replace __DEMO_PASSWORD__ before running; never commit the real password.
-- The demo login is demo@scrolltospark.test. The other sample people have no password and cannot sign in.

-- People ----------------------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', v.id::uuid, 'authenticated', 'authenticated', v.email,
  case when v.is_login then extensions.crypt('__DEMO_PASSWORD__', extensions.gen_salt('bf')) else '' end,
  now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', '', '', '', '', ''
from (values
  ('00000000-0000-4000-8000-0000000000a1', 'demo@scrolltospark.test', true),
  ('00000000-0000-4000-8000-0000000000a2', 'maya@sample.invalid', false),
  ('00000000-0000-4000-8000-0000000000a3', 'jordan@sample.invalid', false),
  ('00000000-0000-4000-8000-0000000000a4', 'amira@sample.invalid', false),
  ('00000000-0000-4000-8000-0000000000a5', 'sam@sample.invalid', false),
  ('00000000-0000-4000-8000-0000000000a6', 'priya@sample.invalid', false)
) as v(id, email, is_login);

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  '00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a1',
  '{"sub":"00000000-0000-4000-8000-0000000000a1","email":"demo@scrolltospark.test","email_verified":true}',
  'email', now(), now(), now()
);

update public.profiles p
set is_demo = true, username = v.username, display_name = v.display_name, avatar_color = v.color
from (values
  ('00000000-0000-4000-8000-0000000000a1'::uuid, 'demo_account', 'Demo Account', 'green'),
  ('00000000-0000-4000-8000-0000000000a2'::uuid, 'maya_r', 'Maya R', 'purple'),
  ('00000000-0000-4000-8000-0000000000a3'::uuid, 'jordan_t', 'Jordan T', 'orange'),
  ('00000000-0000-4000-8000-0000000000a4'::uuid, 'amira_k', 'Amira K', 'indigo'),
  ('00000000-0000-4000-8000-0000000000a5'::uuid, 'sam_l', 'Sam L', 'blue'),
  ('00000000-0000-4000-8000-0000000000a6'::uuid, 'priya_n', 'Priya N', 'pink')
) as v(id, username, display_name, color)
where p.id = v.id;

-- Groups (the owner is added as a member by a trigger) ---------------------------------------------
insert into public.groups (id, slug, name, description, color, owner_id, is_demo, created_at) values
  ('10000000-0000-4000-8000-000000000001', 'tiny-acts', 'Tiny Acts',
   'Small, real things we do for our communities. Share wins, ask for ideas, cheer each other on.',
   'pink', '00000000-0000-4000-8000-0000000000a2', true, now() - interval '20 days'),
  ('10000000-0000-4000-8000-000000000002', 'campus-cleanup', 'Campus Cleanup',
   'Short shifts, snacks and a group chat so nobody feels lost.',
   'purple', '00000000-0000-4000-8000-0000000000a3', true, now() - interval '18 days'),
  ('10000000-0000-4000-8000-000000000003', 'night-owls', 'Night Owls',
   'For when the news feels heavy. Turn worry into something small and real.',
   'indigo', '00000000-0000-4000-8000-0000000000a4', true, now() - interval '15 days'),
  ('10000000-0000-4000-8000-000000000004', 'maple-street-food-pantry', 'Maple Street Food Pantry',
   'A neighborhood pantry. We sort donations every Saturday and read every note out loud.',
   'green', '00000000-0000-4000-8000-0000000000a1', true, now() - interval '25 days'),
  ('10000000-0000-4000-8000-000000000005', 'study-buddies', 'Study Buddies',
   'Free peer tutoring and study help for anyone.',
   'orange', '00000000-0000-4000-8000-0000000000a5', true, now() - interval '12 days');

insert into public.group_members (group_id, user_id) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1'),
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a3'),
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a4'),
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a5'),
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a6'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000a1'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000a2'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000a6'),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-0000000000a1'),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-0000000000a2'),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-0000000000a6'),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-0000000000a2'),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-0000000000a3'),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-0000000000a4'),
  ('10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-0000000000a1'),
  ('10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-0000000000a6');

-- Tasks -----------------------------------------------------------------------------------------
insert into public.tasks (id, group_id, created_by, title, description, minutes, effort, place, created_at) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-0000000000a1',
   'Write a thank-you note to our Saturday crew', 'Write 2 or 3 lines to say thanks. We read every note out loud at lunch.', 5, 'tiny', 'home', now() - interval '10 days'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-0000000000a1',
   'Tag photos for our archive', 'Add a short caption to 40 photos so families can find them.', 20, 'medium', 'home', now() - interval '9 days'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-0000000000a1',
   'Help at the Saturday sort', 'Two hours sorting and packing donations. Snacks provided.', 120, 'big', 'in_person', now() - interval '8 days'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000a3',
   'Pick up litter near your building for 10 minutes', 'Bring a bag. Send us a photo or a line about what you found.', 10, 'tiny', 'in_person', now() - interval '7 days'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a2',
   'Send one kind message to someone who helped you', 'A text is enough. Tell us how it went.', 5, 'tiny', 'home', now() - interval '6 days'),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-0000000000a5',
   'Answer one question in the study help thread', 'Pick any question you can help with and write a short answer.', 15, 'medium', 'home', now() - interval '5 days'),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-0000000000a4',
   'Write down one thing that felt hopeful today', 'Share it with the group or keep it for yourself.', 5, 'tiny', 'home', now() - interval '4 days'),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000a3',
   'Share the cleanup sign-up link with 3 friends', 'Send the link in a chat. That is all.', 10, 'tiny', 'home', now() - interval '3 days'),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-0000000000a5',
   'Host a 30 minute study hour', 'Open a call, share the link, and help whoever shows up.', 30, 'big', 'either', now() - interval '2 days');

-- Completions and thank-yous --------------------------------------------------------------------
insert into public.task_completions (id, task_id, user_id, note, created_at) values
  ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a2',
   'Thank you for sorting donations every week. It means a lot to people like my grandma who rely on you.', now() - interval '3 hours'),
  ('21000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a3',
   'You make Saturdays better for a lot of families. Thank you for showing up.', now() - interval '1 day'),
  ('21000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000a4',
   'Tagged 40 photos. Some of them made me smile.', now() - interval '1 day 4 hours'),
  ('21000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a5',
   'Thanks to everyone who gives their Saturdays.', now() - interval '2 days'),
  ('21000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-0000000000a1',
   'Filled one bag in 10 minutes. More than I expected.', now() - interval '2 days'),
  ('21000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-0000000000a1',
   'Texted my old teacher. She replied within a minute.', now() - interval '4 days'),
  ('21000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-0000000000a1',
   'Explained how to check a quadratic with the discriminant.', now() - interval '5 hours');

insert into public.thank_yous (completion_id, from_user_id, kind, body, created_at) values
  ('21000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-0000000000a1', 'tap', null, now() - interval '1 day'),
  ('21000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-0000000000a3', 'written',
   'Thank you! One bag is a real help. Come say hi at the next cleanup if you can.', now() - interval '1 day'),
  ('21000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-0000000000a2', 'tap', null, now() - interval '3 days');

-- Threads, comments, reactions and votes ---------------------------------------------------------
insert into public.threads (id, group_id, author_id, title, body, created_at) values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a2',
   'What is the smallest thing you did for someone this week?',
   'I wrote a 3 line note to a food pantry on my phone. It took 4 minutes and I felt weirdly proud. What about you? No act is too small.', now() - interval '3 hours'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a3',
   'Weekend plan: 10 minute tasks anyone can join',
   'Drop your idea below. We will pick three and post them Friday.', now() - interval '1 day'),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000a3',
   'We picked up 14 bags on Saturday. Here is what worked.',
   'Short shifts, snacks, and a group chat so nobody felt lost.', now() - interval '5 hours'),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-0000000000a4',
   'Feeling overwhelmed by the news. How do you cope?',
   'Not looking for advice on politics, just how you turn worry into something small and real.', now() - interval '1 day');

insert into public.comments (id, thread_id, parent_id, author_id, body, created_at) values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', null, '00000000-0000-4000-8000-0000000000a6',
   'I messaged an old teacher to say thanks. She wrote back within a minute and I almost cried.', now() - interval '2 hours'),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a3',
   'That is lovely. I did the same last month and it made my whole week.', now() - interval '110 minutes'),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000a5',
   'Same here. Did they write back?', now() - interval '1 hour'),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000001', null, '00000000-0000-4000-8000-0000000000a4',
   'I helped a neighbor carry groceries. Four minutes, nothing fancy.', now() - interval '2 hours'),
  ('40000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000001', null, '00000000-0000-4000-8000-0000000000a1',
   'Love this thread. Reminder: no pressure and no guilt. Every small act counts.', now() - interval '90 minutes'),
  ('40000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000003', null, '00000000-0000-4000-8000-0000000000a6',
   'The group chat is the real secret. Nobody wants to feel lost on day one.', now() - interval '4 hours'),
  ('40000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000004', null, '00000000-0000-4000-8000-0000000000a2',
   'I pick one small thing and do it right away. It stops the spiral for me.', now() - interval '20 hours');

insert into public.comment_reactions (comment_id, user_id, emoji) values
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a2', '❤️'),
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a3', '❤️'),
  ('40000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1', '🌱'),
  ('40000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-0000000000a1', '🙌'),
  ('40000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-0000000000a5', '🙌'),
  ('40000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-0000000000a2', '❤️');

insert into public.thread_votes (thread_id, user_id, value) values
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a1', 1),
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a3', 1),
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a4', 1),
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000a5', 1),
  ('30000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000a2', 1),
  ('30000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000a6', 1),
  ('30000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-0000000000a1', 1),
  ('30000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-0000000000a6', 1),
  ('30000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-0000000000a2', 1),
  ('30000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-0000000000a1', 1);
