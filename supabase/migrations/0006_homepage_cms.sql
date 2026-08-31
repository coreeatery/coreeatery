-- COREÉATERY
-- Homepage CMS
-- Migration: 0006_homepage_cms

create table if not exists public.homepage_settings (
  id uuid primary key default gen_random_uuid(),

  hero_title_id text,
  hero_title_en text,

  hero_subtitle_id text,
  hero_subtitle_en text,

  hero_image_url text,

  about_title_id text,
  about_title_en text,

  about_description_id text,
  about_description_en text,

  about_image_url text,

  reservation_title_id text,
  reservation_title_en text,

  reservation_description_id text,
  reservation_description_en text,

  reservation_button_text_id text default 'Reservasi Sekarang',
  reservation_button_text_en text default 'Make a Reservation',

  whatsapp_number text,

  address text,

  google_maps_url text,

  instagram_url text,

  opening_hours text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_homepage_settings_active
on public.homepage_settings(is_active)
where is_active = true;

create trigger homepage_settings_updated_at
before update on public.homepage_settings
for each row
execute function public.set_updated_at();


-- =========================================================
-- HOMEPAGE HERO SLIDES
-- =========================================================

create table if not exists public.homepage_hero_slides (
  id uuid primary key default gen_random_uuid(),

  title_id text,
  title_en text,

  subtitle_id text,
  subtitle_en text,

  image_url text not null,

  button_text_id text,
  button_text_en text,

  button_url text,

  sort_order integer not null default 0,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_homepage_hero_slides_sort
on public.homepage_hero_slides(sort_order);

create index if not exists idx_homepage_hero_slides_active
on public.homepage_hero_slides(is_active);

create trigger homepage_hero_slides_updated_at
before update on public.homepage_hero_slides
for each row
execute function public.set_updated_at();


-- =========================================================
-- GALLERY
-- =========================================================

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),

  title text,

  image_url text not null,

  alt_text text,

  sort_order integer not null default 0,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gallery_items_sort
on public.gallery_items(sort_order);

create index if not exists idx_gallery_items_active
on public.gallery_items(is_active);

create trigger gallery_items_updated_at
before update on public.gallery_items
for each row
execute function public.set_updated_at();


-- =========================================================
-- PROMOTIONS
-- =========================================================

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),

  title_id text not null,
  title_en text,

  description_id text,
  description_en text,

  image_url text,

  discount_text text,

  start_date date,
  end_date date,

  sort_order integer not null default 0,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_promotions_active
on public.promotions(is_active);

create index if not exists idx_promotions_dates
on public.promotions(start_date, end_date);

create trigger promotions_updated_at
before update on public.promotions
for each row
execute function public.set_updated_at();


-- =========================================================
-- RLS
-- =========================================================

alter table public.homepage_settings enable row level security;
alter table public.homepage_hero_slides enable row level security;
alter table public.gallery_items enable row level security;
alter table public.promotions enable row level security;


-- PUBLIC READ
create policy homepage_settings_public_read
on public.homepage_settings
for select
to anon, authenticated
using (is_active = true);


create policy homepage_hero_public_read
on public.homepage_hero_slides
for select
to anon, authenticated
using (is_active = true);


create policy gallery_public_read
on public.gallery_items
for select
to anon, authenticated
using (is_active = true);


create policy promotions_public_read
on public.promotions
for select
to anon, authenticated
using (is_active = true);


-- MANAGEMENT
create policy homepage_settings_management
on public.homepage_settings
for all
to authenticated
using (
  public.has_role(
    array['owner','admin','manager']::public.user_role[]
  )
)
with check (
  public.has_role(
    array['owner','admin','manager']::public.user_role[]
  )
);


create policy homepage_hero_management
on public.homepage_hero_slides
for all
to authenticated
using (
  public.has_role(
    array['owner','admin','manager']::public.user_role[]
  )
)
with check (
  public.has_role(
    array['owner','admin','manager']::public.user_role[]
  )
);


create policy gallery_management
on public.gallery_items
for all
to authenticated
using (
  public.has_role(
    array['owner','admin','manager']::public.user_role[]
  )
)
with check (
  public.has_role(
    array['owner','admin','manager']::public.user_role[]
  )
);


create policy promotions_management
on public.promotions
for all
to authenticated
using (
  public.has_role(
    array['owner','admin','manager']::public.user_role[]
  )
)
with check (
  public.has_role(
    array['owner','admin','manager']::public.user_role[]
  )
);


-- =========================================================
-- GRANTS
-- =========================================================

grant select on public.homepage_settings to anon, authenticated;
grant select on public.homepage_hero_slides to anon, authenticated;
grant select on public.gallery_items to anon, authenticated;
grant select on public.promotions to anon, authenticated;

grant select, insert, update, delete
on public.homepage_settings
to authenticated;

grant select, insert, update, delete
on public.homepage_hero_slides
to authenticated;

grant select, insert, update, delete
on public.gallery_items
to authenticated;

grant select, insert, update, delete
on public.promotions
to authenticated;
