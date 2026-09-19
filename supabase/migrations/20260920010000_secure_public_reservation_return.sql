begin;

revoke all on function public.create_public_reservation(
  text,
  text,
  text,
  date,
  time without time zone,
  integer,
  text,
  text
) from public, anon, authenticated;

drop function if exists public.create_public_reservation(
  text,
  text,
  text,
  date,
  time without time zone,
  integer,
  text,
  text
);

create or replace function public.create_public_reservation(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_reservation_date date,
  p_reservation_time time without time zone,
  p_guest_count integer,
  p_occasion text default null,
  p_notes text default null
)
returns table (
  reservation_code text,
  reservation_date date,
  reservation_time time without time zone,
  guest_count integer,
  status public.reservation_status
)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions, pg_temp
as $function$
declare
  v_table_id uuid;
  v_reservation_code text;
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

  perform pg_advisory_xact_lock(
    hashtext(p_reservation_date::text || ':' || p_reservation_time::text)
  );

  select rt.id
  into v_table_id
  from public.restaurant_tables rt
  where rt.is_active
    and rt.capacity >= p_guest_count
    and not exists (
      select 1
      from public.reservations r
      where r.reservation_date = p_reservation_date
        and r.reservation_time = p_reservation_time
        and r.table_id = rt.id
        and r.status not in ('cancelled', 'no_show')
    )
  order by rt.capacity, rt.table_number
  limit 1
  for update;

  if v_table_id is null then
    raise exception 'No table is available for this time and party size';
  end if;

  insert into public.reservations (
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
  returning reservations.reservation_code
  into v_reservation_code;

  return query
  select
    r.reservation_code,
    r.reservation_date,
    r.reservation_time,
    r.guest_count,
    r.status
  from public.reservations r
  where r.reservation_code = v_reservation_code;
end;
$function$;

revoke all on function public.create_public_reservation(
  text,
  text,
  text,
  date,
  time without time zone,
  integer,
  text,
  text
) from public;

grant execute on function public.create_public_reservation(
  text,
  text,
  text,
  date,
  time without time zone,
  integer,
  text,
  text
) to anon, authenticated;

commit;
