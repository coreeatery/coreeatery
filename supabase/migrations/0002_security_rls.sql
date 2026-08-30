-- COREÉATERY
-- Security, RLS and authorization foundation
-- Migration: 0002_security_rls

-- =========================================================
-- HELPER: CURRENT USER ROLE
-- =========================================================

create or replace function public.get_my_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

revoke all on function public.get_my_role() from public;
grant execute on function public.get_my_role() to anon, authenticated;


-- =========================================================
-- HELPER: ROLE CHECK
-- =========================================================

create or replace function public.has_role(
  required_roles public.user_role[]
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role = any(required_roles)
  );
$$;

revoke all on function public.has_role(public.user_role[]) from public;
grant execute on function public.has_role(public.user_role[]) to authenticated;


-- =========================================================
-- AUTO CREATE PROFILE AFTER AUTH SIGNUP
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    phone,
    role
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    new.raw_user_meta_data ->> 'phone',
    'staff'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- =========================================================
-- ENABLE RLS
-- =========================================================

alter table public.profiles enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_variants enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.reservations enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;


-- =========================================================
-- PROFILES
-- =========================================================

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.has_role(
    array['owner','admin','manager']::public.user_role[]
  )
);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.has_role(
    array['owner','admin']::public.user_role[]
  )
)
with check (
  id = auth.uid()
  or public.has_role(
    array['owner','admin']::public.user_role[]
  )
);


-- =========================================================
-- PUBLIC MENU
-- =========================================================

drop policy if exists menu_categories_public_read on public.menu_categories;
create policy menu_categories_public_read
on public.menu_categories
for select
to anon, authenticated
using (
  is_active = true
);

drop policy if exists menu_categories_staff_all on public.menu_categories;
create policy menu_categories_staff_all
on public.menu_categories
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


drop policy if exists menu_items_public_read on public.menu_items;
create policy menu_items_public_read
on public.menu_items
for select
to anon, authenticated
using (
  status = 'active'
  and is_available = true
);

drop policy if exists menu_items_staff_all on public.menu_items;
create policy menu_items_staff_all
on public.menu_items
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


drop policy if exists menu_variants_public_read on public.menu_variants;
create policy menu_variants_public_read
on public.menu_variants
for select
to anon, authenticated
using (
  is_available = true
  and exists (
    select 1
    from public.menu_items mi
    where mi.id = menu_item_id
      and mi.status = 'active'
      and mi.is_available = true
  )
);

drop policy if exists menu_variants_staff_all on public.menu_variants;
create policy menu_variants_staff_all
on public.menu_variants
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
-- RESTAURANT TABLES
-- =========================================================

drop policy if exists restaurant_tables_staff_read on public.restaurant_tables;
create policy restaurant_tables_staff_read
on public.restaurant_tables
for select
to authenticated
using (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager',
      'cashier',
      'kitchen',
      'staff'
    ]::public.user_role[]
  )
);

drop policy if exists restaurant_tables_management on public.restaurant_tables;
create policy restaurant_tables_management
on public.restaurant_tables
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
-- RESERVATIONS
-- =========================================================

-- Public website can create a pending reservation.
-- It cannot assign a table or impersonate a staff member.

drop policy if exists reservations_public_insert on public.reservations;
create policy reservations_public_insert
on public.reservations
for insert
to anon, authenticated
with check (
  status = 'pending'
  and table_id is null
  and created_by is null
);

drop policy if exists reservations_staff_read on public.reservations;
create policy reservations_staff_read
on public.reservations
for select
to authenticated
using (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager',
      'cashier',
      'staff'
    ]::public.user_role[]
  )
);

drop policy if exists reservations_management on public.reservations;
create policy reservations_management
on public.reservations
for update
to authenticated
using (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager',
      'cashier'
    ]::public.user_role[]
  )
)
with check (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager',
      'cashier'
    ]::public.user_role[]
  )
);

drop policy if exists reservations_delete_management on public.reservations;
create policy reservations_delete_management
on public.reservations
for delete
to authenticated
using (
  public.has_role(
    array['owner','admin','manager']::public.user_role[]
  )
);


