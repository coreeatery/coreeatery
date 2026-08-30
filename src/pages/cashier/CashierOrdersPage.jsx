import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getOrders,
  updateOrderStatus,
} from '../../features/orders/orders'
import { ORDER_STATUS_OPTIONS } from '../../features/orders/orderStatus'

const money = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const statusClass = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function CashierOrdersPage() {
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getOrders({
        status,
        search,
      })

      setOrders(data)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Gagal mengambil data order.')
    } finally {
      setLoading(false)
    }
  }, [status, search])

  useEffect(() => {
    let cancelled = false

    async function fetchOrders() {
      try {
        setLoading(true)
        setError('')

        const data = await getOrders({
          status,
          search,
        })

        if (!cancelled) {
          setOrders(data)
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setError(err.message || 'Gagal mengambil data order.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchOrders()

    return () => {
      cancelled = true
    }
  }, [status, search])

  async function handleStatusChange(id, nextStatus) {
    try {
      await updateOrderStatus(id, nextStatus)
      await loadOrders()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Gagal mengubah status order.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Order Aktif</h1>
          <p className="mt-1 opacity-60">
            Kelola pesanan restoran dari kasir.
          </p>
        </div>

        <Link
          to="/cashier/orders/new"
          className="rounded-xl bg-black px-5 py-3 text-center text-sm font-semibold text-white hover:opacity-80"
        >
          + Order Baru
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nomor order atau nama pelanggan..."
          className="rounded-xl border px-4 py-3 outline-none focus:ring-2"
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border px-4 py-3 outline-none"
        >
          <option value="">Semua Status</option>

          {ORDER_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border">
        {loading ? (
          <div className="p-8 text-center opacity-60">
            Memuat order...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-lg font-semibold">
              Belum ada order
            </p>
            <p className="mt-1 text-sm opacity-60">
              Order yang dibuat kasir akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-5 transition hover:bg-gray-50"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/cashier/orders/${order.id}`}
                        className="font-bold hover:underline"
                      >
                        #{order.order_number}
                      </Link>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusClass[order.status] ||
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-2 text-sm opacity-70">
                      {order.customer_name || 'Pelanggan umum'}
                    </div>

                    <div className="mt-1 text-sm opacity-60">
                      {order.restaurant_tables
                        ? `Meja ${order.restaurant_tables.table_number}`
                        : 'Tanpa meja'}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                    <div className="text-lg font-bold">
                      {money(order.total_amount)}
                    </div>

                    <select
                      value={order.status}
                      onChange={(event) =>
                        handleStatusChange(
                          order.id,
                          event.target.value,
                        )
                      }
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      {ORDER_STATUS_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <Link
                      to={`/cashier/orders/${order.id}`}
                      className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-100"
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
