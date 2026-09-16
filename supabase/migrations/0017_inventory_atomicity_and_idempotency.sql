-- COREÉATERY 0017
-- Inventory Atomicity + Idempotency
--
-- Goals:
-- 1. Prevent duplicate inventory consumption for the same order.
-- 2. Serialize concurrent consumption attempts per order.
-- 3. Lock inventory rows before authoritative stock validation.
-- 4. Revalidate stock after row locks.
-- 5. Deduct inventory atomically.
-- 6. Record one consume movement per order/inventory item.
-- 7. Any failure rolls back the complete transaction.

create or replace function public.consume_inventory_for_order(
  p_order_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_item record;
  v_existing_consumption integer;
  v_count integer := 0;
begin

  --------------------------------------------------------------------
  -- SECURITY
  --------------------------------------------------------------------

  if auth.uid() is null
     or not public.has_role(
       array['owner','admin','manager','kitchen']::public.user_role[]
     ) then
    raise exception 'Insufficient permission';
  end if;

  --------------------------------------------------------------------
  -- ORDER-LEVEL IDEMPOTENCY / CONCURRENCY LOCK
  --------------------------------------------------------------------

  perform pg_advisory_xact_lock(
    hashtextextended(p_order_id::text, 0)
  );

  --------------------------------------------------------------------
  -- IDEMPOTENCY CHECK
  --
  -- Because this function is fully transactional, any previous
  -- successful consumption means the order has already been consumed.
  --------------------------------------------------------------------

  select count(*)
    into v_existing_consumption
  from public.inventory_movements
  where reference_type = 'order'
    and reference_id = p_order_id
    and movement_type = 'consume';

  if v_existing_consumption > 0 then
    return 0;
  end if;

  --------------------------------------------------------------------
  -- LOCK ALL RELEVANT INVENTORY ROWS FIRST
  --
  -- This is the authoritative concurrency boundary.
  --------------------------------------------------------------------

  for v_item in
    select ii.id
    from public.inventory_items ii
    where ii.id in (
      select distinct r.inventory_item_id
      from public.order_items oi
      join public.recipes r
        on r.menu_item_id = oi.menu_item_id
      where oi.order_id = p_order_id
    )
    order by ii.id
    for update
  loop
    null;
  end loop;

  --------------------------------------------------------------------
  -- AUTHORITATIVE STOCK VALIDATION AFTER LOCK
  --------------------------------------------------------------------

  for v_item in
    select
      r.inventory_item_id,
      sum(
        oi.quantity * r.quantity_per_item
      ) as required_quantity,
      ii.current_stock,
      ii.is_active
    from public.order_items oi
    join public.recipes r
      on r.menu_item_id = oi.menu_item_id
    join public.inventory_items ii
      on ii.id = r.inventory_item_id
    where oi.order_id = p_order_id
    group by
      r.inventory_item_id,
      ii.current_stock,
      ii.is_active
    order by r.inventory_item_id
  loop

    if not v_item.is_active then
      raise exception
        'Inventory item % is inactive',
        v_item.inventory_item_id;
    end if;

    if v_item.current_stock < v_item.required_quantity then
      raise exception
        'Insufficient stock for inventory item %. Required: %, Available: %',
        v_item.inventory_item_id,
        v_item.required_quantity,
        v_item.current_stock;
    end if;

  end loop;

  --------------------------------------------------------------------
  -- ATOMIC INVENTORY DEDUCTION
  --------------------------------------------------------------------

  for v_item in
    select
      r.inventory_item_id,
      sum(
        oi.quantity * r.quantity_per_item
      ) as required_quantity
    from public.order_items oi
    join public.recipes r
      on r.menu_item_id = oi.menu_item_id
    where oi.order_id = p_order_id
    group by r.inventory_item_id
    order by r.inventory_item_id
  loop

    update public.inventory_items
    set
      current_stock = current_stock - v_item.required_quantity,
      updated_at = now()
    where id = v_item.inventory_item_id
      and is_active = true
      and current_stock >= v_item.required_quantity;

    if not found then
      raise exception
        'Inventory deduction failed for inventory item %',
        v_item.inventory_item_id;
    end if;

    v_count := v_count + 1;

  end loop;

  --------------------------------------------------------------------
  -- INVENTORY MOVEMENT AUDIT
  --------------------------------------------------------------------

  insert into public.inventory_movements (
    inventory_item_id,
    movement_type,
    quantity,
    unit_cost,
    reference_type,
    reference_id,
    notes,
    created_by
  )
  select
    r.inventory_item_id,
    'consume',
    sum(
      oi.quantity * r.quantity_per_item
    ),
    ii.cost_per_unit,
    'order',
    p_order_id,
    'Auto-consume from order',
    auth.uid()
  from public.order_items oi
  join public.recipes r
    on r.menu_item_id = oi.menu_item_id
  join public.inventory_items ii
    on ii.id = r.inventory_item_id
  where oi.order_id = p_order_id
  group by
    r.inventory_item_id,
    ii.cost_per_unit;

  return v_count;

end;
$$;

----------------------------------------------------------------------
-- EXECUTION PERMISSION
----------------------------------------------------------------------

revoke execute
on function public.consume_inventory_for_order(uuid)
from authenticated;

grant execute
on function public.consume_inventory_for_order(uuid)
to authenticated;

----------------------------------------------------------------------
-- IDEMPOTENCY DATABASE GUARD
--
-- Only one consume movement may exist for an order/inventory item.
----------------------------------------------------------------------

create unique index if not exists
  inventory_movements_order_consume_unique
on public.inventory_movements (
  reference_type,
  reference_id,
  inventory_item_id
)
where movement_type = 'consume'
  and reference_type = 'order'
  and reference_id is not null;