-- =========================================================
-- ORDERS
-- =========================================================

drop policy if exists orders_staff_read on public.orders;
create policy orders_staff_read
on public.orders
for select
to authenticated
using (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager',
      'cashier',
      'kitchen',
      'staff'
    ]::public.user_role[]
  )
);

drop policy if exists orders_operational_insert on public.orders;
create policy orders_operational_insert
on public.orders
for insert
to authenticated
with check (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager',
      'cashier',
      'staff'
    ]::public.user_role[]
  )
);

drop policy if exists orders_operational_update on public.orders;
create policy orders_operational_update
on public.orders
for update
to authenticated
using (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager',
      'cashier',
      'kitchen',
      'staff'
    ]::public.user_role[]
  )
)
with check (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager',
      'cashier',
      'kitchen',
      'staff'
    ]::public.user_role[]
  )
);

drop policy if exists orders_management_delete on public.orders;
create policy orders_management_delete
on public.orders
for delete
to authenticated
using (
  public.has_role(
    array['owner','admin','manager']::public.user_role[]
  )
);


-- =========================================================
-- ORDER ITEMS
-- =========================================================

drop policy if exists order_items_staff_read on public.order_items;
create policy order_items_staff_read
on public.order_items
for select
to authenticated
using (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager',
      'cashier',
      'kitchen',
      'staff'
    ]::public.user_role[]
  )
);

drop policy if exists order_items_staff_insert on public.order_items;
create policy order_items_staff_insert
on public.order_items
for insert
to authenticated
with check (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager',
      'cashier',
      'staff'
    ]::public.user_role[]
  )
);

drop policy if exists order_items_staff_update on public.order_items;
create policy order_items_staff_update
on public.order_items
for update
to authenticated
using (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager',
      'cashier',
      'kitchen',
      'staff'
    ]::public.user_role[]
  )
)
with check (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager',
      'cashier',
      'kitchen',
      'staff'
    ]::public.user_role[]
  )
);

drop policy if exists order_items_management_delete on public.order_items;
create policy order_items_management_delete
on public.order_items
for delete
to authenticated
using (
  public.has_role(
    array['owner','admin','manager','cashier']::public.user_role[]
  )
);


-- =========================================================
-- PAYMENTS
-- =========================================================

drop policy if exists payments_staff_read on public.payments;
create policy payments_staff_read
on public.payments
for select
to authenticated
using (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager',
      'cashier'
    ]::public.user_role[]
  )
);

drop policy if exists payments_cashier_insert on public.payments;
create policy payments_cashier_insert
on public.payments
for insert
to authenticated
with check (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager',
      'cashier'
    ]::public.user_role[]
  )
);

drop policy if exists payments_management_update on public.payments;
create policy payments_management_update
on public.payments
for update
to authenticated
using (
  public.has_role(
    array['owner','admin','manager','cashier']::public.user_role[]
  )
)
with check (
  public.has_role(
    array['owner','admin','manager','cashier']::public.user_role[]
  )
);


-- =========================================================
-- DEFAULT PRIVILEGE HARDENING
-- =========================================================

revoke all on public.profiles from anon;
revoke all on public.menu_categories from anon;
revoke all on public.menu_items from anon;
revoke all on public.menu_variants from anon;
revoke all on public.restaurant_tables from anon;
revoke all on public.orders from anon;
revoke all on public.order_items from anon;
revoke all on public.payments from anon;

grant select on public.menu_categories to anon;
grant select on public.menu_items to anon;
grant select on public.menu_variants to anon;
grant insert on public.reservations to anon;

grant select, insert, update, delete
on public.profiles
to authenticated;

grant select, insert, update, delete
on public.menu_categories
to authenticated;

grant select, insert, update, delete
on public.menu_items
to authenticated;

grant select, insert, update, delete
on public.menu_variants
to authenticated;

grant select, insert, update, delete
on public.restaurant_tables
to authenticated;

grant select, insert, update, delete
on public.reservations
to authenticated;

grant select, insert, update, delete
on public.orders
to authenticated;

grant select, insert, update, delete
on public.order_items
to authenticated;

grant select, insert, update
on public.payments
to authenticated;
