-- COREÉATERY
-- Hardening + accounting consistency
--
-- Goals:
-- 1. Prevent authenticated users from changing their own role/is_active.
-- 2. Force POS writes through SECURITY DEFINER transaction RPCs.
-- 3. Only sell active + available menu items.
-- 4. Record cash change as a cash-out so the drawer balances.
-- 5. Generate reservation codes server-side.

begin;

-- =========================================================
-- 1. PROTECT PRIVILEGED PROFILE FIELDS
-- =========================================================

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() = old.id
     and not public.has_role(
       array['owner'::public.user_role, 'admin'::public.user_role]
     ) then
    if new.role is distinct from old.role then
      raise exception 'Users cannot change their own role';
    end if;

    if new.is_active is distinct from old.is_active then
      raise exception 'Users cannot change their own active status';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_fields on public.profiles;
create trigger protect_profile_privileged_fields
before update on public.profiles
for each row
execute function public.protect_profile_privileged_fields();

-- =========================================================
-- 2. REMOVE DIRECT POS WRITE BYPASS
-- =========================================================

revoke insert, update, delete on public.orders from authenticated;
revoke insert, update, delete on public.order_items from authenticated;
revoke insert, update, delete on public.payments from authenticated;
revoke insert, update, delete on public.cash_register_shifts from authenticated;
revoke insert, update, delete on public.cash_register_movements from authenticated;

-- Anonymous clients never need POS writes.
revoke insert, update, delete on public.orders from anon;
revoke insert, update, delete on public.order_items from anon;
revoke insert, update, delete on public.payments from anon;
revoke insert, update, delete on public.cash_register_shifts from anon;
revoke insert, update, delete on public.cash_register_movements from anon;

-- =========================================================
-- 3. CREATE ORDERS ONLY FROM SELLABLE MENU ITEMS
-- =========================================================

