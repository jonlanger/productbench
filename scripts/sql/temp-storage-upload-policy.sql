-- Temporary: allow capture/sync scripts to upload via publishable key when
-- SUPABASE_SERVICE_ROLE_KEY is not available locally. Remove after bulk sync:
--   npm run storage:remove-upload-policy

drop policy if exists "Product screenshots allow authenticated upload" on storage.objects;

create policy "Product screenshots allow authenticated upload"
on storage.objects for insert
to public
with check (bucket_id = 'product-screenshots');

drop policy if exists "Product screenshots allow update" on storage.objects;

create policy "Product screenshots allow update"
on storage.objects for update
to public
using (bucket_id = 'product-screenshots');
