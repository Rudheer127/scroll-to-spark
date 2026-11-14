-- Private bucket for images in threads and comments.
-- Limits: 5 MB, images only. Each person writes only inside a folder named after their user id.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comment-images',
  'comment-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "upload into own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'comment-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "signed in users read comment images" on storage.objects
  for select to authenticated
  using (bucket_id = 'comment-images');

create policy "delete own images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'comment-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