create or replace function public.create_order_transaction(
  p_table_id uuid default null,
  p_customer_name text default null,
  p_notes text default null,
  p_discount_amount numeric default 0,
  p_tax_amount numeric default 0,
  p_service_charge numeric default 0,
  p_items jsonb default '[]'::jsonb,
  p_order_number text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_order public.orders;
  v_item jsonb;
  v_menu_item public.menu_items;
  v_variant public.menu_variants;
  v_quantity numeric;
  v_unit_price numeric;
  v_item_discount numeric;
  v_item_subtotal numeric;
  v_subtotal numeric := 0;
  v_total numeric;
  v_order_number text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.has_role(array['owner','admin','manager','cashier']::public.user_role[]) then
    raise exception 'Insufficient permission to create orders';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;
  if coalesce(p_discount_amount,0) < 0 or coalesce(p_tax_amount,0) < 0 or coalesce(p_service_charge,0) < 0 then
    raise exception 'Financial values cannot be negative';
  end if;

  if p_table_id is not null then
    perform 1 from public.restaurant_tables where id = p_table_id;
    if not found then raise exception 'Restaurant table not found'; end if;
  end if;

  v_order_number := coalesce(nullif(trim(p_order_number), ''),
    'ORD-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)));

  for v_item in select value from jsonb_array_elements(p_items) loop
    if not (v_item ? 'menu_item_id') then raise exception 'menu_item_id is required'; end if;
    v_quantity := coalesce((v_item->>'quantity')::integer, 0);
    if v_quantity <= 0 then raise exception 'Quantity must be greater than zero'; end if;

    select * into v_menu_item
    from public.menu_items
    where id = (v_item->>'menu_item_id')::uuid
      and is_available = true
      and status = 'active'
    for share;
    if not found then raise exception 'Menu item is not available for sale'; end if;

    v_unit_price := coalesce(v_menu_item.base_price, 0);

    if nullif(v_item->>'variant_id','') is not null then
      select * into v_variant
      from public.menu_variants
      where id = (v_item->>'variant_id')::uuid
        and menu_item_id = v_menu_item.id
        and is_available = true
      for share;
      if not found then raise exception 'Menu variant is no longer available'; end if;
      v_unit_price := coalesce(v_variant.price, 0);
    end if;

    v_item_discount := greatest(coalesce((v_item->>'discount_amount')::numeric,0),0);
    v_item_subtotal := greatest((v_quantity * v_unit_price) - v_item_discount,0);
    v_subtotal := v_subtotal + v_item_subtotal;
  end loop;

  if coalesce(p_discount_amount,0) > v_subtotal then
    raise exception 'Order discount cannot exceed subtotal';
  end if;

  v_total := v_subtotal - coalesce(p_discount_amount,0) + coalesce(p_tax_amount,0) + coalesce(p_service_charge,0);

  insert into public.orders (
    order_number, table_id, customer_name, notes, cashier_id, status, payment_status,
    subtotal, discount_amount, tax_amount, service_charge, total_amount
  ) values (
    v_order_number, p_table_id, p_customer_name, p_notes, auth.uid(), 'draft', 'unpaid',
    v_subtotal, coalesce(p_discount_amount,0), coalesce(p_tax_amount,0),
    coalesce(p_service_charge,0), v_total
  ) returning * into v_order;

  for v_item in select value from jsonb_array_elements(p_items) loop
    select * into v_menu_item
    from public.menu_items
    where id = (v_item->>'menu_item_id')::uuid;

    v_quantity := (v_item->>'quantity')::integer;
    v_unit_price := v_menu_item.base_price;
    v_item_discount := greatest(coalesce((v_item->>'discount_amount')::numeric,0),0);

    if nullif(v_item->>'variant_id','') is not null then
      select * into v_variant from public.menu_variants where id = (v_item->>'variant_id')::uuid;
      v_unit_price := v_variant.price;
    end if;

    insert into public.order_items (
      order_id, menu_item_id, variant_id, quantity, unit_price, discount_amount, subtotal, notes
    ) values (
      v_order.id, v_menu_item.id,
      case when nullif(v_item->>'variant_id','') is null then null else (v_item->>'variant_id')::uuid end,
      v_quantity, v_unit_price, v_item_discount,
      greatest((v_quantity * v_unit_price) - v_item_discount,0),
      nullif(v_item->>'notes','')
    );
  end loop;

  return v_order;
end;
$$;

-- =========================================================
-- 4. CASH CHANGE MUST LEAVE THE DRAWER
-- =========================================================

create or replace function public.process_payment_transaction(
  p_order_id uuid,
  p_amount numeric,
  p_method public.payment_method,
  p_reference_number text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_order public.orders;
  v_shift public.cash_register_shifts;
  v_payment public.payments;
  v_cash_in public.cash_register_movements;
  v_cash_out public.cash_register_movements;
  v_payment_code text;
  v_change numeric;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.has_role(array['owner','admin','manager','cashier']::public.user_role[]) then
    raise exception 'Insufficient permission to process payment';
  end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Payment amount must be greater than zero'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.status = 'cancelled' then raise exception 'Cancelled order cannot be paid'; end if;
  if v_order.payment_status = 'paid' then raise exception 'Order is already paid'; end if;
  if p_amount < v_order.total_amount then
    raise exception 'Payment amount is insufficient. Required: %, received: %', v_order.total_amount, p_amount;
  end if;

  select * into v_shift
  from public.cash_register_shifts
  where opened_by = auth.uid() and status = 'open'
  order by opened_at desc limit 1 for update;
  if not found then raise exception 'No open cash register shift found'; end if;

  v_payment_code := 'PAY-' || to_char(now(),'YYYYMMDD-HH24MISS') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));

  insert into public.payments (
    payment_code, order_id, shift_id, amount, method, status, reference_number, paid_at, received_by, notes
  ) values (
    v_payment_code, v_order.id, v_shift.id, p_amount, p_method, 'paid', p_reference_number, now(), auth.uid(), p_notes
  ) returning * into v_payment;

  update public.orders set payment_status='paid', updated_at=now() where id=v_order.id;

  v_change := greatest(p_amount - v_order.total_amount, 0);

  if p_method::text = 'cash' then
    insert into public.cash_register_movements (
      shift_id, movement_type, amount, payment_method, reference_number, description, created_by
    ) values (
      v_shift.id, 'cash_in', p_amount, p_method, v_payment.id::text,
      'Cash received for order ' || v_order.order_number, auth.uid()
    ) returning * into v_cash_in;

    if v_change > 0 then
      insert into public.cash_register_movements (
        shift_id, movement_type, amount, payment_method, reference_number, description, created_by
      ) values (
        v_shift.id, 'cash_out', v_change, p_method, v_payment.id::text,
        'Change for order ' || v_order.order_number, auth.uid()
      ) returning * into v_cash_out;
    end if;
  end if;

  select * into v_order from public.orders where id=v_order.id;

  return jsonb_build_object(
    'payment', to_jsonb(v_payment),
    'order', to_jsonb(v_order),
    'shift', to_jsonb(v_shift),
    'movement', case when v_cash_in.id is not null then to_jsonb(v_cash_in) else null end,
    'change_movement', case when v_cash_out.id is not null then to_jsonb(v_cash_out) else null end,
    'payment_id', v_payment.id::text,
    'payment_code', v_payment.payment_code,
    'order_id', v_order.id,
    'amount', p_amount,
    'order_total', v_order.total_amount,
    'change_amount', v_change,
    'method', p_method,
    'shift_id', v_shift.id
  );
end;
$$;

-- =========================================================
-- 5. SERVER-SIDE RESERVATION CODE
-- =========================================================

create or replace function public.generate_reservation_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
begin
  return 'RES-' || to_char(now(),'YYYYMMDD-HH24MISS') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
end;
$$;

alter table public.reservations
  alter column reservation_code set default public.generate_reservation_code();

grant execute on function public.generate_reservation_code() to anon, authenticated;

commit;
