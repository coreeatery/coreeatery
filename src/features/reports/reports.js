import { supabase } from '../../lib/supabase/client'

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi.')
  }
}

export async function getSalesReport({
  startDate = '',
  endDate = '',
} = {}) {
  ensureSupabase()

  if (!startDate || !endDate) {
    throw new Error('Tanggal laporan wajib diisi.')
  }

  if (startDate > endDate) {
    throw new Error('Tanggal mulai tidak boleh lebih besar dari tanggal akhir.')
  }

  const start = `${startDate}T00:00:00`
  const end = `${endDate}T23:59:59.999`

  const [
    { data: orders, error: ordersError },
    { data: payments, error: paymentsError },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        payment_status,
        subtotal,
        discount_amount,
        tax_amount,
        service_charge,
        total_amount,
        created_at
      `)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false }),

    supabase
      .from('payments')
      .select(`
        id,
        payment_code,
        order_id,
        amount,
        method,
        status,
        paid_at,
        created_at
      `)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false }),
  ])

  if (ordersError) {
    throw ordersError
  }

  if (paymentsError) {
    throw paymentsError
  }

  const allOrders = orders ?? []
  const allPayments = payments ?? []

  const completedOrders = allOrders.filter(
    (order) =>
      order.status === 'completed' &&
      order.payment_status === 'paid',
  )

  const cancelledOrders = allOrders.filter(
    (order) => order.status === 'cancelled',
  )

  const paidPayments = allPayments.filter(
    (payment) => payment.status === 'paid',
  )

  const subtotal = completedOrders.reduce(
    (total, order) =>
      total + (Number(order.subtotal) || 0),
    0,
  )

  const discount = completedOrders.reduce(
    (total, order) =>
      total + (Number(order.discount_amount) || 0),
    0,
  )

  const tax = completedOrders.reduce(
    (total, order) =>
      total + (Number(order.tax_amount) || 0),
    0,
  )

  const serviceCharge = completedOrders.reduce(
    (total, order) =>
      total + (Number(order.service_charge) || 0),
    0,
  )

  const totalSales = completedOrders.reduce(
    (total, order) =>
      total + (Number(order.total_amount) || 0),
    0,
  )

  const totalPaid = paidPayments.reduce(
    (total, payment) =>
      total + (Number(payment.amount) || 0),
    0,
  )

  const paymentMethods = paidPayments.reduce(
    (result, payment) => {
      const method = payment.method || 'unknown'

      if (!result[method]) {
        result[method] = {
          method,
          transactions: 0,
          amount: 0,
        }
      }

      result[method].transactions += 1
      result[method].amount +=
        Number(payment.amount) || 0

      return result
    },
    {},
  )

  const averageTransaction =
    completedOrders.length > 0
      ? totalSales / completedOrders.length
      : 0

  return {
    startDate,
    endDate,
    orders: allOrders,
    payments: allPayments,
    completedOrders,
    cancelledOrders,
    paidPayments,
    summary: {
      orderCount: completedOrders.length,
      transactionCount: paidPayments.length,
      subtotal,
      discount,
      tax,
      serviceCharge,
      totalSales,
      totalPaid,
      averageTransaction,
    },
    paymentMethods: Object.values(paymentMethods).sort(
      (a, b) => b.amount - a.amount,
    ),
  }
}
