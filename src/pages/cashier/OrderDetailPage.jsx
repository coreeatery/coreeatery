import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getOrderById,
  updateOrderStatus,
  calculateOrderTotals,
  saveOrderTotals,
} from '../../features/orders/orders'
import { ORDER_STATUS_OPTIONS } from '../../features/orders/orderStatus'

const money = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const dateTime = (value) => {
  if (!value) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

const statusClass = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function OrderDetailPage() {
  const { id } = useParams()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchOrder() {
      try {
        setLoading(true)
        setError('')

        const data = await getOrderById(id)

        if (!cancelled) {
          setOrder(data)
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setError(
            err.message || 'Gagal mengambil detail order.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchOrder()

    return () => {
      cancelled = true
    }
  }, [id])

  async function handleStatusChange(nextStatus) {
    if (!order || nextStatus === order.status) return

    try {
      setSaving(true)
      setError('')

      const updated = await updateOrderStatus(
        order.id,
        nextStatus,
      )

      setOrder((current) => ({
        ...current,
        ...updated,
        order_items: current.order_items,
      }))
    } catch (err) {
      console.error(err)
      setError(
        err.message || 'Gagal mengubah status order.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleRecalculate() {
    if (!order) return

    try {
      setSaving(true)
      setError('')

      const totals = calculateOrderTotals(
        order.order_items || [],
        {
          discountAmount: order.discount_amount,
          taxAmount: order.tax_amount,
          serviceCharge: order.service_charge,
        },
      )

      const updated = await saveOrderTotals(
        order.id,
        totals,
      )

      setOrder((current) => ({
        ...current,
        ...updated,
        order_items: current.order_items,
      }))
    } catch (err) {
      console.error(err)
      setError(
        err.message || 'Gagal menghitung ulang total.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center opacity-60">
        Memuat detail order...
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link
          to="/cashier/orders"
          className="text-sm font-semibold hover:underline"
        >
          ← Kembali ke Order
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error || 'Order tidak ditemukan.'}
        </div>
      </div>
    )
  }

  const items = order.order_items || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <Link
            to="/cashier/orders"
            className="text-sm font-semibold opacity-60 hover:opacity-100"
          >
            ← Kembali ke Order
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">
              #{order.order_number}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                statusClass[order.status] ||
                'bg-gray-100 text-gray-700'
              }`}
            >
              {order.status}
            </span>
          </div>

          <p className="mt-1 text-sm opacity-60">
            Dibuat {dateTime(order.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={order.status}
            disabled={saving}
            onChange={(event) =>
              handleStatusChange(event.target.value)
            }
            className="rounded-xl border px-4 py-3 text-sm font-semibold"
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

          <button
            type="button"
            disabled={saving}
            onClick={handleRecalculate}
            className="rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Hitung Ulang'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-2xl border">
          <div className="border-b p-5">
            <h2 className="text-lg font-bold">
              Item Pesanan
            </h2>
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center text-sm opacity-60">
              Belum ada item pada order ini.
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-5"
                >
                  <div className="flex-1">
                    <p className="font-semibold">
                      {item.item_name}
                    </p>

                    {item.notes && (
                      <p className="mt-1 text-sm opacity-60">
                        Catatan: {item.notes}
                      </p>
                    )}

                    <p className="mt-2 text-sm opacity-60">
                      {item.quantity} ×{' '}
                      {money(item.unit_price)}
                    </p>
                  </div>

                  <div className="text-right font-semibold">
                    {money(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border p-5">
            <h2 className="text-lg font-bold">
              Informasi Order
            </h2>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="opacity-50">Pelanggan</p>
                <p className="mt-1 font-semibold">
                  {order.customer_name ||
                    'Pelanggan umum'}
                </p>
              </div>

              <div>
                <p className="opacity-50">Meja</p>
                <p className="mt-1 font-semibold">
                  {order.restaurant_tables
                    ? `Meja ${order.restaurant_tables.table_number}`
                    : 'Tanpa meja'}
                </p>
              </div>

              <div>
                <p className="opacity-50">
                  Pembayaran
                </p>
                <p className="mt-1 font-semibold capitalize">
                  {order.payment_status || 'unpaid'}
                </p>
              </div>

              {order.notes && (
                <div>
                  <p className="opacity-50">Catatan</p>
                  <p className="mt-1">{order.notes}</p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border p-5">
            <h2 className="text-lg font-bold">
              Ringkasan Pembayaran
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="opacity-60">
                  Subtotal
                </span>
                <span>{money(order.subtotal)}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="opacity-60">
                  Diskon
                </span>
                <span>
                  - {money(order.discount_amount)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="opacity-60">
                  Pajak
                </span>
                <span>{money(order.tax_amount)}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="opacity-60">
                  Service Charge
                </span>
                <span>
                  {money(order.service_charge)}
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between gap-4 text-lg font-bold">
                  <span>Total</span>
                  <span>
                    {money(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <Link
            to={`/cashier/payments?order=${order.id}`}
            className="block rounded-xl bg-black px-5 py-4 text-center font-semibold text-white hover:opacity-80"
          >
            Proses Pembayaran
          </Link>
        </div>
      </div>
    </div>
  )
}
