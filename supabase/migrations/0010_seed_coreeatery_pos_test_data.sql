-- COREÉATERY
-- Migration: 0010_seed_coreeatery_pos_test_data
-- Purpose: Seed minimal master data for end-to-end POS testing

-- =========================================================
-- MENU CATEGORIES
-- =========================================================

insert into public.menu_categories
  (name_id, name_en, name_zh, slug, sort_order, is_active)
values
  ('Nusantara', 'Nusantara', '印尼菜', 'nusantara', 1, true),
  ('Western', 'Western', '西餐', 'western', 2, true),
  ('Rice Bowl', 'Rice Bowl', '盖饭', 'rice-bowl', 3, true),
  ('Appetizer', 'Appetizer', '前菜', 'appetizer', 4, true),
  ('Dessert', 'Dessert', '甜点', 'dessert', 5, true),
  ('Coffee', 'Coffee', '咖啡', 'coffee', 6, true),
  ('Drinks', 'Drinks', '饮料', 'drinks', 7, true),
  ('Paket Hemat', 'Value Package', '套餐', 'paket-hemat', 8, true)
on conflict (slug) do update
set
  name_id = excluded.name_id,
  name_en = excluded.name_en,
  name_zh = excluded.name_zh,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- =========================================================
-- MENU ITEMS
-- =========================================================

insert into public.menu_items
  (
    category_id,
    name_id,
    name_en,
    name_zh,
    description_id,
    description_en,
    slug,
    base_price,
    status,
    is_available,
    sort_order
  )
select
  c.id,
  v.name_id,
  v.name_en,
  v.name_zh,
  v.description_id,
  v.description_en,
  v.slug,
  v.base_price,
  'active'::public.menu_item_status,
  true,
  v.sort_order
from (
  values
    (
      'nusantara',
      'Nasi Goreng Original',
      'Original Fried Rice',
      '原味炒饭',
      'Nasi goreng klasik dengan cita rasa gurih.',
      'Classic fried rice with a savory taste.',
      'nasi-goreng-original',
      35000::numeric,
      1
    ),
    (
      'nusantara',
      'Soto Lamongan',
      'Lamongan Soto',
      '拉蒙岸鸡汤',
      'Soto khas Lamongan dengan kuah gurih.',
      'Traditional Lamongan-style soup with savory broth.',
      'soto-lamongan',
      40000::numeric,
      2
    ),
    (
      'western',
      'Tenderloin Steak',
      'Tenderloin Steak',
      '菲力牛排',
      'Tenderloin steak premium.',
      'Premium tenderloin steak.',
      'tenderloin-steak',
      130000::numeric,
      3
    ),
    (
      'rice-bowl',
      'Beef Blackpepper Don',
      'Beef Blackpepper Don',
      '黑椒牛肉盖饭',
      'Rice bowl dengan beef blackpepper.',
      'Beef blackpepper rice bowl.',
      'beef-blackpepper-don',
      37000::numeric,
      4
    ),
    (
      'appetizer',
      'Salt Pepper Tofu',
      'Salt Pepper Tofu',
      '椒盐豆腐',
      'Tahu goreng dengan bumbu salt pepper.',
      'Fried tofu with salt pepper seasoning.',
      'salt-pepper-tofu',
      23000::numeric,
      5
    ),
    (
      'dessert',
      'Original Classic Cheesecake',
      'Original Classic Cheesecake',
      '经典芝士蛋糕',
      'Cheesecake klasik.',
      'Classic cheesecake.',
      'original-classic-cheesecake',
      36000::numeric,
      6
    ),
    (
      'coffee',
      'Americano',
      'Americano',
      '美式咖啡',
      'Kopi espresso dengan air.',
      'Espresso with water.',
      'americano',
      22000::numeric,
      7
    ),
    (
      'drinks',
      'Sunset Yuzu',
      'Sunset Yuzu',
      '日落柚子饮',
      'Minuman citrus segar.',
      'Refreshing citrus drink.',
      'sunset-yuzu',
      35000::numeric,
      8
    )
) as v(
  category_slug,
  name_id,
  name_en,
  name_zh,
  description_id,
  description_en,
  slug,
  base_price,
  sort_order
)
join public.menu_categories c
  on c.slug = v.category_slug
on conflict (slug) do update
set
  category_id = excluded.category_id,
  name_id = excluded.name_id,
  name_en = excluded.name_en,
  name_zh = excluded.name_zh,
  description_id = excluded.description_id,
  description_en = excluded.description_en,
  base_price = excluded.base_price,
  status = excluded.status,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;

-- =========================================================
-- AMERICANO VARIANTS
-- =========================================================

insert into public.menu_variants
  (
    menu_item_id,
    name_id,
    name_en,
    name_zh,
    price,
    is_available,
    sort_order
  )
select
  m.id,
  v.name_id,
  v.name_en,
  v.name_zh,
  v.price,
  v.is_available,
  v.sort_order
from public.menu_items m
cross join (
  values
    ('Hot', 'Hot', '热', 22000::numeric, true, 1),
    ('Cold', 'Cold', '冰', 24000::numeric, true, 2)
) as v(
  name_id,
  name_en,
  name_zh,
  price,
  is_available,
  sort_order
)
where m.slug = 'americano'
  and not exists (
    select 1
    from public.menu_variants existing
    where existing.menu_item_id = m.id
      and existing.name_id = v.name_id
  );

-- =========================================================
-- RESTAURANT TABLES
-- =========================================================

do $$
begin
  insert into public.restaurant_tables
    (table_number, capacity, location, is_active)
  select
    v.table_number,
    v.capacity,
    v.location,
    v.is_active
  from (
    values
      ('T01', 2, 'Indoor', true),
      ('T02', 4, 'Indoor', true),
      ('T03', 4, 'Indoor', true)
  ) as v(table_number, capacity, location, is_active)
  where not exists (
    select 1
    from public.restaurant_tables rt
    where rt.table_number = v.table_number
  );

  update public.restaurant_tables
  set
    capacity = case table_number
      when 'T01' then 2
      when 'T02' then 4
      when 'T03' then 4
      else capacity
    end,
    location = case
      when table_number in ('T01', 'T02', 'T03') then 'Indoor'
      else location
    end,
    is_active = case
      when table_number in ('T01', 'T02', 'T03') then true
      else is_active
    end
  where table_number in ('T01', 'T02', 'T03');
end
$$;
