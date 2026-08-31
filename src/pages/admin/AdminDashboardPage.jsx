import { useCallback, useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { getAdminDashboardData } from '../../features/admin/dashboard'
import { useAuth } from '../../app/providers/useAuth'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function StatCard({ label, value, description, icon }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 sm:text-sm">
            {label}
          </p>

          <p className="mt-2 break-words text-lg font-bold tracking-tight text-gray-950 sm:text-2xl">
            {value}
          </p>

          <p className="mt-1 text-[10px] leading-4 text-gray-400 sm:text-xs">
            {description}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 sm:h-10 sm:w-10">
          {icon}
        </div>
      </div>
    </div>
  )
}

function Icon({ children }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      {children}
    </svg>
  )
}

export default function AdminDashboardPage() {
  const { profile } = useAuth()

  const initialData = useLoaderData()
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await getAdminDashboardData()
      setData(result)
    } catch (err) {
      setError(err.message || 'Gagal memuat dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  const stats = data?.stats ?? {}

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* HEADER */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              COREÉATERY ADMIN
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              Dashboard
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
              Selamat datang, {profile?.full_name || 'Admin'}.
              Berikut kondisi operasional COREÉATERY.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
          >
            <Icon>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 20v-5h-5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.5 15a7 7 0 0011.8 1.5L20 13"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.5 9a7 7 0 00-11.8-1.5L4 11"
              />
            </Icon>

            {loading ? 'Memuat...' : 'Refresh'}
          </button>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* STATISTICS */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <StatCard
          label="Total Omzet"
          value={formatRupiah(stats.revenue)}
          description="Order berstatus paid"
          icon={
            <Icon>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v18M17 7H9.5a3.5 3.5 0 000 7H14a3.5 3.5 0 010 7H6"
              />
            </Icon>
          }
        />

        <StatCard
          label="Total Order"
          value={stats.orders || 0}
          description="Seluruh order dibayar"
          icon={
            <Icon>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 4h12v16H6z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 8h6M9 12h6M9 16h4"
              />
            </Icon>
          }
        />

        <StatCard
          label="Order Hari Ini"
          value={stats.todayOrders || 0}
          description="Order dibuat hari ini"
          icon={
            <Icon>
              <circle cx="12" cy="12" r="9" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 7v5l3 2"
              />
            </Icon>
          }
        />

        <StatCard
          label="Reservasi Hari Ini"
          value={stats.todayReservations || 0}
          description="Reservasi hari ini"
          icon={
            <Icon>
              <rect x="4" y="5" width="16" height="15" rx="2" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 3v4M16 3v4M4 10h16"
              />
            </Icon>
          }
        />

        <StatCard
          label="Menu Aktif"
          value={stats.activeMenu || 0}
          description="Menu tersedia"
          icon={
            <Icon>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 4h14v16H5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 8h8M8 12h8M8 16h5"
              />
            </Icon>
          }
        />

        <StatCard
          label="Pembayaran Hari Ini"
          value={formatRupiah(stats.todayPayments)}
          description="Pembayaran tercatat hari ini"
          icon={
            <Icon>
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 10h18"
              />
            </Icon>
          }
        />
      </section>

      {/* RECENT DATA */}
      <section className="grid gap-5 xl:grid-cols-2">

        {/* ORDERS */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-bold text-gray-950 sm:text-lg">
              Order Terbaru
            </h2>

            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Aktivitas transaksi terbaru
            </p>
          </div>

          {data?.recentOrders?.length ? (
            <div className="divide-y divide-gray-100">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-950">
                      #{order.order_number}
                    </p>

                    <p className="truncate text-xs text-gray-500 sm:text-sm">
                      {order.customer_name || 'Pelanggan umum'}
                    </p>

                    <p className="mt-1 text-[10px] text-gray-400 sm:text-xs">
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-gray-950 sm:text-base">
                      {formatRupiah(order.total_amount)}
                    </p>

                    <span className="text-[10px] capitalize text-gray-500 sm:text-xs">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-gray-500">
              Belum ada order.
            </p>
          )}
        </div>

        {/* RESERVATIONS */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-bold text-gray-950 sm:text-lg">
              Reservasi Terbaru
            </h2>

            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Daftar reservasi terbaru
            </p>
          </div>

          {data?.recentReservations?.length ? (
            <div className="divide-y divide-gray-100">
              {data.recentReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-950">
                      {reservation.customer_name}
                    </p>

                    <p className="text-xs text-gray-500 sm:text-sm">
                      {reservation.reservation_date} ·{' '}
                      {reservation.reservation_time}
                    </p>

                    <p className="mt-1 text-[10px] text-gray-400 sm:text-xs">
                      {reservation.guest_count} orang ·{' '}
                      {reservation.reservation_code}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium capitalize text-gray-700 sm:px-3 sm:text-xs">
                    {reservation.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-gray-500">
              Belum ada reservasi.
            </p>
          )}
        </div>

      </section>
    </div>
  )
}
