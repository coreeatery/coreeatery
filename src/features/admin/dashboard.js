import { supabase } from '../../lib/supabase/client'

function getTodayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export async function getAdminDashboardData() {
  if (!supabase) {
    return {
      stats: {
        revenue: 0,
        orders: 0,
        todayOrders: 0,
        todayReservations: 0,
        activeMenu: 0,
        todayPayments: 0,
      },
      recentOrders: [],
      recentReservations: [],
    }
  }

  const { start, end } = getTodayRange()

  const [
    ordersResult,
    todayOrdersResult,
    reservationsResult,
    activeMenuResult,
    paymentsResult,
    recentOrdersResult,
    recentReservationsResult,
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('total_amount')
      .eq('payment_status', 'paid'),

    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', start)
      .lt('created_at', end),

    supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('reservation_date', start.slice(0, 10)),

    supabase
      .from('menu_items')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .eq('is_available', true),

    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid')
      .gte('paid_at', start)
      .lt('paid_at', end),

    supabase
      .from('orders')
      .select(`
        id,
        order_number,
        customer_name,
        status,
        payment_status,
        total_amount,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(8),

    supabase
      .from('reservations')
      .select(`
        id,
        reservation_code,
        customer_name,
        reservation_date,
        reservation_time,
        guest_count,
        status
      `)
      .order('reservation_date', { ascending: false })
      .order('reservation_time', { ascending: false })
      .limit(8),
  ])

  const errors = [
    ordersResult.error,
    todayOrdersResult.error,
    reservationsResult.error,
    activeMenuResult.error,
    paymentsResult.error,
    recentOrdersResult.error,
    recentReservationsResult.error,
  ].filter(Boolean)

  if (errors.length) {
    throw errors[0]
  }

  const revenue = (ordersResult.data ?? []).reduce(
    (total, order) => total + Number(order.total_amount || 0),
    0,
  )

  const todayPayments = (paymentsResult.data ?? []).reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0,
  )

  return {
    stats: {
      revenue,
      orders: ordersResult.data?.length ?? 0,
      todayOrders: todayOrdersResult.count ?? 0,
      todayReservations: reservationsResult.count ?? 0,
      activeMenu: activeMenuResult.count ?? 0,
      todayPayments,
    },
    recentOrders: recentOrdersResult.data ?? [],
    recentReservations: recentReservationsResult.data ?? [],
  }
}

export async function adminDashboardLoader() {
  try {
    return await getAdminDashboardData()
  } catch (error) {
    throw new Response(
      error.message || 'Gagal memuat dashboard.',
      {
        status: 500,
        statusText: 'Dashboard Error',
      },
    )
  }
}
