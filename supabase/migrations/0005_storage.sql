-- 0005_storage.sql
-- Zelp Phase 1: storage bucket + policies.
--
-- Single public bucket `uploads`, since business/profile images need to
-- render on public pages without a signed URL round-trip.
--
-- Path convention: {kind}/{owner_id}/{filename}
--   kind     -- one of: avatars | logos | covers | gallery
--   owner_id -- the auth.uid() of the owning profile (business assets are
--               keyed by the *owning profile's* id, not the business id,
--               so a single, uniform policy check works for both profile
--               and business assets).
--
-- storage.foldername(name) splits the object path into an array of folder
-- segments, so for a path like "logos/<uuid>/photo.jpg":
--   (storage.foldername(name))[1] = 'logos'   -- the kind
--   (storage.foldername(name))[2] = '<uuid>'  -- the owner_id

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- storage.objects already has RLS enabled by default on Supabase projects;
-- this is included for idempotency / portability to a fresh Postgres
-- instance and is a no-op if already enabled.
alter table storage.objects enable row level security;

drop policy if exists "uploads_public_read" on storage.objects;
create policy "uploads_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'uploads');

drop policy if exists "uploads_insert_own" on storage.objects;
create policy "uploads_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'uploads'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "uploads_update_own" on storage.objects;
create policy "uploads_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'uploads'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "uploads_delete_own" on storage.objects;
create policy "uploads_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'uploads'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
