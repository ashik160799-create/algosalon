-- =============================================================================
-- App Background Images Storage Bucket & Admin Access Control Policies
-- Bucket: app-background-images
-- Access Rule: Don't access any standard users for uploads/modifications. Access Admin (ashik160799@gmail.com / service_role) only.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'app-background-images',
  'app-background-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- 1. Public Read Access: Allows the application screen display to render background images
drop policy if exists "Public Read App Background Images" on storage.objects;
create policy "Public Read App Background Images"
  on storage.objects for select
  using (bucket_id = 'app-background-images');

-- 2. Strict Admin Only Insert / Upload Policy
drop policy if exists "Admin Only Upload App Background Images" on storage.objects;
create policy "Admin Only Upload App Background Images"
  on storage.objects for insert
  with check (
    bucket_id = 'app-background-images' and (
      auth.role() = 'service_role' or
      (auth.jwt() ->> 'email') = 'ashik160799@gmail.com' or
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    )
  );

-- 3. Strict Admin Only Update / Modify Policy
drop policy if exists "Admin Only Update App Background Images" on storage.objects;
create policy "Admin Only Update App Background Images"
  on storage.objects for update
  using (
    bucket_id = 'app-background-images' and (
      auth.role() = 'service_role' or
      (auth.jwt() ->> 'email') = 'ashik160799@gmail.com' or
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    )
  );

-- 4. Strict Admin Only Delete Policy
drop policy if exists "Admin Only Delete App Background Images" on storage.objects;
create policy "Admin Only Delete App Background Images"
  on storage.objects for delete
  using (
    bucket_id = 'app-background-images' and (
      auth.role() = 'service_role' or
      (auth.jwt() ->> 'email') = 'ashik160799@gmail.com' or
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
    )
  );
