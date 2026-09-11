-- COREÉATERY
-- Migration: 0011_fix_order_item_name_snapshot
--
-- Fix:
-- create_order_transaction must populate order_items.item_name.
-- The item name is snapshotted from server-side menu data so
-- clients cannot inject arbitrary item names.

begin;

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
  v_item_name text;
  v_subtotal numeric := 0;
  v_total numeric;
  v_order_number text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.has_role(
    array['owner','admin','manager','cashier']::public.user_role[]
  ) then
    raise exception 'Insufficient permission to create orders';
  end if;

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
    where id = p_table_id
      and is_active = true;

    if not found then
      raise exception 'Restaurant table not found or inactive';
    end if;
  end if;

  v_order_number := coalesce(
    nullif(trim(p_order_number), ''),
    'ORD-' ||
    to_char(now(), 'YYYYMMDD-HH24MISS') ||
    '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  );

  -- =========================================================
  -- VALIDATE ITEMS + CALCULATE SERVER-SIDE TOTALS
  -- =========================================================

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    if not (v_item ? 'menu_item_id') then
      raise exception 'menu_item_id is required';
    end if;

    v_quantity := coalesce(
      (v_item->>'quantity')::numeric,
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
      and status = 'active'
    for share;

    if not found then
      raise exception 'Menu item is not available for sale';
    end if;

    v_unit_price := coalesce(v_menu_item.base_price, 0);

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

    v_item_subtotal := greatest(
      (v_quantity * v_unit_price) - v_item_discount,
      0
    );

    v_subtotal := v_subtotal + v_item_subtotal;
  end loop;

  if coalesce(p_discount_amount, 0) > v_subtotal then
    raise exception 'Order discount cannot exceed subtotal';
  end if;

  v_total :=
    v_subtotal
    - coalesce(p_discount_amount, 0)
    + coalesce(p_tax_amount, 0)
    + coalesce(p_service_charge, 0);

  -- =========================================================
  -- CREATE ORDER
  -- =========================================================

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

  -- =========================================================
  -- CREATE ORDER ITEMS WITH SERVER-SIDE NAME SNAPSHOT
  -- =========================================================

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    select *
    into v_menu_item
    from public.menu_items
    where id = (v_item->>'menu_item_id')::uuid;

    v_quantity := (v_item->>'quantity')::numeric;

    v_unit_price := v_menu_item.base_price;

    v_item_discount := greatest(
      coalesce((v_item->>'discount_amount')::numeric, 0),
      0
    );

    v_item_name := v_menu_item.name_id;

    if nullif(v_item->>'variant_id', '') is not null then
      select *
      into v_variant
      from public.menu_variants
      where id = (v_item->>'variant_id')::uuid
        and menu_item_id = v_menu_item.id;

      if not found then
        raise exception 'Menu variant not found';
      end if;

      v_unit_price := v_variant.price;

      v_item_name := concat_ws(
        ' - ',
        v_menu_item.name_id,
        v_variant.name_id
      );
    end if;

    insert into public.order_items (
      order_id,
      menu_item_id,
      variant_id,
      item_name,
      quantity,
      unit_price,
      discount_amount,
      subtotal,
      notes
    )
    values (
      v_order.id,
      v_menu_item.id,
      case
        when nullif(v_item->>'variant_id', '') is null
          then null
        else (v_item->>'variant_id')::uuid
      end,
      v_item_name,
      v_quantity,
      v_unit_price,
      v_item_discount,
      greatest(
        (v_quantity * v_unit_price) - v_item_discount,
        0
      ),
      nullif(v_item->>'notes', '')
    );
  end loop;

  return v_order;
end;
$$;

commit;
