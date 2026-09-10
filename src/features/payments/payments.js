import { supabase } from '../../lib/supabase/client'

const PAYMENT_SELECT = `
  id,
  payment_code,
  order_id,
  shift_id,
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

async function getCurrentUser() {
  ensureSupabase()

  const { data, error } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  if (!data?.user?.id) {
    throw new Error('User kasir belum login.')
  }

  return data.user
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
  shiftId = '',
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

  if (shiftId) {
    query = query.eq('shift_id', shiftId)
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

export async function getCurrentOpenShift() {
  const user = await getCurrentUser()

  const { data, error } = await supabase
    .from('cash_register_shifts')
    .select('*')
    .eq('opened_by', user.id)
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
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

  const { data, error } = await supabase.rpc(
    'process_payment_transaction',
    {
      p_order_id: payload.order_id,
      p_amount: amount,
      p_method: payload.method,
      p_reference_number: payload.reference_number || null,
      p_notes: payload.notes || null,
    },
  )

  if (error) {
    throw error
  }

  return {
    payment: data?.payment ?? null,
    order: data?.order ?? null,
    shift: data?.shift ?? null,
    movement: data?.movement ?? null,
    changeAmount: Number(data?.change_amount ?? 0),
  }
}


export function calculatePaymentChange({
  totalAmount = 0,
  paidAmount = 0,
} = {}) {
  const total = Math.max(
    0,
    Number(totalAmount) || 0,
  )

  const paid = Math.max(
    0,
    Number(paidAmount) || 0,
  )

  return {
    totalAmount: total,
    paidAmount: paid,
    remainingAmount: Math.max(0, total - paid),
    changeAmount: Math.max(0, paid - total),
    isEnough: paid >= total,
  }
}
