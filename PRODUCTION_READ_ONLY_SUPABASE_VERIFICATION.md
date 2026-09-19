# COREÉATERY — Verifikasi Production Supabase (Read-only)

Dokumen ini untuk dijalankan manual di Supabase SQL Editor. Semua statement executable di bawah adalah `SELECT`; tidak ada migration, pemanggilan RPC aplikasi, DML, DDL, atau secret.

Jalankan sebagai role administratif agar metadata katalog terlihat lengkap. Jangan membagikan output yang mengandung data sensitif; query ini tidak meminta secret.

## 1. Discovery dan status migration 0018

Tujuan: menemukan migration-history relation yang tersedia tanpa mengasumsikan versi Supabase.

```sql
select
  n.nspname as schema_name,
  c.relname as relation_name,
  c.relkind as relation_kind,
  pg_catalog.pg_get_userbyid(c.relowner) as relation_owner
from pg_catalog.pg_class as c
join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
where n.nspname in ('supabase_migrations', 'auth')
  and c.relname in ('schema_migrations', 'migrations')
order by n.nspname, c.relname;
```

Interpretasi: bila `supabase_migrations.schema_migrations` tidak muncul, jangan jalankan 1B. Catat status migration sebagai `BLOCKED` dan gunakan history relation yang ditemukan atau dashboard Supabase.

### 1B. Jalankan hanya bila `supabase_migrations.schema_migrations` muncul di 1A

Tujuan: memeriksa record migration yang berawalan `0018`.

```sql
select *
from supabase_migrations.schema_migrations
where version::text like '0018%'
order by version::text;
```

Interpretasi: minimal satu row berawalan `0018` diperlukan untuk menyatakan migration tercatat. Query memakai `select *` agar tidak mengasumsikan nama kolom migration history. Jika relation tidak ada, query ini akan gagal; itu bukan bukti migration belum diterapkan.

## 2. Semua SECURITY DEFINER di `public`

Tujuan: inventaris signature, owner, bahasa, volatility, konfigurasi fungsi (`search_path` bila ada), dan hak EXECUTE efektif.

```sql
select
  p.oid::regprocedure as function_identity,
  pg_catalog.pg_get_function_identity_arguments(p.oid) as identity_arguments,
  pg_catalog.pg_get_userbyid(p.proowner) as function_owner,
  l.lanname as language,
  case p.provolatile when 'i' then 'immutable' when 's' then 'stable' when 'v' then 'volatile' end as volatility,
  p.prosecdef as security_definer,
  coalesce(array_to_string(p.proconfig, ', '), '(no per-function settings)') as function_settings,
  pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute_effective,
  pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute_effective,
  exists (
    select 1
    from pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) as acl
    where acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
  ) as public_has_direct_execute
from pg_catalog.pg_proc as p
join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
join pg_catalog.pg_language as l on l.oid = p.prolang
where n.nspname = 'public' and p.prosecdef
order by p.oid::regprocedure::text;
```

Interpretasi: fungsi privileged yang bukan API allowlist harus `false` untuk anon, authenticated, dan PUBLIC direct execute. SECURITY DEFINER tanpa setting per-function atau tanpa `search_path` trusted perlu ditinjau. Nilai hardening yang diharapkan mencakup `pg_catalog, public, extensions, pg_temp`.

## 3. ACL EXECUTE langsung seluruh fungsi `public`

Tujuan: menampilkan grant eksplisit untuk signature fungsi yang benar, termasuk `PUBLIC`.

```sql
select
  p.oid::regprocedure as function_identity,
  coalesce(r.rolname, 'PUBLIC') as grantee,
  acl.privilege_type,
  acl.is_grantable,
  pg_catalog.pg_get_userbyid(p.proowner) as function_owner
from pg_catalog.pg_proc as p
join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
cross join lateral pg_catalog.aclexplode(
  coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))
) as acl
left join pg_catalog.pg_roles as r on r.oid = acl.grantee
where n.nspname = 'public' and acl.privilege_type = 'EXECUTE'
order by p.oid::regprocedure::text, grantee;
```

Interpretasi: `PUBLIC` memberi akses kepada semua role. Untuk SECURITY DEFINER, `PUBLIC EXECUTE` adalah temuan prioritas tinggi kecuali fungsi adalah API publik yang sengaja direview. Query 2 menunjukkan hak efektif anon/authenticated.

## 4. Kontrol fungsi berisiko

Tujuan: memeriksa keberadaan, tipe security, owner, search path, dan privilege efektif fungsi fokus audit.

```sql
select
  p.oid::regprocedure as function_identity,
  p.prosecdef as security_definer,
  pg_catalog.pg_get_userbyid(p.proowner) as function_owner,
  coalesce(array_to_string(p.proconfig, ', '), '(no per-function settings)') as function_settings,
  pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute_effective,
  pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute_effective,
  exists (
    select 1 from pg_catalog.aclexplode(
      coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))
    ) as acl where acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
  ) as public_has_direct_execute
from pg_catalog.pg_proc as p
join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.oid::regprocedure::text in (
    'public.expire_overdue_cash_register_shifts()',
    'public.generate_daily_sales_summary(date)',
    'public.get_current_cash_register_shift_schedule(timestamp with time zone)',
    'public.generate_reservation_code()'
  )
order by p.oid::regprocedure::text;
```

