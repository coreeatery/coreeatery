import { useCallback, useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { getAdminDashboardData } from '../../features/admin/dashboard'
import { useAuth } from '../../app/providers/useAuth'
import Button from '../../components/shared/Button'
import Card from '../../components/shared/Card'
import PageHeader from '../../components/shared/PageHeader'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function StatCard({ label, value, description }) {
  return (
    <Card>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </Card>
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
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Selamat datang, ${profile?.full_name || 'Admin'}. Berikut kondisi operasional COREÉATERY.`}
      >
        <Button
          type="button"
          variant="secondary"
          onClick={loadDashboard}
          disabled={loading}
        >
          {loading ? 'Memuat...' : 'Refresh'}
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Omzet"
          value={formatRupiah(stats.revenue)}
          description="Order dengan status pembayaran paid"
        />

        <StatCard
          label="Total Order"
          value={stats.orders}
          description="Seluruh order yang sudah dibayar"
        />

        <StatCard
          label="Order Hari Ini"
          value={stats.todayOrders}
          description="Order dibuat hari ini"
        />

        <StatCard
          label="Reservasi Hari Ini"
          value={stats.todayReservations}
          description="Reservasi berdasarkan tanggal hari ini"
        />

        <StatCard
          label="Menu Aktif"
          value={stats.activeMenu}
          description="Menu aktif dan tersedia"
        />

        <StatCard
          label="Pembayaran Hari Ini"
          value={formatRupiah(stats.todayPayments)}
          description="Pembayaran yang tercatat hari ini"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Order Terbaru</h2>
              <p className="text-sm text-gray-500">
                Aktivitas transaksi terbaru
              </p>
            </div>
          </div>

          {data?.recentOrders?.length ? (
            <div className="divide-y">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      #{order.order_number}
                    </p>

                    <p className="truncate text-sm text-gray-500">
                      {order.customer_name || 'Pelanggan umum'}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      {formatRupiah(order.total_amount)}
                    </p>

                    <p className="text-xs capitalize text-gray-500">
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">
              Belum ada order.
            </p>
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Reservasi Terbaru</h2>
            <p className="text-sm text-gray-500">
              Daftar reservasi terbaru
            </p>
          </div>

          {data?.recentReservations?.length ? (
            <div className="divide-y">
              {data.recentReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {reservation.customer_name}
                    </p>

                    <p className="text-sm text-gray-500">
                      {reservation.reservation_date} ·{' '}
                      {reservation.reservation_time}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {reservation.guest_count} orang ·{' '}
                      {reservation.reservation_code}
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize">
                    {reservation.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">
              Belum ada reservasi.
            </p>
          )}
        </Card>
      </section>
    </div>
  )
}
