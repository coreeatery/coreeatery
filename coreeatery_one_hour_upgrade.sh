#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd /data/data/com.termux/files/home/coreeatery
mkdir -p supabase/migrations src/features/offline src/pages/admin public

cat > supabase/migrations/0015_business_system.sql <<'SQL'
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
 
SQL

cat > src/features/offline/offlineQueue.js <<'JS'
const DB_NAME='coreeatery-offline'
const STORE='queue'
const VERSION=1
function openDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,VERSION);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id',autoIncrement:true})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function enqueueOfflineAction(action){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).add({...action,queuedAt:new Date().toISOString(),status:'pending'});tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)})}
export async function getOfflineQueue(){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const r=tx.objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function clearOfflineItem(id){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error)})}
export function installOfflineSync(onSync){const h=()=>{if(navigator.onLine)onSync?.()};window.addEventListener('online',h);return()=>window.removeEventListener('online',h)}

JS

cat > src/pages/admin/OperationsHubPage.jsx <<'JS'
import {useEffect,useMemo,useState} from 'react'
import {supabase} from '../../lib/supabase/client'
import {formatIDR} from '../../lib/currency/format'
import {getOfflineQueue,installOfflineSync} from '../../features/offline/offlineQueue'
const tabs=['overview','inventory','purchasing','suppliers','kitchen','automation','offline']
export default function OperationsHubPage(){
 const[tab,setTab]=useState('overview'),[inventory,setInventory]=useState([]),[suppliers,setSuppliers]=useState([]),[kitchen,setKitchen]=useState([]),[summary,setSummary]=useState(null),[queue,setQueue]=useState([]),[loading,setLoading]=useState(true)
 async function load(){setLoading(true);const[i,s,k,q]=await Promise.all([supabase.from('inventory_items').select('*').eq('is_active',true).order('name'),supabase.from('suppliers').select('*').eq('is_active',true).order('name'),supabase.from('kitchen_tickets').select('*,orders(order_number,customer_name)').in('status',['queued','preparing','ready']).order('priority',{ascending:false}).order('queued_at'),getOfflineQueue()]);setInventory(i.data||[]);setSuppliers(s.data||[]);setKitchen(k.data||[]);setQueue(q||[]);const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'});const{data}=await supabase.from('daily_sales_summaries').select('*').eq('business_date',today).maybeSingle();setSummary(data);setLoading(false)}
 async function generateSummary(){await supabase.rpc('generate_daily_sales_summary');await load()}
 useEffect(()=>{load();return installOfflineSync(load)},[])
 const lowStock=useMemo(()=>inventory.filter(x=>Number(x.current_stock)<=Number(x.min_stock)),[inventory])
 if(loading)return <div className="p-6">Loading operations...</div>
 return <div className="space-y-5"><div><p className="text-xs uppercase tracking-[0.2em] text-gray-400">COREÉATERY Business OS</p><h1 className="mt-1 text-3xl font-bold">Operations Hub</h1><p className="mt-2 text-sm text-gray-500">POS, inventory, purchasing, kitchen, automation, mobile dan offline operation.</p></div>
 <div className="flex gap-2 overflow-x-auto pb-1">{tabs.map(x=><button key={x} onClick={()=>setTab(x)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm ${tab===x?'bg-gray-950 text-white':'bg-gray-100 text-gray-700'}`}>{x[0].toUpperCase()+x.slice(1)}</button>)}</div>
 {tab==='overview'&&<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric t="Low Stock" v={lowStock.length} d/><Metric t="Suppliers" v={suppliers.length}/><Metric t="Kitchen Queue" v={kitchen.length}/><Metric t="Offline Queue" v={queue.length}/><div className="sm:col-span-2 xl:col-span-4 rounded-2xl border border-gray-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium">Daily Sales</p><p className="mt-1 text-2xl font-bold">{formatIDR(summary?.total_sales||0)}</p></div><button onClick={generateSummary} className="rounded-xl bg-gray-950 px-4 py-2 text-sm text-white">Generate Closing Summary</button></div></div></div>}
 {tab==='inventory'&&<section className="rounded-2xl border border-gray-200 bg-white overflow-hidden"><div className="p-5"><h2 className="font-semibold">Inventory</h2><p className="text-sm text-gray-500">Stock, minimum level, cost dan low-stock detection.</p></div><div className="overflow-auto"><table className="min-w-full text-sm"><thead><tr className="border-y bg-gray-50 text-left"><th className="p-3">Item</th><th className="p-3">SKU</th><th className="p-3">Stock</th><th className="p-3">Min</th><th className="p-3">Status</th></tr></thead><tbody>{inventory.map(x=><tr key={x.id} className="border-b"><td className="p-3 font-medium">{x.name}</td><td className="p-3">{x.sku||'-'}</td><td className="p-3">{x.current_stock} {x.unit}</td><td className="p-3">{x.min_stock}</td><td className={`p-3 ${Number(x.current_stock)<=Number(x.min_stock)?'text-red-600 font-semibold':'text-green-600'}`}>{Number(x.current_stock)<=Number(x.min_stock)?'LOW':'OK'}</td></tr>)}</tbody></table></div></section>}
 {tab==='suppliers'&&<Panel title="Suppliers"><div className="space-y-2">{suppliers.map(x=><div key={x.id} className="rounded-xl bg-gray-50 p-3"><b>{x.name}</b><div className="text-xs text-gray-500">{x.contact_name||''} {x.phone||''} {x.email||''}</div></div>)}</div></Panel>}
 {tab==='purchasing'&&<Panel title="Purchasing"><p className="text-sm text-gray-500">Purchase-order schema is active. The next UI can operate directly on purchase_orders and purchase_order_items.</p></Panel>}
 {tab==='kitchen'&&<div className="grid gap-3 md:grid-cols-3">{['queued','preparing','ready'].map(st=><div key={st} className="rounded-2xl border border-gray-200 bg-white p-4"><h2 className="font-semibold capitalize">{st}</h2><div className="mt-3 space-y-2">{kitchen.filter(x=>x.status===st).map(x=><div key={x.id} className="rounded-xl bg-gray-50 p-3"><div className="font-medium">{x.orders?.order_number||x.order_id}</div><div className="text-xs text-gray-500">{x.orders?.customer_name||'Dine in'}</div></div>)}</div></div>)}</div>}
 {tab==='automation'&&<div className="grid gap-3 md:grid-cols-2"><Panel title="Shift auto-expiry"><p className="text-sm text-green-700">Active through scheduled cash-register shift logic.</p></Panel><Panel title="Low-stock alert"><p className="text-sm text-green-700">{lowStock.length} item(s) require attention.</p></Panel><Panel title="Daily sales summary"><p className="text-sm text-gray-500">Generated from paid payments.</p></Panel><Panel title="Notifications"><p className="text-sm text-gray-500">Notification storage is active.</p></Panel></div>}
 {tab==='offline'&&<Panel title={navigator.onLine?'Online':'Offline'}><p className="text-sm text-gray-500">IndexedDB queue is active. Offline orders/payments must remain pending until server acknowledgement. No offline payment is falsely marked paid.</p><div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm">Pending actions: <b>{queue.length}</b></div></Panel>}
 </div>
}
function Metric({t,v,d}){return <div className="rounded-2xl border border-gray-200 bg-white p-5"><p className="text-xs uppercase tracking-widest text-gray-400">{t}</p><p className={`mt-2 text-3xl font-bold ${d&&Number(v)>0?'text-red-600':''}`}>{v}</p></div>}
function Panel({title,children}){return <div className="rounded-2xl border border-gray-200 bg-white p-5"><h2 className="font-semibold">{title}</h2><div className="mt-3">{children}</div></div>}

JS

cat > public/manifest.webmanifest <<'JSON'
{
  "name": "COREÉATERY",
  "short_name": "COREÉATERY",
  "start_url": "/cashier",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#111827",
  "description": "Restaurant POS and Business Operating System"
}
JSON

cat > public/sw.js <<'JS'
const CACHE='coreeatery-shell-v1'
const APP_SHELL=['/','/login','/cashier','/admin','/manifest.webmanifest']
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_SHELL).catch(()=>null)));self.skipWaiting()})
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())})
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return
 event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(r=>r||caches.match('/'))))
})
JS

python3 - <<'PY'
from pathlib import Path

p=Path('src/app/router/index.jsx')
s=p.read_text()
if 'OperationsHubPage' not in s:
    s=s.replace("import AdminSettingsPage from '../../pages/admin/AdminSettingsPage'\n",
                "import AdminSettingsPage from '../../pages/admin/AdminSettingsPage'\nimport OperationsHubPage from '../../pages/admin/OperationsHubPage'\n")
    s=s.replace("{ path: 'settings', element: <AdminSettingsPage /> },",
                "{ path: 'settings', element: <AdminSettingsPage /> },\n          { path: 'operations', element: <OperationsHubPage /> },")
    p.write_text(s)

p=Path('src/components/admin/AdminSidebar.jsx')
s=p.read_text()
if "['Operations Hub', '/admin/operations']" not in s:
    s=s.replace("[t('admin.settings'), '/admin/settings'],",
                "[t('admin.settings'), '/admin/settings'],\n    ['Operations Hub', '/admin/operations'],")
    p.write_text(s)

p=Path('index.html')
s=p.read_text()
if 'manifest.webmanifest' not in s:
    s=s.replace('<title>coreeatery</title>',
                '<link rel="manifest" href="/manifest.webmanifest" />\n      <meta name="theme-color" content="#111827" />\n      <title>COREÉATERY</title>')
    p.write_text(s)

p=Path('src/main.jsx')
s=p.read_text()
if "register('/sw.js')" not in s:
    s += "\nif ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})\n"
    p.write_text(s)
PY

printf '\n===== APPLY DATABASE MIGRATION =====\n'
supabase db push

printf '\n===== IMPLEMENTATION PHASE COMPLETE =====\n'
printf 'Build/lint/test intentionally NOT executed yet.\n'
git status --short