Interpretasi:

- `expire_overdue_cash_register_shifts()` harus tidak executable oleh anon maupun authenticated.
- `generate_daily_sales_summary(date)` harus tidak executable oleh anon/PUBLIC; authenticated hanya bila guard role telah direview.
- `get_current_cash_register_shift_schedule(timestamptz)` memerlukan keputusan product: deny untuk API roles bila tidak dipakai, atau authenticated-only bila memang diperlukan.
- `generate_reservation_code()` diharapkan SECURITY INVOKER, executable efektif untuk anon/authenticated, tetapi tanpa direct `PUBLIC EXECUTE` setelah hardening.

Jika fungsi tidak muncul, catat `BLOCKED`: ia dapat tidak ada, signature berbeda, atau belum dideploy. Gunakan query 2 untuk identity aktual.

## 5. RLS pada tabel aplikasi yang diharapkan

Tujuan: membedakan tabel yang hilang dari tabel yang ada tetapi RLS-nya tidak aktif.

```sql
with expected_tables(table_name) as (
  values
    ('profiles'), ('menu_categories'), ('menu_items'), ('menu_variants'),
    ('restaurant_tables'), ('reservations'), ('orders'), ('order_items'),
    ('payments'), ('cash_register_shifts'), ('cash_register_movements'),
    ('cash_register_shift_schedules'), ('homepage_settings'),
    ('homepage_hero_slides'), ('gallery_items'), ('promotions'), ('suppliers'),
    ('inventory_items'), ('inventory_movements'), ('recipes'), ('purchase_orders'),
    ('purchase_order_items'), ('kitchen_tickets'), ('notifications'),
    ('daily_sales_summaries')
)
select
  e.table_name,
  c.oid is not null as table_exists,
  coalesce(c.relrowsecurity, false) as rls_enabled,
  coalesce(c.relforcerowsecurity, false) as rls_forced,
  pg_catalog.has_table_privilege('anon', c.oid, 'SELECT') as anon_select_effective,
  pg_catalog.has_table_privilege('anon', c.oid, 'INSERT') as anon_insert_effective,
  pg_catalog.has_table_privilege('authenticated', c.oid, 'SELECT') as authenticated_select_effective,
  pg_catalog.has_table_privilege('authenticated', c.oid, 'INSERT') as authenticated_insert_effective,
  pg_catalog.has_table_privilege('authenticated', c.oid, 'UPDATE') as authenticated_update_effective,
  pg_catalog.has_table_privilege('authenticated', c.oid, 'DELETE') as authenticated_delete_effective
from expected_tables as e
left join pg_catalog.pg_class as c
  on c.oid = pg_catalog.to_regclass(format('public.%I', e.table_name))
order by e.table_name;
```

Interpretasi: tabel aplikasi yang ada seharusnya `rls_enabled = true`. `table_exists = false` berarti table/migration belum ada atau namanya berbeda. Privilege tabel bukan bukti row access; baca bersama query 6.

## 6. RLS policies aplikasi dan Storage

Tujuan: menampilkan role, command, `USING`, dan `WITH CHECK` policy yang benar-benar ada.

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
from pg_catalog.pg_policies
where (schemaname = 'public' and tablename in (
  'profiles', 'menu_categories', 'menu_items', 'menu_variants', 'restaurant_tables',
  'reservations', 'orders', 'order_items', 'payments', 'cash_register_shifts',
  'cash_register_movements', 'cash_register_shift_schedules', 'homepage_settings',
  'homepage_hero_slides', 'gallery_items', 'promotions', 'suppliers', 'inventory_items',
  'inventory_movements', 'recipes', 'purchase_orders', 'purchase_order_items',
  'kitchen_tickets', 'notifications', 'daily_sales_summaries'
)) or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;
```

Interpretasi: policy `UPDATE` harus memiliki `USING` dan `WITH CHECK`. `reservations_public_insert` seharusnya membatasi `status = 'pending'`, `table_id is null`, dan `created_by is null`. Jika view `pg_policies` tidak tersedia/ditolak, hasil policy adalah `BLOCKED`, bukan bukti policy tidak ada.

## 7. Trigger dan target function

Tujuan: memeriksa trigger aplikasi dan `auth.users` tanpa memanggil trigger.

```sql
select
  table_schema.nspname as table_schema,
  table_class.relname as table_name,
  trigger_class.tgname as trigger_name,
  trigger_function.oid::regprocedure as trigger_function_identity,
  trigger_function.prosecdef as target_is_security_definer,
  pg_catalog.pg_get_userbyid(trigger_function.proowner) as target_function_owner,
  pg_catalog.pg_get_triggerdef(trigger_class.oid, true) as trigger_definition
