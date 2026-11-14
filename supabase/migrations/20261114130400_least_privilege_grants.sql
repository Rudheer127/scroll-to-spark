-- Match grants to the policies. Profiles are created by a trigger and never deleted by users.
-- Memberships and reactions are only added or removed, never edited.
revoke insert, delete on public.profiles from authenticated;
revoke update on public.group_members from authenticated;
revoke update on public.comment_reactions from authenticated;
