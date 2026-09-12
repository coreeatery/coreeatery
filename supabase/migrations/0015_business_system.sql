-- COREÉATERY 0015: Business System + Automation + Offline/PWA foundation
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint suppliers_name_check check (length(trim(name)) > 0)
);
create unique index if not exists suppliers_name_unique on public.suppliers (lower(trim(name)));

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  sku text,
  name text not null,
  unit text not null default 'pcs',
  current_stock numeric not null default 0,
  min_stock numeric not null default 0,
  cost_per_unit numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_name_check check (length(trim(name)) > 0),
  constraint inventory_stock_check check (current_stock >= 0),
  constraint inventory_min_stock_check check (min_stock >= 0),
  constraint inventory_cost_check check (cost_per_unit >= 0)
);
create unique index if not exists inventory_sku_unique on public.inventory_items (lower(trim(sku)))
  where sku is not null and length(trim(sku)) > 0;
create index if not exists inventory_low_stock_idx on public.inventory_items (current_stock, min_stock)
  where is_active = true;

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  movement_type text not null,
  quantity numeric not null,
  unit_cost numeric not null default 0,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inventory_movement_type_check check (movement_type in ('receive','consume','adjust')),
  constraint inventory_movement_quantity_check check (quantity > 0),
  constraint inventory_movement_cost_check check (unit_cost >= 0)
);
create index if not exists inventory_movements_item_idx on public.inventory_movements (inventory_item_id, created_at desc);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity_per_item numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipes_qty_check check (quantity_per_item > 0),
  constraint recipes_unique unique (menu_item_id, inventory_item_id)
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  purchase_number text not null unique,
  supplier_id uuid references public.suppliers(id) on delete set null,
  status text not null default 'draft',
  total_amount numeric not null default 0,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_status_check check (status in ('draft','submitted','received','cancelled')),
  constraint purchase_total_check check (total_amount >= 0)
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  quantity numeric not null,
  unit_cost numeric not null,
  subtotal numeric generated always as (quantity * unit_cost) stored,
  constraint purchase_item_qty_check check (quantity > 0),
  constraint purchase_item_cost_check check (unit_cost >= 0)
);
create index if not exists purchase_orders_status_idx on public.purchase_orders (status, created_at desc);

create table if not exists public.kitchen_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  status text not null default 'queued',
  priority integer not null default 0,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  ready_at timestamptz,
  completed_at timestamptz,
  notes text,
  constraint kitchen_status_check check (status in ('queued','preparing','ready','completed','cancelled'))
);
create index if not exists kitchen_tickets_status_idx on public.kitchen_tickets (status, priority desc, queued_at);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  notification_type text not null,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, read_at, created_at desc);

create table if not exists public.daily_sales_summaries (
  business_date date primary key,
  total_sales numeric not null default 0,
  paid_transactions integer not null default 0,
  cash_sales numeric not null default 0,
  card_sales numeric not null default 0,
  qris_sales numeric not null default 0,
  other_sales numeric not null default 0,
  generated_at timestamptz not null default now()
);

create or replace function public.generate_daily_sales_summary(p_business_date date default (now() at time zone 'Asia/Jakarta')::date)
returns public.daily_sales_summaries language plpgsql security definer set search_path = public, auth as $$
declare v_result public.daily_sales_summaries;
begin
  if auth.uid() is not null and not public.has_role(array['owner','admin','manager']::public.user_role[]) then
    raise exception 'Insufficient permission';
  end if;
  insert into public.daily_sales_summaries
    (business_date,total_sales,paid_transactions,cash_sales,card_sales,qris_sales,other_sales,generated_at)
  select p_business_date,
    coalesce(sum(case when p.status='paid' then p.amount else 0 end),0),
    count(*) filter (where p.status='paid'),
    coalesce(sum(case when p.status='paid' and p.method='cash' then p.amount else 0 end),0),
    coalesce(sum(case when p.status='paid' and p.method='card' then p.amount else 0 end),0),
    coalesce(sum(case when p.status='paid' and p.method='qris' then p.amount else 0 end),0),
    coalesce(sum(case when p.status='paid' and p.method not in ('cash','card','qris') then p.amount else 0 end),0),
    now()
  from public.payments p
  where (p.paid_at at time zone 'Asia/Jakarta')::date=p_business_date
  on conflict (business_date) do update set
    total_sales=excluded.total_sales, paid_transactions=excluded.paid_transactions,
    cash_sales=excluded.cash_sales, card_sales=excluded.card_sales,
    qris_sales=excluded.qris_sales, other_sales=excluded.other_sales, generated_at=now()
  returning * into v_result;
  return v_result;
end $$;

create or replace function public.create_kitchen_ticket_for_order(p_order_id uuid)
returns public.kitchen_tickets language plpgsql security definer set search_path=public,auth as $$
declare v_ticket public.kitchen_tickets;
begin
  insert into public.kitchen_tickets(order_id) values(p_order_id)
  on conflict(order_id) do update set order_id=excluded.order_id
  returning * into v_ticket;
  return v_ticket;
end $$;

create or replace function public.receive_inventory(
  p_inventory_item_id uuid,p_quantity numeric,p_unit_cost numeric default 0,
  p_reference_type text default null,p_reference_id uuid default null,p_notes text default null
)
returns public.inventory_items language plpgsql security definer set search_path=public,auth as $$
declare v_item public.inventory_items;
begin
  if auth.uid() is null or not public.has_role(array['owner','admin','manager']::public.user_role[]) then
    raise exception 'Insufficient permission';
  end if;
  if p_quantity<=0 or p_unit_cost<0 then raise exception 'Invalid inventory values'; end if;
  update public.inventory_items set current_stock=current_stock+p_quantity,
    cost_per_unit=case when p_unit_cost>0 then p_unit_cost else cost_per_unit end,updated_at=now()
  where id=p_inventory_item_id and is_active=true returning * into v_item;
  if not found then raise exception 'Inventory item not found'; end if;
  insert into public.inventory_movements
    (inventory_item_id,movement_type,quantity,unit_cost,reference_type,reference_id,notes,created_by)
  values(p_inventory_item_id,'receive',p_quantity,p_unit_cost,p_reference_type,p_reference_id,p_notes,auth.uid());
  return v_item;
