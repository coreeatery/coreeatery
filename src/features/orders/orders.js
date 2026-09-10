import { supabase } from '../../lib/supabase/client'

const ORDER_SELECT = `
  id,
  order_number,
  table_id,
  customer_name,
  status,
  payment_status,
  subtotal,
  discount_amount,
  tax_amount,
  service_charge,
  total_amount,
  notes,
  cashier_id,
  created_at,
  updated_at,
  restaurant_tables (
    id,
    table_number,
    capacity
  )
`

const ORDER_DETAIL_SELECT = `
  ${ORDER_SELECT},
  order_items (
    id,
    order_id,
    menu_item_id,
    variant_id,
    item_name,
    quantity,
    unit_price,
    discount_amount,
    subtotal,
    notes,
    created_at
  )
`

function ensureSupabase() {
  if (!supabase) {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }
}

export async function getOrders({
  status = '',
  paymentStatus = '',
  date = '',
  search = '',
} = {}) {
  ensureSupabase()

  let query = supabase
    .from('orders')
    .select(ORDER_SELECT)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (paymentStatus) {
    query = query.eq('payment_status', paymentStatus)
  }

  if (date) {
    query = query
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59.999`)
  }

  if (search.trim()) {
    const term = search.trim()

    query = query.or(
      `order_number.ilike.%${term}%,customer_name.ilike.%${term}%`,
    )
  }

  const { data, error } = await query

  if (error) throw error

  return data ?? []
}

export async function getOrderById(id) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_DETAIL_SELECT)
    .eq('id', id)
    .single()

  if (error) throw error

  return data
}

export async function createOrder(payload) {
  ensureSupabase()

  const { data, error } = await supabase.rpc(
    'create_order_transaction',
    {
      p_table_id: payload.table_id || null,
      p_customer_name: payload.customer_name || null,
      p_notes: payload.notes || null,
      p_discount_amount: Number(payload.discount_amount) || 0,
      p_tax_amount: Number(payload.tax_amount) || 0,
      p_service_charge: Number(payload.service_charge) || 0,
      p_items: payload.items || [],
      p_order_number: payload.order_number || null,
    },
  )

  if (error) throw error

  return data
}

export async function updateOrderStatus(id, status) {
  ensureSupabase()

  if (!id) {
    throw new Error('ORDER_REQUIRED')
  }

  if (!status) {
    throw new Error('ORDER_STATUS_REQUIRED')
  }

  const { data, error } = await supabase.rpc(
    'update_order_status',
    {
      p_order_id: id,
      p_status: status,
    },
  )

  if (error) throw error

  return data
}

export function calculateOrderTotals(items = [], {
  discountAmount = 0,
  taxAmount = 0,
  serviceCharge = 0,
} = {}) {
  const subtotal = items.reduce((total, item) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unit_price) || 0
    const itemDiscount = Number(item.discount_amount) || 0

    return total + Math.max(
      0,
      quantity * unitPrice - itemDiscount,
    )
  }, 0)

  const discount = Math.max(0, Number(discountAmount) || 0)
  const tax = Math.max(0, Number(taxAmount) || 0)
  const service = Math.max(0, Number(serviceCharge) || 0)

  const total = Math.max(
    0,
    subtotal - discount + tax + service,
  )

  return {
    subtotal,
    discountAmount: discount,
    taxAmount: tax,
    serviceCharge: service,
    totalAmount: total,
  }
}

export async function saveOrderTotals(id) {
  ensureSupabase()

  if (!id) {
    throw new Error('ORDER_REQUIRED')
  }

  const { data, error } = await supabase.rpc(
    'recalculate_order_totals',
    {
      p_order_id: id,
    },
  )

  if (error) throw error

  return data
}
