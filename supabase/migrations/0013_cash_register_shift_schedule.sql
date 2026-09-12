-- COREÉATERY
-- Migration: 0013_cash_register_shift_schedule
-- Cash register recurring shift schedules and automatic expiration.

create table public.cash_register_shift_schedules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_time time not null,
  end_time time not null,
  grace_period_minutes integer not null default 15,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint cash_register_shift_schedules_name_check
    check (length(trim(name)) > 0),

  constraint cash_register_shift_schedules_grace_check
    check (grace_period_minutes between 0 and 240),

  constraint cash_register_shift_schedules_time_check
    check (start_time <> end_time)
);

create unique index idx_cash_register_shift_schedules_name
  on public.cash_register_shift_schedules (lower(name));

create index idx_cash_register_shift_schedules_active
  on public.cash_register_shift_schedules (is_active);

create trigger cash_register_shift_schedules_updated_at
before update on public.cash_register_shift_schedules
for each row execute function public.set_updated_at();

alter table public.cash_register_shifts
  add column schedule_id uuid
    references public.cash_register_shift_schedules(id)
    on delete set null,
  add column scheduled_start_at timestamptz,
  add column scheduled_end_at timestamptz,
  add column expired_at timestamptz,
  add column expiry_reason text;

create index idx_cash_register_shifts_schedule_id
  on public.cash_register_shifts (schedule_id);

create index idx_cash_register_shifts_scheduled_end_at
  on public.cash_register_shifts (scheduled_end_at)
  where status = 'open';

alter table public.cash_register_shifts
  drop constraint cash_register_shifts_check;

alter table public.cash_register_shifts
  add constraint cash_register_shifts_check
  check (
    (status = 'open'::public.cash_register_shift_status
      and closed_at is null)
    or
    (status = 'closed'::public.cash_register_shift_status
      and closed_at is not null)
    or
    (status = 'expired'::public.cash_register_shift_status
      and closed_at is null)
  );

alter table public.cash_register_shifts
  add constraint cash_register_shifts_expired_at_check
  check (
    (status = 'expired'::public.cash_register_shift_status
      and expired_at is not null)
    or
    (status <> 'expired'::public.cash_register_shift_status)
  );