from pg_catalog.pg_trigger as trigger_class
join pg_catalog.pg_class as table_class on table_class.oid = trigger_class.tgrelid
join pg_catalog.pg_namespace as table_schema on table_schema.oid = table_class.relnamespace
join pg_catalog.pg_proc as trigger_function on trigger_function.oid = trigger_class.tgfoid
where not trigger_class.tgisinternal
  and table_schema.nspname in ('public', 'auth')
order by table_schema, table_name, trigger_name;
```

Interpretasi: source mengharapkan trigger updated-at, `protect_profile_privileged_fields`, dan `on_auth_user_created`. Target SECURITY DEFINER harus kembali diverifikasi di query 2. Jika katalog `auth` tidak terlihat, catat trigger auth sebagai `BLOCKED`.

## 8. Privilege schema

Tujuan: memeriksa hak efektif `USAGE`/`CREATE` API roles serta ACL langsung schema yang dipakai search path.

```sql
select
  n.nspname as schema_name,
  pg_catalog.has_schema_privilege('anon', n.oid, 'USAGE') as anon_usage_effective,
  pg_catalog.has_schema_privilege('anon', n.oid, 'CREATE') as anon_create_effective,
  pg_catalog.has_schema_privilege('authenticated', n.oid, 'USAGE') as authenticated_usage_effective,
  pg_catalog.has_schema_privilege('authenticated', n.oid, 'CREATE') as authenticated_create_effective,
  coalesce(r.rolname, 'PUBLIC') as acl_grantee,
  acl.privilege_type as direct_privilege,
  acl.is_grantable
from pg_catalog.pg_namespace as n
cross join lateral pg_catalog.aclexplode(
  coalesce(n.nspacl, pg_catalog.acldefault('n', n.nspowner))
) as acl
left join pg_catalog.pg_roles as r on r.oid = acl.grantee
where n.nspname in ('public', 'extensions', 'auth')
order by n.nspname, acl_grantee, direct_privilege;
```

Interpretasi: `anon_create_effective` dan `authenticated_create_effective` harus false pada `public` serta setiap schema yang dicari SECURITY DEFINER. `PUBLIC CREATE` pada `public` adalah temuan kritis bila fungsi privileged mencari schema itu.

## 9. Extensions aktif dan lokasi `gen_random_uuid`

Tujuan: mengonfirmasi extension aktif dan schema penyedia UUID generator yang dipakai reservation code.

```sql
select
  e.extname as extension_name,
  e.extversion as extension_version,
  n.nspname as extension_schema
from pg_catalog.pg_extension as e
join pg_catalog.pg_namespace as n on n.oid = e.extnamespace
order by e.extname;
```

```sql
select
  p.oid::regprocedure as function_identity,
  n.nspname as function_schema,
  pg_catalog.pg_get_userbyid(p.proowner) as function_owner
from pg_catalog.pg_proc as p
join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
where p.proname = 'gen_random_uuid'
order by p.oid::regprocedure::text;
```

Interpretasi: `pgcrypto` harus ada untuk source saat ini. Gunakan schema aktual `gen_random_uuid()` saat mereview perubahan search path; jangan mengasumsikan ia berada di `public` atau `extensions`.

## 10. Default dan hak `generate_reservation_code()`

Tujuan: memeriksa default kolom, identity fungsi, tipe security, dan grant langsung/effective.

```sql
select
  a.attrelid::regclass as table_identity,
  a.attname as column_name,
  pg_catalog.pg_get_expr(d.adbin, d.adrelid) as column_default
from pg_catalog.pg_attribute as a
join pg_catalog.pg_attrdef as d on d.adrelid = a.attrelid and d.adnum = a.attnum
where a.attrelid = 'public.reservations'::regclass
  and a.attname = 'reservation_code'
  and not a.attisdropped;
```

```sql
select
  p.oid::regprocedure as function_identity,
  p.prosecdef as security_definer,
  coalesce(array_to_string(p.proconfig, ', '), '(no per-function settings)') as function_settings,
  pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute_effective,
  pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute_effective,
  exists (
    select 1 from pg_catalog.aclexplode(
      coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))
    ) as acl where acl.grantee = 0 and acl.privilege_type = 'EXECUTE'
  ) as public_has_direct_execute
from pg_catalog.pg_proc as p
join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'generate_reservation_code'
  and pg_catalog.pg_get_function_identity_arguments(p.oid) = '';
```

Interpretasi: default harus memanggil `public.generate_reservation_code()`. Fungsi diharapkan SECURITY INVOKER, executable efektif oleh anon/authenticated, tetapi tanpa `PUBLIC` direct execute setelah hardening. Bila table atau function tidak ada, catat `BLOCKED` dan gunakan query 5 atau 2 untuk menemukan identity aktual.

## Batas interpretasi

Katalog membuktikan metadata dan privilege, bukan hasil runtime seluruh request PostgREST. Untuk membuktikan response anonymous reservation, gunakan environment staging terpisah: `INSERT ... RETURNING` melalui Data API dapat memerlukan privilege/policy SELECT. Jangan menguji fungsi mutatif di production sebagai bagian audit read-only ini.
