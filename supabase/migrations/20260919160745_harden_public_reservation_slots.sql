-- COREÉATERY public reservation MVP
-- Fixed hours: 10:00–22:00 WIB, with 30-minute slots. A reservation receives
-- the smallest available active table that can accommodate its party.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reservations_operating_slot_check'
      and conrelid = 'public.reservations'::regclass
  ) then
    alter table public.reservations
      add constraint reservations_operating_slot_check
      check (
        reservation_time >= time '10:00'
        and reservation_time < time '22:00'
        and extract(minute from reservation_time)::integer in (0, 30)
        and extract(second from reservation_time) = 0
      );
  end if;
end;
$$;

-- Direct public inserts cannot validate capacity or reserve a table safely.
revoke insert on public.reservations from anon, authenticated;
drop policy if exists reservations_public_insert on public.reservations;

-- Cashiers can read reservations for operations but cannot alter bookings.
drop policy if exists reservations_management on public.reservations;
create policy reservations_management
on public.reservations
for update
to authenticated
using (
  public.has_role(
    array['owner', 'admin', 'manager']::public.user_role[]
  )
)
with check (
  public.has_role(
    array['owner', 'admin', 'manager']::public.user_role[]
  )
);

create or replace function public.get_available_reservation_slots(
  p_reservation_date date,
  p_guest_count integer
)
returns table (reservation_time time)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
begin
  if p_reservation_date is null
     or p_reservation_date < (now() at time zone 'Asia/Jakarta')::date then
    raise exception 'Reservation date must be today or later';
  end if;

  if p_guest_count is null or p_guest_count <= 0 then
    raise exception 'Guest count must be greater than zero';
  end if;

  return query
  select (time '10:00' + (slot * interval '30 minutes'))::time
  from generate_series(0, 23) as slot
  where exists (
    select 1
    from public.restaurant_tables as restaurant_table
    where restaurant_table.is_active
      and restaurant_table.capacity >= p_guest_count
      and not exists (
        select 1
        from public.reservations as reservation
        where reservation.reservation_date = p_reservation_date
          and reservation.reservation_time =
            (time '10:00' + (slot * interval '30 minutes'))::time
          and reservation.table_id = restaurant_table.id
          and reservation.status not in ('cancelled', 'no_show')
      )
  )
  order by slot;
end;
$$;

create or replace function public.create_public_reservation(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_reservation_date date,
  p_reservation_time time,
  p_guest_count integer,
  p_occasion text default null,
  p_notes text default null
)
returns table (
  reservation_code text,
  reservation_date date,
  reservation_time time,
  guest_count integer,
  status public.reservation_status
)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $$
declare
  v_table_id uuid;
  v_reservation_code text;
  v_reservation_date date;
  v_reservation_time time;
  v_guest_count integer;
  v_status public.reservation_status;
begin
  if nullif(trim(p_customer_name), '') is null
     or nullif(trim(p_customer_phone), '') is null then
    raise exception 'Customer name and phone are required';
  end if;

  if p_reservation_date is null
     or p_reservation_date < (now() at time zone 'Asia/Jakarta')::date then
    raise exception 'Reservation date must be today or later';
  end if;

  if p_reservation_time is null
     or p_reservation_time < time '10:00'
     or p_reservation_time >= time '22:00'
     or extract(minute from p_reservation_time)::integer not in (0, 30)
     or extract(second from p_reservation_time) <> 0 then
    raise exception 'Reservation time must be a 30-minute slot between 10:00 and 22:00';
  end if;

  if p_guest_count is null or p_guest_count <= 0 then
    raise exception 'Guest count must be greater than zero';
  end if;

  -- Serializes allocation for this exact date/time; capacity checks and the
  -- insert happen in one transaction, so two callers cannot take one table.
  perform pg_advisory_xact_lock(
    hashtext(p_reservation_date::text || ':' || p_reservation_time::text)
  );

  select restaurant_table.id
  into v_table_id
  from public.restaurant_tables as restaurant_table
  where restaurant_table.is_active
    and restaurant_table.capacity >= p_guest_count
    and not exists (
      select 1
      from public.reservations as reservation
      where reservation.reservation_date = p_reservation_date
        and reservation.reservation_time = p_reservation_time
        and reservation.table_id = restaurant_table.id
        and reservation.status not in ('cancelled', 'no_show')
    )
  order by restaurant_table.capacity, restaurant_table.table_number
  limit 1
  for update;

  if v_table_id is null then
    raise exception 'No table is available for this time and party size';
  end if;

  insert into public.reservations as created_reservation (
    customer_name,
    customer_phone,
    customer_email,
    reservation_date,
    reservation_time,
    guest_count,
    table_id,
    occasion,
    notes,
    status,
    created_by
  )
  values (
    trim(p_customer_name),
    trim(p_customer_phone),
    nullif(trim(p_customer_email), ''),
    p_reservation_date,
    p_reservation_time,
    p_guest_count,
    v_table_id,
    nullif(trim(p_occasion), ''),
    nullif(trim(p_notes), ''),
    'pending',
    null
  )
  returning
    created_reservation.reservation_code,
    created_reservation.reservation_date,
    created_reservation.reservation_time,
    created_reservation.guest_count,
    created_reservation.status
  into
    v_reservation_code,
    v_reservation_date,
    v_reservation_time,
    v_guest_count,
    v_status;

  return query
  select
    v_reservation_code,
    v_reservation_date,
    v_reservation_time,
    v_guest_count,
    v_status;
end;
$$;

revoke all on function public.get_available_reservation_slots(date, integer) from public;
revoke all on function public.create_public_reservation(text, text, text, date, time, integer, text, text) from public;
grant execute on function public.get_available_reservation_slots(date, integer) to anon, authenticated;
grant execute on function public.create_public_reservation(text, text, text, date, time, integer, text, text) to anon, authenticated;
