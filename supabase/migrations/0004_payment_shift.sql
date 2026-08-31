-- COREÉATERY
-- Link payments to cashier shifts
-- Migration: 0004_payment_shift

alter table public.payments
  add column if not exists shift_id uuid
    references public.cash_register_shifts(id)
    on delete set null;

create index if not exists idx_payments_shift
  on public.payments(shift_id);
