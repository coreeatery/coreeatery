import { useCallback, useMemo, useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { getAdminDashboardData } from '../../features/admin/dashboard'
import { useAuth } from '../../app/providers/useAuth'
import { formatCurrency } from '../../lib/currency/format'
import LoadingScreen from '../../components/shared/LoadingScreen'

function formatDateTime(value) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function Icon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function StatCard({ label, value, description, icon }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-gray-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
          {icon}
        </div>
      </div>
    </div>
  )
}

function Section({ title, description, children, action }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="font-bold text-gray-950">{title}</h2>

          {description && (
            <p className="mt-1 text-xs text-gray-500">
              {description}
            </p>
          )}
        </div>

        {action}
      </div>

      {children}
    </section>
  )
}

function StatusBadge({ status }) {
  const styles = {
    completed: 'bg-green-100 text-green-700',
    paid: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    draft: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
    preparing: 'bg-blue-100 text-blue-700',
    ready: 'bg-green-100 text-green-700',
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${
        styles[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {status || '-'}
    </span>
  )
}

export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()

  const initialData = useLoaderData()
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      setData(await getAdminDashboardData())
    } catch (err) {
      setError(err.message || 'Gagal memuat dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  const stats = data?.stats || {}
  const alerts = data?.alerts || {}
  const salesTrend = useMemo(
    () => data?.salesTrend || [],
    [data?.salesTrend],
  )
  const topMenu = data?.topMenu || []

  const maxSales = useMemo(
    () =>
      Math.max(
        ...salesTrend.map((item) => Number(item.amount || 0)),
        1,
      ),
    [salesTrend],
  )

  const totalAlertCount =
    Number(alerts.lowStock || 0) +
    Number(alerts.kitchen || 0) +
    Number(alerts.purchasing || 0)

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* HEADER */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              COREÉATERY BUSINESS OS
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              Business Overview
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {profile?.full_name
                ? `Selamat datang, ${profile.full_name}.`
                : t('admin.operationalStatus')}
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <Icon>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 11a8.1 8.1 0 00-14.9-4M4 5v4h4M4 13a8.1 8.1 0 0014.9 4M20 19v-4h-4"
              />
            </Icon>

            {loading ? 'Memuat...' : 'Refresh'}
          </button>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Dashboard gagal dimuat</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {loading && !data ? (
        <LoadingScreen label="Memuat Business Overview..." />
      ) : (
        <>
          {/* CORE METRICS */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Omzet Hari Ini"
              value={formatCurrency(stats.revenue)}
              description="Payment berhasil diterima"
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
              label="Transaksi"
              value={stats.transactions || 0}
              description="Payment paid hari ini"
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
              label="Pesanan Aktif"
              value={stats.activeOrders || 0}
              description="Belum selesai / dibatalkan"
              icon={
                <Icon>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 5h14v14H5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 9h8M8 13h5"
                  />
                </Icon>
              }
            />

            <StatCard
              label="Reservasi Hari Ini"
              value={stats.todayReservations || 0}
              description="Reservasi aktif"
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
          </section>

          {/* SALES + ALERTS */}
          <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">

            <Section
              title="Penjualan 7 Hari"
              description="Total payment yang berhasil diterima"
            >
              <div className="p-5">
                {salesTrend.length ? (
                  <div className="space-y-3">
                    {salesTrend.map((item) => {
                      const amount = Number(item.amount || 0)
                      const width = Math.max(
                        2,
                        (amount / maxSales) * 100,
                      )

                      return (
                        <div key={item.date}>
                          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                            <span className="font-medium text-gray-600">
                              {item.label}
                            </span>

                            <span className="font-semibold text-gray-950">
                              {formatCurrency(amount)}
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-gray-900 transition-all"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-gray-500">
                    Belum ada data penjualan.
                  </p>
                )}
              </div>
            </Section>

            <Section
              title="Perlu Perhatian"
              description={
                totalAlertCount
                  ? `${totalAlertCount} item memerlukan perhatian`
                  : 'Tidak ada alert operasional'
              }
            >
              <div className="divide-y divide-gray-100">
                <AlertRow
                  label="Stok Menipis"
                  value={alerts.lowStock}
                  danger={alerts.lowStock > 0}
                />

                <AlertRow
                  label="Antrian Dapur"
                  value={alerts.kitchen}
                  danger={alerts.kitchen > 0}
                />

                <AlertRow
                  label="Pembelian Aktif"
                  value={alerts.purchasing}
                  danger={false}
                />
              </div>
            </Section>
          </section>

          {/* TOP MENU + RECENT PAYMENT */}
          <section className="grid gap-5 xl:grid-cols-2">

            <Section
              title="Menu Terlaris"
              description="Berdasarkan quantity pada order yang sudah dibayar"
            >
              <div className="p-5">
                {topMenu.length ? (
                  <div className="space-y-3">
                    {topMenu.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-700">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-950">
                            {item.name}
                          </p>

                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-gray-900"
                              style={{
                                width: `${Math.max(
                                  8,
                                  (item.quantity /
                                    topMenu[0].quantity) *
                                    100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <span className="shrink-0 text-sm font-bold text-gray-700">
                          {item.quantity}x
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-gray-500">
                    Belum ada data menu terjual.
                  </p>
                )}
              </div>
            </Section>

            <Section
              title="Pembayaran Terbaru"
              description="Penerimaan uang terbaru"
            >
              {data?.recentPayments?.length ? (
                <div className="divide-y divide-gray-100">
                  {data.recentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-3 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-950">
                          {payment.orders?.order_number
                            ? `#${payment.orders.order_number}`
                            : payment.payment_code}
                        </p>

                        <p className="truncate text-xs text-gray-500">
                          {payment.orders?.customer_name ||
                            'Pelanggan umum'}
                          {' · '}
                          {payment.method}
                        </p>

                        <p className="mt-1 text-[10px] text-gray-400">
                          {formatDateTime(payment.paid_at)}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-bold text-gray-950">
                          {formatCurrency(payment.amount)}
                        </p>

                        <StatusBadge status="paid" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-10 text-center text-sm text-gray-500">
                  Belum ada pembayaran.
                </p>
              )}
            </Section>
          </section>

          {/* RECENT ORDERS */}
          <Section
            title="Pesanan Terbaru"
            description="Aktivitas order terakhir"
          >
            {data?.recentOrders?.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                      <th className="px-5 py-3 font-medium">
                        Order
                      </th>
                      <th className="px-5 py-3 font-medium">
                        Pelanggan
                      </th>
                      <th className="px-5 py-3 font-medium">
                        Status
                      </th>
                      <th className="px-5 py-3 text-right font-medium">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="px-5 py-4 font-semibold text-gray-950">
                          #{order.order_number}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {order.customer_name ||
                            'Pelanggan umum'}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={order.status} />
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-gray-950">
                          {formatCurrency(order.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-gray-500">
                Belum ada order.
              </p>
            )}
          </Section>

          {/* QUICK ACTIONS */}
          <Section
            title="Quick Actions"
            description="Akses cepat operasional"
          >
            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
              <QuickAction href="/cashier/orders/new" label="Pesanan Baru" />
              <QuickAction href="/admin/operations" label="Operasional" />
              <QuickAction href="/admin/menu" label="Kelola Menu" />
              <QuickAction href="/admin/reservasi" label="Reservasi" />
            </div>
          </Section>
        </>
      )}
    </div>
  )
}

function AlertRow({ label, value = 0, danger }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4">
      <div className="flex items-center gap-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            danger ? 'bg-red-500' : 'bg-gray-300'
          }`}
        />

        <span className="text-sm font-medium text-gray-700">
          {label}
        </span>
      </div>

      <span
        className={`text-sm font-bold ${
          danger ? 'text-red-600' : 'text-gray-950'
        }`}
      >
        {value || 0}
      </span>
    </div>
  )
}

function QuickAction({ href, label }) {
  return (
    <a
      href={href}
      className="rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
    >
      {label}
    </a>
  )
}
