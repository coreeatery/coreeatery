-- COREÉATERY
-- Restaurant + CMS media storage
-- Migration: 0007_restaurant_media_storage

-- =========================================================
-- STORAGE BUCKETS
-- =========================================================

insert into storage.buckets (
  id,
  name,
  public
)
values (
  'restaurant-media',
  'restaurant-media',
  true
)
on conflict (id) do update
set public = true;

insert into storage.buckets (
  id,
  name,
  public
)
values (
  'cms-media',
  'cms-media',
  true
)
on conflict (id) do update
set public = true;


-- =========================================================
-- RESTAURANT MEDIA
-- =========================================================

drop policy if exists restaurant_media_public_read
on storage.objects;

create policy restaurant_media_public_read
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'restaurant-media'
);


drop policy if exists restaurant_media_management_insert
on storage.objects;

create policy restaurant_media_management_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'restaurant-media'
  and public.has_role(
    array[
      'owner',
      'admin',
      'manager'
    ]::public.user_role[]
  )
);


drop policy if exists restaurant_media_management_update
on storage.objects;

create policy restaurant_media_management_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'restaurant-media'
  and public.has_role(
    array[
      'owner',
      'admin',
      'manager'
    ]::public.user_role[]
  )
)
with check (
  bucket_id = 'restaurant-media'
  and public.has_role(
    array[
      'owner',
      'admin',
      'manager'
    ]::public.user_role[]
  )
);


drop policy if exists restaurant_media_management_delete
on storage.objects;

create policy restaurant_media_management_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'restaurant-media'
  and public.has_role(
    array[
      'owner',
      'admin',
      'manager'
    ]::public.user_role[]
  )
);


-- =========================================================
-- CMS MEDIA
-- =========================================================

drop policy if exists cms_media_public_read
on storage.objects;

create policy cms_media_public_read
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'cms-media'
);


drop policy if exists cms_media_management_insert
on storage.objects;

create policy cms_media_management_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'cms-media'
  and public.has_role(
    array[
      'owner',
      'admin',
      'manager'
    ]::public.user_role[]
  )
);


drop policy if exists cms_media_management_update
on storage.objects;

create policy cms_media_management_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'cms-media'
  and public.has_role(
    array[
      'owner',
      'admin',
      'manager'
    ]::public.user_role[]
  )
)
with check (
  bucket_id = 'cms-media'
  and public.has_role(
    array[
      'owner',
      'admin',
      'manager'
    ]::public.user_role[]
  )
);


drop policy if exists cms_media_management_delete
on storage.objects;

create policy cms_media_management_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'cms-media'
  and public.has_role(
    array[
      'owner',
      'admin',
      'manager'
    ]::public.user_role[]
  )
);
