-- COREÉATERY
-- POS Integrity V1
-- Atomic Order + Payment + Cash Register
--
-- IMPORTANT:
-- This migration is intentionally created locally first.
-- Do NOT run `supabase db push` yet.

begin;

-- =========================================================
-- 1. CREATE ORDER TRANSACTION
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
  v_role public.user_role;
begin
  -- -------------------------------------------------------
  -- Authorization
  -- -------------------------------------------------------

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.has_role(
    array[
      'owner'::public.user_role,
      'admin'::public.user_role,
      'manager'::public.user_role,
      'cashier'::public.user_role
    ]
  ) then
    raise exception 'Insufficient permission to create orders';
  end if;

  -- -------------------------------------------------------
  -- Basic validation
  -- -------------------------------------------------------

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  if coalesce(p_discount_amount, 0) < 0
     or coalesce(p_tax_amount, 0) < 0
     or coalesce(p_service_charge, 0) < 0 then
    raise exception 'Financial values cannot be negative';
  end if;

  if p_table_id is not null then
    perform 1
    from public.restaurant_tables
    where id = p_table_id;

    if not found then
      raise exception 'Restaurant table not found';
    end if;
  end if;

  -- -------------------------------------------------------
  -- Order number
  -- -------------------------------------------------------

  v_order_number := coalesce(
    nullif(trim(p_order_number), ''),
    'ORD-' ||
    to_char(now(), 'YYYYMMDD-HH24MISS') ||
    '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  );

  -- -------------------------------------------------------
  -- Calculate items using DATABASE prices
  -- Browser supplied prices are deliberately ignored.
  -- -------------------------------------------------------

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop

    if not (v_item ? 'menu_item_id') then
      raise exception 'menu_item_id is required';
    end if;

    v_quantity := coalesce(
      (v_item->>'quantity')::integer,
      0
    );

    if v_quantity <= 0 then
      raise exception 'Quantity must be greater than zero';
    end if;

    select *
    into v_menu_item
    from public.menu_items
    where id = (v_item->>'menu_item_id')::uuid
      and is_available = true
      and status <> 'draft'
    for share;

    if not found then
      raise exception 'Menu item not found';
    end if;

    v_unit_price := coalesce(v_menu_item.base_price, 0);

    -- -----------------------------------------------------
    -- Optional variant
    -- -----------------------------------------------------

    if nullif(v_item->>'variant_id', '') is not null then

      select *
      into v_variant
      from public.menu_variants
      where id = (v_item->>'variant_id')::uuid
        and menu_item_id = v_menu_item.id
        and is_available = true
      for share;

      if not found then
        raise exception 'Menu variant is no longer available';
      end if;

      v_unit_price := coalesce(v_variant.price, 0);
    end if;

    v_item_discount := greatest(
      coalesce((v_item->>'discount_amount')::numeric, 0),
      0
    );

    v_item_subtotal :=
      greatest(
        (v_quantity * v_unit_price) - v_item_discount,
        0
      );

    v_subtotal := v_subtotal + v_item_subtotal;
  end loop;

  -- -------------------------------------------------------
  -- Final total
  -- -------------------------------------------------------

  v_total := greatest(
    v_subtotal
    - coalesce(p_discount_amount, 0)
    + coalesce(p_tax_amount, 0)
    + coalesce(p_service_charge, 0),
    0
  );

  -- -------------------------------------------------------
  -- Create order
  -- -------------------------------------------------------

  insert into public.orders (
    order_number,
    table_id,
    customer_name,
    notes,
    cashier_id,
    status,
    payment_status,
    subtotal,
    discount_amount,
    tax_amount,
    service_charge,
    total_amount
  )
  values (
    v_order_number,
    p_table_id,
    p_customer_name,
    p_notes,
    auth.uid(),
    'draft',
    'unpaid',
    v_subtotal,
    coalesce(p_discount_amount, 0),
    coalesce(p_tax_amount, 0),
    coalesce(p_service_charge, 0),
    v_total
  )
  returning *
  into v_order;

  -- -------------------------------------------------------
  -- Insert calculated items
  -- -------------------------------------------------------

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop

    select *
    into v_menu_item
    from public.menu_items
    where id = (v_item->>'menu_item_id')::uuid
      and is_available = true
      and status <> 'draft';

    if not found then
      raise exception 'Menu item is no longer available';
    end if;

    v_quantity := (v_item->>'quantity')::numeric;
    v_unit_price := coalesce(v_menu_item.base_price, 0);

    if nullif(v_item->>'variant_id', '') is not null then
      select *
      into v_variant
      from public.menu_variants
      where id = (v_item->>'variant_id')::uuid
        and menu_item_id = v_menu_item.id
        and is_available = true;

      if not found then
        raise exception 'Menu variant is no longer available';
      end if;

      v_unit_price := coalesce(v_variant.price, 0);
    end if;

    v_item_discount := greatest(
      coalesce((v_item->>'discount_amount')::numeric, 0),
      0
    );

    v_item_subtotal := greatest(
      (v_quantity * v_unit_price) - v_item_discount,
      0
    );

    insert into public.order_items (
      order_id,
      menu_item_id,
      variant_id,
      item_name,
      unit_price,
      quantity,
      discount_amount,
      subtotal,
      notes
    )
    values (
      v_order.id,
      v_menu_item.id,
      nullif(v_item->>'variant_id', '')::uuid,
      v_menu_item.name_id,
      v_unit_price,
      v_quantity,
      v_item_discount,
      v_item_subtotal,
      v_item->>'notes'
    );
  end loop;

  return v_order;
end;
$$;


-- =========================================================
-- 2. ATOMIC PAYMENT TRANSACTION
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
  v_payment_code text;
  v_change numeric;
begin
  -- -------------------------------------------------------
  -- Authorization
  -- -------------------------------------------------------

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.has_role(
    array[
      'owner'::public.user_role,
      'admin'::public.user_role,
      'manager'::public.user_role,
      'cashier'::public.user_role
    ]
  ) then
    raise exception 'Insufficient permission to process payment';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  -- -------------------------------------------------------
  -- Lock order
  -- -------------------------------------------------------

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.status = 'cancelled' then
    raise exception 'Cancelled order cannot be paid';
  end if;

  if v_order.payment_status = 'paid' then
    raise exception 'Order is already paid';
  end if;

  if p_amount < v_order.total_amount then
    raise exception
      'Payment amount is insufficient. Required: %, received: %',
      v_order.total_amount,
      p_amount;
  end if;

  -- -------------------------------------------------------
  -- Lock current user's open shift
  -- -------------------------------------------------------

  select *
  into v_shift
  from public.cash_register_shifts
  where opened_by = auth.uid()
    and status = 'open'
  order by opened_at desc
  limit 1
  for update;

  if not found then
    raise exception 'No open cash register shift found';
  end if;

  -- -------------------------------------------------------
  -- Generate payment code
  -- -------------------------------------------------------

  v_payment_code :=
    'PAY-' ||
    to_char(now(), 'YYYYMMDD-HH24MISS') ||
    '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  -- -------------------------------------------------------
  -- Insert payment
  -- -------------------------------------------------------

  insert into public.payments (
    payment_code,
    order_id,
    shift_id,
    amount,
    method,
    status,
    reference_number,
    paid_at,
    received_by,
    notes
  )
  values (
    v_payment_code,
    v_order.id,
    v_shift.id,
    p_amount,
    p_method,
    'paid',
    p_reference_number,
    now(),
    auth.uid(),
    p_notes
  )
  returning *
  into v_payment;

  -- -------------------------------------------------------
  -- Mark payment state on order
  -- Order status is intentionally NOT changed here.
  -- Completion is controlled separately by update_order_status().
  -- -------------------------------------------------------

  update public.orders
  set
    payment_status = 'paid',
    updated_at = now()
  where id = v_order.id;

  -- -------------------------------------------------------
  -- Cash movement only for CASH
  -- -------------------------------------------------------

  if p_method::text = 'cash' then

    insert into public.cash_register_movements (
      shift_id,
      movement_type,
      amount,
      payment_method,
      reference_number,
      description,
      created_by
    )
    values (
      v_shift.id,
      'cash_in',
      p_amount,
      p_method,
      v_payment.id::text,
      'Cash payment for order ' || v_order.order_number,
      auth.uid()
    );

  end if;

    -- Refresh order after payment update so the UI receives
    -- the latest payment status.
    select *
    into v_order
    from public.orders
    where id = v_order.id;

    v_change := p_amount - v_order.total_amount;

    return jsonb_build_object(
      'payment', to_jsonb(v_payment),
      'order', to_jsonb(v_order),
      'shift', to_jsonb(v_shift),
      'movement',
        case
          when p_method::text = 'cash' then (
            select to_jsonb(m)
            from public.cash_register_movements m
            where m.shift_id = v_shift.id
              and m.reference_number = v_payment.id::text
            order by m.created_at desc
            limit 1
          )
          else null
        end,
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
-- 3. CLOSE CASH REGISTER SHIFT
-- =========================================================

create or replace function public.open_cash_register_shift(
  p_register_name text,
  p_opening_cash numeric
)
returns public.cash_register_shifts
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_shift public.cash_register_shifts;
  v_register_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.has_role(
    array[
      'owner'::public.user_role,
      'admin'::public.user_role,
      'manager'::public.user_role,
      'cashier'::public.user_role
    ]
  ) then
    raise exception 'Insufficient permissions';
  end if;

  if p_opening_cash is null or p_opening_cash < 0 then
    raise exception 'Opening cash must be greater than or equal to zero';
  end if;

  v_register_name := coalesce(
    nullif(trim(p_register_name), ''),
    'Kasir Utama'
  );

  if exists (
    select 1
    from public.cash_register_shifts
    where register_name = v_register_name
      and status = 'open'
  ) then
    raise exception 'Register already has an open shift';
  end if;

  insert into public.cash_register_shifts (
    register_name,
    opened_by,
    opening_cash,
    status
  )
  values (
    v_register_name,
    auth.uid(),
    p_opening_cash,
    'open'
  )
  returning * into v_shift;

  return v_shift;

exception
  when unique_violation then
    raise exception 'Register already has an open shift';
end;
$$;


create or replace function public.close_cash_register_shift(
  p_shift_id uuid,
  p_actual_cash numeric
)
returns public.cash_register_shifts
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_shift public.cash_register_shifts;
  v_expected_cash numeric;
  v_difference numeric;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_actual_cash is null or p_actual_cash < 0 then
    raise exception 'Actual cash cannot be negative';
  end if;

  -- -------------------------------------------------------
  -- Lock shift
  -- -------------------------------------------------------

  select *
  into v_shift
  from public.cash_register_shifts
  where id = p_shift_id
  for update;

  if not found then
    raise exception 'Cash register shift not found';
  end if;

  if v_shift.status <> 'open' then
    raise exception 'Cash register shift is already closed';
  end if;

  -- -------------------------------------------------------
  -- Permission:
  -- cashier can close own shift.
  -- management can close any shift.
  -- -------------------------------------------------------

  if not (
    v_shift.opened_by = auth.uid()
    or public.has_role(
      array[
        'owner'::public.user_role,
        'admin'::public.user_role,
        'manager'::public.user_role
      ]
    )
  ) then
    raise exception 'Insufficient permission to close this shift';
  end if;

  -- -------------------------------------------------------
  -- Expected cash
  --
  -- Opening cash
  -- + cash_in
  -- - cash_out
  -- -------------------------------------------------------

  select
    v_shift.opening_cash
    + coalesce(
        sum(
          case
            when movement_type::text = 'cash_in'
              then amount
            when movement_type::text = 'cash_out'
              then -amount
            else 0
          end
        ),
        0
      )
  into v_expected_cash
  from public.cash_register_movements
  where shift_id = v_shift.id;

  v_expected_cash := greatest(v_expected_cash, 0);
  v_difference := p_actual_cash - v_expected_cash;

  -- -------------------------------------------------------
  -- Close
  -- -------------------------------------------------------

  update public.cash_register_shifts
  set
    expected_cash = v_expected_cash,
    actual_cash = p_actual_cash,
    difference = v_difference,
    closed_by = auth.uid(),
    closed_at = now(),
    status = 'closed',
    updated_at = now()
  where id = v_shift.id
  returning *
  into v_shift;

  return v_shift;
end;
$$;


-- =========================================================
-- 4. FUNCTION PRIVILEGES
-- =========================================================


-- =========================================================
-- ORDER STATUS / TOTALS INTEGRITY
-- =========================================================

create or replace function public.update_order_status(
  p_order_id uuid,
  p_status public.order_status
)
returns public.orders
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_order public.orders;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.has_role(
    array[
      'owner'::public.user_role,
      'admin'::public.user_role,
      'manager'::public.user_role,
      'cashier'::public.user_role,
      'kitchen'::public.user_role,
      'staff'::public.user_role
    ]
  ) then
    raise exception 'Insufficient permissions';
  end if;

  select *
    into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  -- Terminal states cannot be reopened.
  if v_order.status = 'cancelled' then
    if p_status <> 'cancelled' then
      raise exception 'Cancelled order cannot be reopened';
    end if;
  end if;

  if v_order.status = 'completed' then
    if p_status <> 'completed' then
      raise exception 'Completed order cannot be changed';
    end if;
  end if;

  -- Paid orders must remain completed.
  if v_order.payment_status = 'paid'
     and p_status <> 'completed' then
    raise exception 'Paid order must remain completed';
  end if;

  -- Enforce forward-only operational transitions.
  if v_order.status = 'draft'
     and p_status not in ('draft', 'pending', 'cancelled') then
    raise exception 'Invalid transition from draft to %', p_status;
  end if;

  if v_order.status = 'pending'
     and p_status not in ('pending', 'confirmed', 'cancelled') then
    raise exception 'Invalid transition from pending to %', p_status;
  end if;

  if v_order.status = 'confirmed'
     and p_status not in ('confirmed', 'preparing', 'cancelled') then
    raise exception 'Invalid transition from confirmed to %', p_status;
  end if;

  if v_order.status = 'preparing'
     and p_status not in ('preparing', 'ready', 'cancelled') then
    raise exception 'Invalid transition from preparing to %', p_status;
  end if;

  if v_order.status = 'ready'
     and p_status not in ('ready', 'completed', 'cancelled') then
    raise exception 'Invalid transition from ready to %', p_status;
  end if;

  -- Completion requires a paid order.
  if p_status = 'completed'
     and v_order.payment_status <> 'paid' then
    raise exception 'Order must be paid before completion';
  end if;

  update public.orders
  set status = p_status,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

create or replace function public.recalculate_order_totals(
  p_order_id uuid
)
returns public.orders
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_order public.orders;
  v_subtotal numeric := 0;
  v_total numeric := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.has_role(
    array[
      'owner'::public.user_role,
      'admin'::public.user_role,
      'manager'::public.user_role,
      'cashier'::public.user_role
    ]
  ) then
    raise exception 'Insufficient permissions';
  end if;

  select *
    into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.payment_status = 'paid' then
    raise exception 'Paid order totals are immutable';
  end if;

  select coalesce(
    sum(
      greatest(
        0,
        (quantity * unit_price) - discount_amount
      )
    ),
    0
  )
  into v_subtotal
  from public.order_items
  where order_id = p_order_id;

  if v_order.discount_amount > v_subtotal then
    raise exception 'Order discount cannot exceed subtotal';
  end if;

  v_total := greatest(
    0,
    v_subtotal
      - greatest(0, v_order.discount_amount)
      + greatest(0, v_order.tax_amount)
      + greatest(0, v_order.service_charge)
  );

  update public.orders
  set subtotal = v_subtotal,
      total_amount = v_total,
      updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;


revoke all on function public.update_order_status(
  uuid,
  public.order_status
) from public, anon;

grant execute on function public.update_order_status(
  uuid,
  public.order_status
) to authenticated;


revoke all on function public.recalculate_order_totals(
  uuid
) from public, anon;

grant execute on function public.recalculate_order_totals(
  uuid
) to authenticated;


revoke all on function public.create_order_transaction(
  uuid,
  text,
  text,
  numeric,
  numeric,
  numeric,
  jsonb,
  text
) from public, anon;

revoke all on function public.process_payment_transaction(
  uuid,
  numeric,
  public.payment_method,
  text,
  text
) from public, anon;


revoke all on function public.open_cash_register_shift(
  text,
  numeric
) from public, anon;

grant execute on function public.open_cash_register_shift(
  text,
  numeric
) to authenticated;

revoke all on function public.close_cash_register_shift(
  uuid,
  numeric
) from public, anon;


grant execute on function public.create_order_transaction(
  uuid,
  text,
  text,
  numeric,
  numeric,
  numeric,
  jsonb,
  text
) to authenticated;

grant execute on function public.process_payment_transaction(
  uuid,
  numeric,
  public.payment_method,
  text,
  text
) to authenticated;

grant execute on function public.close_cash_register_shift(
  uuid,
  numeric
) to authenticated;


commit;