end $$;

create or replace function public.consume_inventory_for_order(p_order_id uuid)
returns integer language plpgsql security definer set search_path=public,auth as $$
declare v_item record;v_count integer:=0;v_qty numeric;
begin
  for v_item in
    select oi.menu_item_id,oi.quantity order_qty,r.inventory_item_id,r.quantity_per_item
    from public.order_items oi join public.recipes r on r.menu_item_id=oi.menu_item_id
    where oi.order_id=p_order_id
  loop
    v_qty:=v_item.order_qty*v_item.quantity_per_item;
    update public.inventory_items set current_stock=current_stock-v_qty,updated_at=now()
    where id=v_item.inventory_item_id and current_stock>=v_qty;
    if found then
      insert into public.inventory_movements
        (inventory_item_id,movement_type,quantity,unit_cost,reference_type,reference_id,notes,created_by)
      select id,'consume',v_qty,cost_per_unit,'order',p_order_id,'Auto-consume from paid order',auth.uid()
      from public.inventory_items where id=v_item.inventory_item_id;
      v_count:=v_count+1;
    end if;
  end loop;
  return v_count;
end $$;

alter table public.suppliers enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.recipes enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.kitchen_tickets enable row level security;
alter table public.notifications enable row level security;
alter table public.daily_sales_summaries enable row level security;

drop policy if exists suppliers_select on public.suppliers;
create policy suppliers_select on public.suppliers for select to authenticated using (public.has_role(array['owner','admin','manager','cashier','kitchen','staff']::public.user_role[]));
drop policy if exists suppliers_manage on public.suppliers;
create policy suppliers_manage on public.suppliers for all to authenticated using (public.has_role(array['owner','admin','manager']::public.user_role[])) with check (public.has_role(array['owner','admin','manager']::public.user_role[]));

drop policy if exists inventory_select on public.inventory_items;
create policy inventory_select on public.inventory_items for select to authenticated using (public.has_role(array['owner','admin','manager','cashier','kitchen','staff']::public.user_role[]));
drop policy if exists inventory_manage on public.inventory_items;
create policy inventory_manage on public.inventory_items for all to authenticated using (public.has_role(array['owner','admin','manager']::public.user_role[])) with check (public.has_role(array['owner','admin','manager']::public.user_role[]));

drop policy if exists inventory_movements_select on public.inventory_movements;
create policy inventory_movements_select on public.inventory_movements for select to authenticated using (public.has_role(array['owner','admin','manager','cashier','kitchen','staff']::public.user_role[]));

drop policy if exists recipes_select on public.recipes;
create policy recipes_select on public.recipes for select to authenticated using (public.has_role(array['owner','admin','manager','kitchen','staff']::public.user_role[]));
drop policy if exists recipes_manage on public.recipes;
create policy recipes_manage on public.recipes for all to authenticated using (public.has_role(array['owner','admin','manager']::public.user_role[])) with check (public.has_role(array['owner','admin','manager']::public.user_role[]));

drop policy if exists purchase_orders_all on public.purchase_orders;
create policy purchase_orders_all on public.purchase_orders for all to authenticated using (public.has_role(array['owner','admin','manager']::public.user_role[])) with check (public.has_role(array['owner','admin','manager']::public.user_role[]));
drop policy if exists purchase_order_items_all on public.purchase_order_items;
create policy purchase_order_items_all on public.purchase_order_items for all to authenticated using (public.has_role(array['owner','admin','manager']::public.user_role[])) with check (public.has_role(array['owner','admin','manager']::public.user_role[]));

drop policy if exists kitchen_tickets_select on public.kitchen_tickets;
create policy kitchen_tickets_select on public.kitchen_tickets for select to authenticated using (public.has_role(array['owner','admin','manager','kitchen']::public.user_role[]));
drop policy if exists kitchen_tickets_update on public.kitchen_tickets;
create policy kitchen_tickets_update on public.kitchen_tickets for update to authenticated using (public.has_role(array['owner','admin','manager','kitchen']::public.user_role[])) with check (public.has_role(array['owner','admin','manager','kitchen']::public.user_role[]));

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select to authenticated using (user_id=auth.uid() or public.has_role(array['owner','admin','manager']::public.user_role[]));
drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update to authenticated using (user_id=auth.uid() or public.has_role(array['owner','admin','manager']::public.user_role[])) with check (user_id=auth.uid() or public.has_role(array['owner','admin','manager']::public.user_role[]));

drop policy if exists daily_sales_select on public.daily_sales_summaries;
create policy daily_sales_select on public.daily_sales_summaries for select to authenticated using (public.has_role(array['owner','admin','manager']::public.user_role[]));

grant select on public.suppliers,public.inventory_items,public.inventory_movements,public.recipes,public.purchase_orders,public.purchase_order_items,public.kitchen_tickets,public.notifications,public.daily_sales_summaries to authenticated;
grant execute on function public.generate_daily_sales_summary(date) to authenticated;
grant execute on function public.create_kitchen_ticket_for_order(uuid) to authenticated;
grant execute on function public.receive_inventory(uuid,numeric,numeric,text,uuid,text) to authenticated;
grant execute on function public.consume_inventory_for_order(uuid) to authenticated;
 
