-- COREÉATERY
-- Cashier / Payment Integrity
-- Migration: 0005_cashier_payment_integrity

-- =========================================================
-- PAYMENTS -> SHIFT
-- =========================================================

alter table public.payments
  add column if not exists shift_id uuid
    references public.cash_register_shifts(id)
    on delete set null;

create index if not exists idx_payments_shift_id
  on public.payments(shift_id);

create index if not exists idx_payments_order_id
  on public.payments(order_id);

create index if not exists idx_payments_paid_at
  on public.payments(paid_at);

-- =========================================================
-- PAYMENT RLS
-- =========================================================

alter table public.payments enable row level security;

drop policy if exists payments_staff_read
on public.payments;

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

drop policy if exists payments_cashier_insert
on public.payments;

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
  and (
    received_by is null
    or received_by = auth.uid()
  )
);

drop policy if exists payments_management_update
on public.payments;

create policy payments_management_update
on public.payments
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
-- DOCUMENTATION
-- =========================================================

comment on column public.payments.shift_id is
  'Cashier shift that received this payment.';

comment on column public.cash_register_shifts.expected_cash is
  'Expected physical cash calculated from opening cash, cash sales and cash movements.';

comment on column public.cash_register_shifts.actual_cash is
  'Physical cash counted by cashier when closing the shift.';

comment on column public.cash_register_shifts.difference is
  'Actual cash minus expected cash.';
