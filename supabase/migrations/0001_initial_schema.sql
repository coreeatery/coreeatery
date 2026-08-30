-- COREÉATERY
-- Initial database schema
-- Migration: 0001_initial_schema

create extension if not exists "pgcrypto";

-- =========================================================
-- ENUMS
-- =========================================================

create type public.user_role as enum (
  'owner',
  'admin',
  'manager',
  'cashier',
  'kitchen',
  'staff'
);

create type public.menu_item_status as enum (
  'draft',
  'active',
  'inactive'
);

create type public.order_status as enum (
  'draft',
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled'
);

create type public.payment_status as enum (
  'unpaid',
  'partial',
  'paid',
  'refunded',
  'void'
);

create type public.reservation_status as enum (
  'pending',
  'confirmed',
  'seated',
  'completed',
  'cancelled',
  'no_show'
);

create type public.payment_method as enum (
  'cash',
  'qris',
  'bank_transfer',
  'debit_card',
  'credit_card',
  'other'
);

-- =========================================================
-- PROFILES
-- =========================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  avatar_url text,
  role public.user_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- MENU CATEGORIES
-- =========================================================

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name_id text not null,
  name_en text,
  name_zh text,
  slug text not null unique,
  description_id text,
  description_en text,
  description_zh text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- MENU ITEMS
-- =========================================================

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.menu_categories(id) on delete set null,

  name_id text not null,
  name_en text,
  name_zh text,

  description_id text,
  description_en text,
  description_zh text,

  slug text not null unique,

  image_url text,

  base_price numeric(14,2) not null default 0
    check (base_price >= 0),

  status public.menu_item_status not null default 'draft',

  is_featured boolean not null default false,
  is_available boolean not null default true,

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- MENU VARIANTS
-- =========================================================

create table public.menu_variants (
  id uuid primary key default gen_random_uuid(),

  menu_item_id uuid not null
    references public.menu_items(id)
    on delete cascade,

  name_id text not null,
  name_en text,
  name_zh text,

  price numeric(14,2) not null default 0
    check (price >= 0),

  is_available boolean not null default true,

  sort_order integer not null default 0,

  created_at timestamptz not null default now()
);

-- =========================================================
-- RESTAURANT TABLES
-- =========================================================

create table public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),

  table_number text not null unique,

  capacity integer not null
    check (capacity > 0),

  location text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- RESERVATIONS
-- =========================================================

create table public.reservations (
  id uuid primary key default gen_random_uuid(),

  reservation_code text not null unique,

  customer_name text not null,
  customer_phone text not null,
  customer_email text,

  reservation_date date not null,
  reservation_time time not null,

  guest_count integer not null
    check (guest_count > 0),

  table_id uuid references public.restaurant_tables(id)
    on delete set null,

  occasion text,
  notes text,

  status public.reservation_status not null default 'pending',

  created_by uuid references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- ORDERS
-- =========================================================

create table public.orders (
  id uuid primary key default gen_random_uuid(),

  order_number text not null unique,

  table_id uuid references public.restaurant_tables(id)
    on delete set null,

  customer_name text,

  status public.order_status not null default 'draft',

  payment_status public.payment_status not null default 'unpaid',

  subtotal numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  service_charge numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,

  notes text,

  cashier_id uuid references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (subtotal >= 0),
  check (discount_amount >= 0),
  check (tax_amount >= 0),
  check (service_charge >= 0),
  check (total_amount >= 0)
);

-- =========================================================
-- ORDER ITEMS
-- =========================================================

create table public.order_items (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null
    references public.orders(id)
    on delete cascade,

  menu_item_id uuid
    references public.menu_items(id)
    on delete set null,

  variant_id uuid
    references public.menu_variants(id)
    on delete set null,

  item_name text not null,

  quantity numeric(10,2) not null default 1
    check (quantity > 0),

  unit_price numeric(14,2) not null default 0
    check (unit_price >= 0),

  discount_amount numeric(14,2) not null default 0
    check (discount_amount >= 0),

  subtotal numeric(14,2) not null default 0
    check (subtotal >= 0),

  notes text,

  created_at timestamptz not null default now()
);

-- =========================================================
-- PAYMENTS
-- =========================================================

create table public.payments (
  id uuid primary key default gen_random_uuid(),

  payment_code text not null unique,

  order_id uuid not null
    references public.orders(id)
    on delete restrict,

  amount numeric(14,2) not null
    check (amount > 0),

  method public.payment_method not null,

  status public.payment_status not null default 'paid',

  reference_number text,

  paid_at timestamptz not null default now(),

  received_by uuid references public.profiles(id)
    on delete set null,

  notes text,

  created_at timestamptz not null default now()
);

-- =========================================================
-- INDEXES
-- =========================================================

create index idx_menu_items_category
  on public.menu_items(category_id);

create index idx_menu_items_status
  on public.menu_items(status);

create index idx_menu_items_featured
  on public.menu_items(is_featured);

create index idx_reservations_date
  on public.reservations(reservation_date);

create index idx_reservations_status
  on public.reservations(status);

create index idx_orders_status
  on public.orders(status);

create index idx_orders_created_at
  on public.orders(created_at);

create index idx_order_items_order
  on public.order_items(order_id);

create index idx_payments_order
  on public.payments(order_id);

-- =========================================================
-- UPDATED_AT TRIGGER
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger menu_categories_updated_at
before update on public.menu_categories
for each row execute function public.set_updated_at();

create trigger menu_items_updated_at
before update on public.menu_items
for each row execute function public.set_updated_at();

create trigger restaurant_tables_updated_at
before update on public.restaurant_tables
for each row execute function public.set_updated_at();

create trigger reservations_updated_at
before update on public.reservations
for each row execute function public.set_updated_at();

create trigger orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();
