-- COREÉATERY
-- Cash Register / Shift Management
-- Migration: 0003_cash_register

-- =========================================================
-- ENUMS
-- =========================================================

do $$
begin
  create type public.cash_register_shift_status as enum (
    'open',
    'closed'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.cash_register_movement_type as enum (
    'cash_in',
    'cash_out'
  );
exception
  when duplicate_object then null;
end
$$;

-- =========================================================
-- CASH REGISTER SHIFTS
-- =========================================================

create table if not exists public.cash_register_shifts (
  id uuid primary key default gen_random_uuid(),

  register_name text not null default 'Kasir Utama',

  opened_by uuid not null
    references public.profiles(id)
    on delete restrict,

  opened_at timestamptz not null default now(),

  opening_cash numeric(14,2) not null default 0
    check (opening_cash >= 0),

  status public.cash_register_shift_status not null default 'open',

  closed_by uuid
    references public.profiles(id)
    on delete set null,

  closed_at timestamptz,

  expected_cash numeric(14,2)
    check (expected_cash is null or expected_cash >= 0),

  actual_cash numeric(14,2)
    check (actual_cash is null or actual_cash >= 0),

  difference numeric(14,2),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    (status = 'open' and closed_at is null)
    or
    (status = 'closed' and closed_at is not null)
  )
);

-- =========================================================
-- CASH REGISTER MOVEMENTS
-- =========================================================

create table if not exists public.cash_register_movements (
  id uuid primary key default gen_random_uuid(),

  shift_id uuid not null
    references public.cash_register_shifts(id)
    on delete cascade,

  movement_type public.cash_register_movement_type not null,

  amount numeric(14,2) not null
    check (amount > 0),

  payment_method public.payment_method not null default 'cash',

  reference_number text,

  description text,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now()
);

-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists idx_cash_register_shifts_status
  on public.cash_register_shifts(status);

create index if not exists idx_cash_register_shifts_opened_by
  on public.cash_register_shifts(opened_by);

create index if not exists idx_cash_register_shifts_opened_at
  on public.cash_register_shifts(opened_at);

create index if not exists idx_cash_register_movements_shift
  on public.cash_register_movements(shift_id);

create index if not exists idx_cash_register_movements_type
  on public.cash_register_movements(movement_type);

create index if not exists idx_cash_register_movements_created_at
  on public.cash_register_movements(created_at);

-- =========================================================
-- UPDATED_AT TRIGGER
-- =========================================================

drop trigger if exists cash_register_shifts_updated_at
on public.cash_register_shifts;

create trigger cash_register_shifts_updated_at
before update on public.cash_register_shifts
for each row
execute function public.set_updated_at();

-- =========================================================
-- ONLY ONE OPEN SHIFT PER REGISTER
-- =========================================================

create unique index if not exists idx_one_open_shift_per_register
on public.cash_register_shifts(register_name)
where status = 'open';

-- =========================================================
-- RLS
-- =========================================================

alter table public.cash_register_shifts enable row level security;
alter table public.cash_register_movements enable row level security;

-- =========================================================
-- SHIFT POLICIES
-- =========================================================

drop policy if exists cash_register_shifts_read
on public.cash_register_shifts;

create policy cash_register_shifts_read
on public.cash_register_shifts
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

drop policy if exists cash_register_shifts_insert
on public.cash_register_shifts;

create policy cash_register_shifts_insert
on public.cash_register_shifts
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
  and opened_by = auth.uid()
);

drop policy if exists cash_register_shifts_update
on public.cash_register_shifts;

create policy cash_register_shifts_update
on public.cash_register_shifts
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

-- =========================================================
-- MOVEMENT POLICIES
-- =========================================================

drop policy if exists cash_register_movements_read
on public.cash_register_movements;

create policy cash_register_movements_read
on public.cash_register_movements
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

drop policy if exists cash_register_movements_insert
on public.cash_register_movements;

create policy cash_register_movements_insert
on public.cash_register_movements
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
  and created_by = auth.uid()
);

drop policy if exists cash_register_movements_update
on public.cash_register_movements;

create policy cash_register_movements_update
on public.cash_register_movements
for update
to authenticated
using (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager'
    ]::public.user_role[]
  )
)
with check (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager'
    ]::public.user_role[]
  )
);

drop policy if exists cash_register_movements_delete
on public.cash_register_movements;

create policy cash_register_movements_delete
on public.cash_register_movements
for delete
to authenticated
using (
  public.has_role(
    array[
      'owner',
      'admin',
      'manager'
    ]::public.user_role[]
  )
);

-- =========================================================
-- GRANTS
-- =========================================================

grant select, insert, update
on public.cash_register_shifts
to authenticated;

grant select, insert, update, delete
on public.cash_register_movements
to authenticated;

