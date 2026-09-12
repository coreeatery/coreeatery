-- COREÉATERY
-- Migration: 0014_cash_register_shift_schedule_logic
-- Shift schedule logic, automatic expiry, RPC integration, and backfill.

-- =========================================================
-- 1. SEED SHIFT SCHEDULES
-- =========================================================

insert into public.cash_register_shift_schedules
  (name, start_time, end_time, grace_period_minutes, is_active)
values
  ('Pagi', '08:00', '16:00', 15, true),
  ('Sore', '16:00', '00:00', 15, true),
  ('Malam', '00:00', '08:00', 15, true)
on conflict ((lower(name))) do update
set
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  grace_period_minutes = excluded.grace_period_minutes,
  is_active = excluded.is_active,
  updated_at = now();


-- =========================================================
-- 2. FIND CURRENT SHIFT SCHEDULE
-- =========================================================

create or replace function public.get_current_cash_register_shift_schedule(
  p_reference_at timestamptz default now()
)
returns table (
  schedule_id uuid,
  schedule_name text,
  scheduled_start_at timestamptz,
  scheduled_end_at timestamptz,
  grace_period_minutes integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_local_date date;
  v_schedule record;
  v_start_local timestamp;
  v_end_local timestamp;
  v_reference_local timestamp;
begin
  v_reference_local :=
    p_reference_at at time zone 'Asia/Jakarta';

  v_local_date := v_reference_local::date;

  for v_schedule in
    select
      s.id,
      s.name,
      s.start_time,
      s.end_time,
      s.grace_period_minutes
    from public.cash_register_shift_schedules s
    where s.is_active = true
    order by s.start_time
  loop

    -- -----------------------------------------------------
    -- Candidate window for current local date
    -- -----------------------------------------------------

    v_start_local :=
      v_local_date + v_schedule.start_time;

    if v_schedule.end_time > v_schedule.start_time then
      v_end_local :=
        v_local_date + v_schedule.end_time;
    else
      v_end_local :=
        (v_local_date + 1) + v_schedule.end_time;
    end if;

    if v_reference_local >= v_start_local
       and v_reference_local < v_end_local
    then
      schedule_id := v_schedule.id;
      schedule_name := v_schedule.name;

      scheduled_start_at :=
        v_start_local at time zone 'Asia/Jakarta';

      scheduled_end_at :=
        v_end_local at time zone 'Asia/Jakarta';

      grace_period_minutes :=
        v_schedule.grace_period_minutes;

      return next;
      return;
    end if;


    -- -----------------------------------------------------
    -- Candidate window starting previous local date
    -- Needed for overnight schedules such as 16:00 -> 00:00
    -- and 00:00 -> 08:00.
    -- -----------------------------------------------------

    v_start_local :=
      (v_local_date - 1) + v_schedule.start_time;

    if v_schedule.end_time > v_schedule.start_time then
      v_end_local :=
        (v_local_date - 1) + v_schedule.end_time;
    else
      v_end_local :=
        v_local_date + v_schedule.end_time;
    end if;

    if v_reference_local >= v_start_local
       and v_reference_local < v_end_local
    then
      schedule_id := v_schedule.id;
      schedule_name := v_schedule.name;

      scheduled_start_at :=
        v_start_local at time zone 'Asia/Jakarta';

      scheduled_end_at :=
        v_end_local at time zone 'Asia/Jakarta';

      grace_period_minutes :=
        v_schedule.grace_period_minutes;

      return next;
      return;
    end if;

  end loop;

  return;
end;
$$;


-- =========================================================
-- 3. EXPIRE OVERDUE OPEN SHIFTS
-- =========================================================

create or replace function public.expire_overdue_cash_register_shifts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired_count integer;
begin

  update public.cash_register_shifts
  set
    status = 'expired'::public.cash_register_shift_status,
    expired_at = now(),
    expiry_reason = 'Scheduled shift ended'
  where status = 'open'::public.cash_register_shift_status
    and scheduled_end_at is not null
    and now() >= (
      scheduled_end_at
      + make_interval(mins => coalesce(
          (
            select s.grace_period_minutes
            from public.cash_register_shift_schedules s
            where s.id = cash_register_shifts.schedule_id
          ),
          15
        ))
    );

  get diagnostics v_expired_count = row_count;

  return v_expired_count;
end;
$$;


-- =========================================================
-- 4. BACKFILL EXISTING OPEN SHIFTS
-- =========================================================

do $$
declare
  v_shift record;
  v_schedule record;
begin

  for v_shift in
    select
      id,
      opened_at
    from public.cash_register_shifts
    where status = 'open'::public.cash_register_shift_status
      and scheduled_end_at is null
  loop

    select *
    into v_schedule
    from public.get_current_cash_register_shift_schedule(
      v_shift.opened_at
    )
    limit 1;

    if v_schedule.schedule_id is not null then

      update public.cash_register_shifts
      set
        schedule_id = v_schedule.schedule_id,
        scheduled_start_at = v_schedule.scheduled_start_at,
        scheduled_end_at = v_schedule.scheduled_end_at
      where id = v_shift.id;

    end if;

  end loop;

end;
$$;


-- =========================================================
-- 5. EXPIRE BACKFILLED OVERDUE SHIFTS
-- =========================================================

select public.expire_overdue_cash_register_shifts();


-- =========================================================
-- 6. OPEN SHIFT RPC
-- =========================================================

create or replace function public.open_cash_register_shift(
  p_register_name text,
  p_opening_cash numeric
)
returns public.cash_register_shifts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_role public.user_role;
  v_existing_shift public.cash_register_shifts;
  v_schedule record;
  v_new_shift public.cash_register_shifts;
begin

  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select role
  into v_role
  from public.profiles
  where id = v_user_id;

  if v_role not in (
    'owner',
    'admin',
    'manager',
    'cashier'
  ) then
    raise exception 'Insufficient permissions';
  end if;

  if p_opening_cash is null or p_opening_cash < 0 then
    raise exception 'Opening cash must be greater than or equal to zero';
  end if;

  if p_register_name is null
     or length(trim(p_register_name)) = 0 then
    raise exception 'Register name is required';
  end if;


  -- -------------------------------------------------------
  -- Expire overdue shifts first
  -- -------------------------------------------------------

  perform public.expire_overdue_cash_register_shifts();


  -- -------------------------------------------------------
  -- Only one open shift per register
  -- -------------------------------------------------------

  select *
  into v_existing_shift
  from public.cash_register_shifts
  where lower(trim(register_name)) = lower(trim(p_register_name))
    and status = 'open'::public.cash_register_shift_status
  limit 1;

  if v_existing_shift.id is not null then
    raise exception 'Register already has an open shift';
  end if;


  -- -------------------------------------------------------
  -- Resolve current schedule
  -- -------------------------------------------------------

  select *
  into v_schedule
  from public.get_current_cash_register_shift_schedule(now())
  limit 1;

  if v_schedule.schedule_id is null then
    raise exception 'No active cash register shift schedule found';
  end if;


  -- -------------------------------------------------------
  -- Create shift
  -- -------------------------------------------------------

  insert into public.cash_register_shifts (
    register_name,
    opened_by,
    opened_at,
    opening_cash,
    status,
    schedule_id,
    scheduled_start_at,
    scheduled_end_at
  )
  values (
    trim(p_register_name),
    v_user_id,
    now(),
    p_opening_cash,
    'open'::public.cash_register_shift_status,
    v_schedule.schedule_id,
    v_schedule.scheduled_start_at,
    v_schedule.scheduled_end_at
  )
  returning *
  into v_new_shift;

  return v_new_shift;

end;
$$;


-- =========================================================
-- 7. CLOSE SHIFT RPC
-- =========================================================

create or replace function public.close_cash_register_shift(
  p_shift_id uuid,
  p_actual_cash numeric
)
returns public.cash_register_shifts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_role public.user_role;
  v_shift public.cash_register_shifts;
  v_expected_cash numeric;
  v_difference numeric;
  v_result public.cash_register_shifts;
begin

  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_actual_cash is null or p_actual_cash < 0 then
    raise exception 'Actual cash must be greater than or equal to zero';
  end if;


  -- -------------------------------------------------------
  -- Get caller role
  -- -------------------------------------------------------

  select role
  into v_role
  from public.profiles
  where id = v_user_id;

  if v_role is null then
    raise exception 'User profile not found';
  end if;


  -- -------------------------------------------------------
  -- Lock shift row
  -- -------------------------------------------------------

  select *
  into v_shift
  from public.cash_register_shifts
  where id = p_shift_id
  for update;

  if v_shift.id is null then
    raise exception 'Shift not found';
  end if;

  if v_shift.status not in (
    'open'::public.cash_register_shift_status,
    'expired'::public.cash_register_shift_status
  ) then
    raise exception 'Shift is already closed';
  end if;


  -- -------------------------------------------------------
  -- Permission
  -- -------------------------------------------------------

  if v_role not in (
    'owner',
    'admin',
    'manager'
  )
  and v_shift.opened_by <> v_user_id then
    raise exception 'You do not have permission to close this shift';
  end if;


  -- -------------------------------------------------------
  -- Expected cash
  --
  -- Preserve existing accounting logic:
  -- opening cash + cash movements
  -- -------------------------------------------------------

  select
    v_shift.opening_cash
    + coalesce(sum(
        case
          when movement_type = 'cash_in'
            then amount
          when movement_type = 'cash_out'
            then -amount
          else 0
        end
      ), 0)
  into v_expected_cash
  from public.cash_register_movements
  where shift_id = v_shift.id;


  v_difference :=
    p_actual_cash - v_expected_cash;


  -- -------------------------------------------------------
  -- Close shift
  -- -------------------------------------------------------

  update public.cash_register_shifts
  set
    status = 'closed'::public.cash_register_shift_status,
    closed_by = v_user_id,
    closed_at = now(),
    actual_cash = p_actual_cash,
    expected_cash = v_expected_cash,
    difference = v_difference
  where id = v_shift.id
  returning *
  into v_result;

  return v_result;

end;
$$;


-- =========================================================
-- 8. RLS FOR SHIFT SCHEDULES
-- =========================================================

alter table public.cash_register_shift_schedules enable row level security;


drop policy if exists cash_register_shift_schedules_select
on public.cash_register_shift_schedules;

create policy cash_register_shift_schedules_select
on public.cash_register_shift_schedules
for select
to authenticated
using (
  public.has_role(
    array[
      'owner'::public.user_role,
      'admin'::public.user_role,
      'manager'::public.user_role,
      'cashier'::public.user_role
    ]
  )
);


drop policy if exists cash_register_shift_schedules_insert
on public.cash_register_shift_schedules;

create policy cash_register_shift_schedules_insert
on public.cash_register_shift_schedules
for insert
to authenticated
with check (
  public.has_role(
    array[
      'owner'::public.user_role,
      'admin'::public.user_role,
      'manager'::public.user_role
    ]
  )
);


drop policy if exists cash_register_shift_schedules_update
on public.cash_register_shift_schedules;

create policy cash_register_shift_schedules_update
on public.cash_register_shift_schedules
for update
to authenticated
using (
  public.has_role(
    array[
      'owner'::public.user_role,
      'admin'::public.user_role,
      'manager'::public.user_role
    ]
  )
)
with check (
  public.has_role(
    array[
      'owner'::public.user_role,
      'admin'::public.user_role,
      'manager'::public.user_role
    ]
  )
);


drop policy if exists cash_register_shift_schedules_delete
on public.cash_register_shift_schedules;

create policy cash_register_shift_schedules_delete
on public.cash_register_shift_schedules
for delete
to authenticated
using (
  public.has_role(
    array[
      'owner'::public.user_role,
      'admin'::public.user_role,
      'manager'::public.user_role
    ]
  )
);


-- =========================================================
-- 9. GRANTS
-- =========================================================

grant select, insert, update, delete
on public.cash_register_shift_schedules
to authenticated;

grant execute
on function public.get_current_cash_register_shift_schedule(timestamptz)
to authenticated;

grant execute
on function public.open_cash_register_shift(text, numeric)
to authenticated;

grant execute
on function public.close_cash_register_shift(uuid, numeric)
to authenticated;
