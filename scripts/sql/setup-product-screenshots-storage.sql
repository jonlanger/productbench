-- Public product screenshot bucket (Playwright capture → Storage sync).
-- Writes use the service role from scripts (bypasses RLS).
-- Public read so next/image and the catalog can load shots without auth.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-screenshots',
  'product-screenshots',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Product screenshots are publicly accessible" on storage.objects;

create policy "Product screenshots are publicly accessible"
on storage.objects for select
to public
using (bucket_id = 'product-screenshots');
