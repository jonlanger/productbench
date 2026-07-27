-- Public submissions bucket for user-contributed product screenshots
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions',
  'submissions',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Submission images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload submission images" on storage.objects;
drop policy if exists "Users can update their submission images" on storage.objects;
drop policy if exists "Users can delete their submission images" on storage.objects;

create policy "Submission images are publicly accessible"
on storage.objects for select
to public
using (bucket_id = 'submissions');

create policy "Users can upload submission images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'submissions'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can update their submission images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'submissions'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'submissions'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can delete their submission images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'submissions'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
