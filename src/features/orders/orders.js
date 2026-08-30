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
    throw new Error('Supabase belum dikonfigurasi.')
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

  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select(ORDER_SELECT)
    .single()

  if (error) throw error

  return data
}

export async function updateOrder(id, payload) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('orders')
    .update(payload)
    .eq('id', id)
    .select(ORDER_SELECT)
    .single()

  if (error) throw error

  return data
}

export async function updateOrderStatus(id, status) {
  return updateOrder(id, { status })
}

export async function addOrderItem(payload) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('order_items')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error

  return data
}

export async function updateOrderItem(id, payload) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('order_items')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error

  return data
}

export async function deleteOrderItem(id) {
  ensureSupabase()

  const { error } = await supabase
    .from('order_items')
    .delete()
    .eq('id', id)

  if (error) throw error
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

export async function saveOrderTotals(id, totals) {
  return updateOrder(id, {
    subtotal: totals.subtotal,
    discount_amount: totals.discountAmount,
    tax_amount: totals.taxAmount,
    service_charge: totals.serviceCharge,
    total_amount: totals.totalAmount,
  })
}
