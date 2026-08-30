import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getOrderById } from '../../features/orders/orders'

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

const PAYMENT_METHODS = [
  {
    value: 'cash',
    label: 'Tunai',
  },
  {
    value: 'qris',
    label: 'QRIS',
  },
  {
    value: 'debit',
    label: 'Debit',
  },
  {
    value: 'credit_card',
    label: 'Kartu Kredit',
  },
  {
    value: 'transfer',
    label: 'Transfer Bank',
  },
]

export default function CashierPaymentsPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order')

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(Boolean(orderId))
  const [error, setError] = useState('')

  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paidAmount, setPaidAmount] = useState('')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false

    if (!orderId) {
      return undefined
    }

    async function fetchOrder() {
      try {
        const data = await getOrderById(orderId)

        if (!cancelled) {
          setOrder(data)
          setError('')
          setLoading(false)
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setError(
            err.message || 'Gagal mengambil data order.',
          )
          setOrder(null)
          setLoading(false)
        }
      }
    }

    fetchOrder()

    return () => {
      cancelled = true
    }
  }, [orderId])

  const totalAmount = Number(order?.total_amount) || 0
  const paid = Number(paidAmount) || 0
  const changeAmount = Math.max(0, paid - totalAmount)
  const remainingAmount = Math.max(0, totalAmount - paid)

  function handlePaidAmountChange(event) {
    const value = event.target.value

    if (value === '') {
      setPaidAmount('')
      return
    }

    const numericValue = value.replace(/\D/g, '')
    setPaidAmount(numericValue)
  }

  function handleExactAmount() {
    setPaidAmount(String(totalAmount))
  }

  async function handlePaymentSubmit(event) {
    event.preventDefault()

    if (!order) return

    if (paid < totalAmount) {
      setError('Nominal pembayaran masih kurang.')
      return
    }

    try {
      setProcessing(true)
      setError('')
      setSuccess(false)

      /*
       * Pembayaran sementara diproses di sisi UI.
       * Integrasi database payment dilakukan setelah
       * struktur tabel payments dikonfirmasi.
       */
      await new Promise((resolve) => {
        setTimeout(resolve, 500)
      })

      setSuccess(true)
    } catch (err) {
      console.error(err)

      setError(
        err.message || 'Gagal memproses pembayaran.',
      )
    } finally {
      setProcessing(false)
    }
  }

  if (!orderId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Pembayaran
          </h1>

          <p className="mt-1 opacity-60">
            Pilih order terlebih dahulu untuk memproses pembayaran.
          </p>
        </div>

        <Link
          to="/cashier/orders"
          className="inline-block rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-80"
        >
          ← Kembali ke Order
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-8 text-center opacity-60">
        Memuat data pembayaran...
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Link
          to="/cashier/orders"
          className="text-sm font-semibold opacity-60 hover:opacity-100"
        >
          ← Kembali ke Order
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error || 'Order tidak ditemukan.'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/cashier/orders/${order.id}`}
          className="text-sm font-semibold opacity-60 hover:opacity-100"
        >
          ← Kembali ke Detail Order
        </Link>

        <div className="mt-3">
          <h1 className="text-3xl font-bold">
            Pembayaran #{order.order_number}
          </h1>

          <p className="mt-1 text-sm opacity-60">
            {dateTime(order.created_at)}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Pembayaran berhasil diproses.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <section className="overflow-hidden rounded-2xl border">
          <div className="border-b p-5">
            <h2 className="text-lg font-bold">
              Detail Pesanan
            </h2>
          </div>

          <div className="divide-y">
            {(order.order_items || []).map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-4 p-5"
              >
                <div>
                  <p className="font-semibold">
                    {item.item_name}
                  </p>

                  <p className="mt-1 text-sm opacity-60">
                    {item.quantity} × {money(item.unit_price)}
                  </p>

                  {item.notes && (
                    <p className="mt-1 text-sm opacity-60">
                      Catatan: {item.notes}
                    </p>
                  )}
                </div>

                <p className="font-semibold">
                  {money(item.subtotal)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t p-5">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="opacity-60">
                  Subtotal
                </span>

                <span>
                  {money(order.subtotal)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="opacity-60">
                  Diskon
                </span>

                <span>
                  - {money(order.discount_amount)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="opacity-60">
                  Pajak
                </span>

                <span>
                  {money(order.tax_amount)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="opacity-60">
                  Service Charge
                </span>

                <span>
                  {money(order.service_charge)}
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>

                  <span>
                    {money(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border p-6">
          <h2 className="text-lg font-bold">
            Proses Pembayaran
          </h2>

          <form
            onSubmit={handlePaymentSubmit}
            className="mt-6 space-y-5"
          >
            <div>
              <label
                htmlFor="payment-method"
                className="mb-2 block text-sm font-semibold"
              >
                Metode Pembayaran
              </label>

              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value)
                }
                disabled={processing || success}
                className="w-full rounded-xl border px-4 py-3"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option
                    key={method.value}
                    value={method.value}
                  >
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="paid-amount"
                className="mb-2 block text-sm font-semibold"
              >
                Uang Diterima
              </label>

              <input
                id="paid-amount"
                type="text"
                inputMode="numeric"
                value={paidAmount}
                onChange={handlePaidAmountChange}
                disabled={processing || success}
                placeholder="Contoh: 100000"
                className="w-full rounded-xl border px-4 py-3 text-lg font-semibold"
              />
            </div>

            <button
              type="button"
              onClick={handleExactAmount}
              disabled={processing || success}
              className="w-full rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
            >
              Bayar Uang Pas
            </button>

            <div className="rounded-2xl bg-gray-50 p-5">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-60">
                    Total Tagihan
                  </span>

                  <span className="font-semibold">
                    {money(totalAmount)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="opacity-60">
                    Uang Diterima
                  </span>

                  <span className="font-semibold">
                    {money(paid)}
                  </span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="opacity-60">
                      Kembalian
                    </span>

                    <span className="text-lg font-bold">
                      {money(changeAmount)}
                    </span>
                  </div>
                </div>

                {remainingAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span className="font-semibold">
                      Kekurangan
                    </span>

                    <span className="font-bold">
                      {money(remainingAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={
                processing ||
                success ||
                paid < totalAmount
              }
              className="w-full rounded-xl bg-black px-5 py-4 font-semibold text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {processing
                ? 'Memproses...'
                : success
                  ? 'Pembayaran Berhasil'
                  : 'Konfirmasi Pembayaran'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
