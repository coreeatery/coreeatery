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

function generatePaymentCode() {
  const now = new Date()
  const date = now
    .toISOString()
    .slice(0, 10)
    .replaceAll('-', '')

  const time = now
    .toTimeString()
    .slice(0, 8)
    .replaceAll(':', '')

  const random = Math.floor(1000 + Math.random() * 9000)

  return `PAY-${date}-${time}-${random}`
}

export async function getPayments({
  orderId = '',
  status = '',
  method = '',
  date = '',
} = {}) {
  ensureSupabase()

  let query = supabase
    .from('payments')
    .select(PAYMENT_SELECT)
    .order('created_at', { ascending: false })

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
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59.999`)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return data ?? []
}

export async function getPaymentById(id) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('payments')
    .select(PAYMENT_SELECT)
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function getPaymentsByOrderId(orderId) {
  return getPayments({ orderId })
}

export async function createPayment(payload) {
  ensureSupabase()

  const amount = Number(payload.amount) || 0

  if (amount <= 0) {
    throw new Error('Nominal pembayaran harus lebih dari 0.')
  }

  if (!payload.order_id) {
    throw new Error('Order wajib dipilih.')
  }

  if (!payload.method) {
    throw new Error('Metode pembayaran wajib dipilih.')
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      id,
      total_amount,
      payment_status,
      status
    `)
    .eq('id', payload.order_id)
    .single()

  if (orderError) {
    throw orderError
  }

  if (order.payment_status === 'paid') {
    throw new Error('Order ini sudah dibayar.')
  }

  const paymentPayload = {
    payment_code:
      payload.payment_code || generatePaymentCode(),
    order_id: payload.order_id,
    amount,
    method: payload.method,
    status: payload.status || 'paid',
    reference_number: payload.reference_number || null,
    paid_at: payload.paid_at || new Date().toISOString(),
    received_by: payload.received_by || null,
    notes: payload.notes || null,
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert(paymentPayload)
    .select(PAYMENT_SELECT)
    .single()

  if (paymentError) {
    throw paymentError
  }

  const { data: updatedOrder, error: orderUpdateError } =
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'completed',
      })
      .eq('id', order.id)
      .select(`
        id,
        order_number,
        payment_status,
        status,
        total_amount
      `)
      .single()

  if (orderUpdateError) {
    throw orderUpdateError
  }

  return {
    payment,
    order: updatedOrder,
  }
}

export async function updatePayment(id, payload) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('payments')
    .update(payload)
    .eq('id', id)
    .select(PAYMENT_SELECT)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function cancelPayment(id) {
  return updatePayment(id, {
    status: 'cancelled',
  })
}

export function calculatePaymentChange({
  totalAmount = 0,
  paidAmount = 0,
} = {}) {
  const total = Math.max(0, Number(totalAmount) || 0)
  const paid = Math.max(0, Number(paidAmount) || 0)

  return {
    totalAmount: total,
    paidAmount: paid,
    remainingAmount: Math.max(0, total - paid),
    changeAmount: Math.max(0, paid - total),
    isEnough: paid >= total,
  }
}
