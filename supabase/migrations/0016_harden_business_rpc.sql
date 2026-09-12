-- COREÉATERY 0016: Harden Business RPC

create or replace function public.create_kitchen_ticket_for_order(p_order_id uuid)
returns public.kitchen_tickets
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_ticket public.kitchen_tickets;
begin
  if auth.uid() is null
     or not public.has_role(
       array['owner','admin','manager','kitchen']::public.user_role[]
     ) then
    raise exception 'Insufficient permission';
  end if;

  insert into public.kitchen_tickets(order_id)
  values (p_order_id)
  on conflict (order_id) do update
    set order_id = excluded.order_id
  returning * into v_ticket;

  return v_ticket;
end
$$;

create or replace function public.consume_inventory_for_order(p_order_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_item record;
  v_count integer := 0;
  v_qty numeric;
begin
  if auth.uid() is null
     or not public.has_role(
       array['owner','admin','manager','kitchen']::public.user_role[]
     ) then
    raise exception 'Insufficient permission';
  end if;

  for v_item in
    select
      oi.menu_item_id,
      oi.quantity as order_qty,
      r.inventory_item_id,
      r.quantity_per_item
    from public.order_items oi
    join public.recipes r
      on r.menu_item_id = oi.menu_item_id
    where oi.order_id = p_order_id
  loop
    v_qty := v_item.order_qty * v_item.quantity_per_item;

    update public.inventory_items
    set current_stock = current_stock - v_qty,
        updated_at = now()
    where id = v_item.inventory_item_id
      and is_active = true
      and current_stock >= v_qty;

    if not found then
      raise exception
        'Insufficient stock for inventory item %',
        v_item.inventory_item_id;
    end if;

    insert into public.inventory_movements
      (
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
      id,
      'consume',
      v_qty,
      cost_per_unit,
      'order',
      p_order_id,
      'Auto-consume from order',
      auth.uid()
    from public.inventory_items
    where id = v_item.inventory_item_id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end
$$;

revoke execute on function public.create_kitchen_ticket_for_order(uuid)
from authenticated;

revoke execute on function public.consume_inventory_for_order(uuid)
from authenticated;

grant execute on function public.create_kitchen_ticket_for_order(uuid)
to authenticated;

grant execute on function public.consume_inventory_for_order(uuid)
to authenticated;
