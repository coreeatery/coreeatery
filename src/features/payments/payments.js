import { supabase } from '../../lib/supabase/client'

const PAYMENT_SELECT = `
  id,
  payment_code,
  order_id,
  amount,
  method,
  status,
  reference_number,
  paid_at,
  received_by,
  notes,
  created_at
`

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi.')
  }
}

export async function getPayments({
  orderId = '',
  status = '',
  method = '',
  date = '',
  search = '',
} = {}) {
  ensureSupabase()

  let query = supabase
    .from('payments')
    .select(PAYMENT_SELECT)
    .order('paid_at', { ascending: false })

  if (orderId) {
    query = query.eq('order_id', orderId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (method) {
    query = query.eq('method', method)
  }

  if (date) {
    query = query
      .gte('paid_at', `${date}T00:00:00`)
      .lt('paid_at', `${date}T23:59:59.999`)
  }

  if (search.trim()) {
    const term = search.trim()

    query = query.ilike(
      'payment_code',
      `%${term}%`,
    )
  }

  const { data, error } = await query

  if (error) throw error

  return data ?? []
}

export async function getPaymentById(id) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('payments')
    .select(PAYMENT_SELECT)
    .eq('id', id)
    .single()

  if (error) throw error

  return data
}

export async function getOrderPayments(orderId) {
  return getPayments({ orderId })
}

export async function createPayment(payload) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('payments')
    .insert(payload)
    .select(PAYMENT_SELECT)
    .single()

  if (error) throw error

  return data
}

export async function updatePayment(id, payload) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('payments')
    .update(payload)
    .eq('id', id)
    .select(PAYMENT_SELECT)
    .single()

  if (error) throw error

  return data
}

export async function cancelPayment(id) {
  return updatePayment(id, {
    status: 'cancelled',
  })
}

export function calculateChange(totalAmount, receivedAmount) {
  const total = Math.max(
    0,
    Number(totalAmount) || 0,
  )

  const received = Math.max(
    0,
    Number(receivedAmount) || 0,
  )

  return Math.max(0, received - total)
}

export function isPaymentEnough(
  totalAmount,
  receivedAmount,
) {
  const total = Math.max(
    0,
    Number(totalAmount) || 0,
  )

  const received = Math.max(
    0,
    Number(receivedAmount) || 0,
  )

  return received >= total
}

export async function markOrderPaid(
  orderId,
  paymentStatus = 'paid',
) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('orders')
    .update({
      payment_status: paymentStatus,
    })
    .eq('id', orderId)
    .select('*')
    .single()

  if (error) throw error

  return data
}

export async function createPaymentAndMarkOrderPaid({
  payment,
  orderId,
}) {
  if (!payment) {
    throw new Error('Data pembayaran tidak tersedia.')
  }

  if (!orderId) {
    throw new Error('Order ID wajib diisi.')
  }

  const createdPayment = await createPayment({
    ...payment,
    order_id: orderId,
  })

  await markOrderPaid(orderId, 'paid')

  return createdPayment
}
