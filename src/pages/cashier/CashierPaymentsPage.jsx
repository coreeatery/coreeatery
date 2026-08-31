import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getOrderById } from '../../features/orders/orders'
import {
  calculatePaymentChange,
  createPayment,
} from '../../features/payments/payments'

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
    value: 'debit_card',
    label: 'Debit',
  },
  {
    value: 'credit_card',
    label: 'Kartu Kredit',
  },
  {
    value: 'bank_transfer',
    label: 'Transfer Bank',
  },
  {
    value: 'other',
    label: 'Lainnya',
  },
]

export default function CashierPaymentsPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order')

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const [method, setMethod] = useState('cash')
  const [paidAmount, setPaidAmount] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!orderId) {
      return
    }

    let cancelled = false

    async function fetchOrder() {
      try {
        setLoading(true)
        setError('')

        const data = await getOrderById(orderId)

        if (!cancelled) {
          setOrder(data)
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setError(
            err.message ||
              'Gagal mengambil data order.',
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
  }, [orderId])

  const totalAmount = Number(order?.total_amount) || 0
  const paid = Number(paidAmount) || 0

  const paymentCalculation = calculatePaymentChange({
    totalAmount,
    paidAmount: paid,
  })

  async function handleSubmit(event) {
    event.preventDefault()

    if (!order) {
      setError('Order tidak ditemukan.')
      return
    }

    if (order.payment_status === 'paid') {
      setError('Order ini sudah dibayar.')
      return
    }

    if (paid <= 0) {
      setError('Masukkan nominal pembayaran.')
      return
    }

    if (!paymentCalculation.isEnough) {
      setError(
        `Pembayaran kurang ${money(
          paymentCalculation.remainingAmount,
        )}.`,
      )
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess(null)

      const result = await createPayment({
        order_id: order.id,
        amount: paid,
        method,
        reference_number:
          referenceNumber.trim() || null,
        notes: notes.trim() || null,
      })

      setSuccess(result)

      setOrder((current) => ({
        ...current,
        payment_status: 'paid',
        status: 'completed',
      }))
    } catch (err) {
      console.error(err)

      setError(
        err.message ||
          'Pembayaran gagal diproses.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (!orderId) {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-bold">
          Pembayaran
        </h1>

        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-yellow-800">
          <p className="font-semibold">
            Order belum dipilih.
          </p>

          <p className="mt-1 text-sm">
            Buka pembayaran dari halaman detail order.
          </p>
        </div>

        <Link
          to="/cashier/orders"
          className="inline-block rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
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
      <div className="space-y-5">
        <h1 className="text-3xl font-bold">
          Pembayaran
        </h1>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error || 'Order tidak ditemukan.'}
        </div>

        <Link
          to="/cashier/orders"
          className="inline-block rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
        >
          ← Kembali ke Order
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-3xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            ✓
          </div>

          <h1 className="mt-5 text-3xl font-bold text-green-800">
            Pembayaran Berhasil
          </h1>

          <p className="mt-2 text-sm text-green-700">
            Order telah ditandai sebagai lunas.
          </p>
        </div>

        <div className="rounded-2xl border p-6">
          <div className="space-y-4">
            <div className="flex justify-between gap-4">
              <span className="opacity-60">
                Order
              </span>

              <span className="font-semibold">
                #{order.order_number}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="opacity-60">
                Kode Pembayaran
              </span>

              <span className="font-semibold">
                {success.payment.payment_code}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="opacity-60">
                Metode
              </span>

              <span className="font-semibold uppercase">
                {method}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="opacity-60">
                Dibayar
              </span>

              <span className="font-semibold">
                {money(totalAmount)}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="opacity-60">
                Uang Diterima
              </span>

              <span className="font-semibold">
                {money(paid)}
              </span>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between gap-4 text-lg font-bold">
                <span>Kembalian</span>

                <span>
                  {money(
                    paymentCalculation.changeAmount,
                  )}
                </span>
              </div>
            </div>

            <div className="border-t pt-4 text-sm opacity-60">
              Dibayar pada{' '}
              {dateTime(
                success.payment.paid_at,
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to={`/cashier/orders/${order.id}`}
            className="rounded-xl border px-5 py-4 text-center font-semibold hover:bg-gray-50"
          >
            Lihat Detail Order
          </Link>

          <Link
            to="/cashier/orders/new"
            className="rounded-xl bg-black px-5 py-4 text-center font-semibold text-white hover:opacity-80"
          >
            + Order Baru
          </Link>
        </div>
      </div>
    )
  }

  const items = order.order_items || []

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
            Pembayaran
          </h1>

          <p className="mt-1 text-sm opacity-60">
            Order #{order.order_number}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {order.payment_status === 'paid' && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Order ini sudah dibayar.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="overflow-hidden rounded-2xl border">
          <div className="border-b p-5">
            <h2 className="text-lg font-bold">
              Detail Pesanan
            </h2>
          </div>

          <div className="divide-y">
            {items.length === 0 ? (
              <div className="p-8 text-center text-sm opacity-60">
                Tidak ada item pesanan.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-5"
                >
                  <div className="min-w-0 flex-1">
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
              ))
            )}
          </div>

          <div className="border-t bg-gray-50 p-5">
            <div className="flex justify-between gap-4 text-sm">
              <span className="opacity-60">
                Subtotal
              </span>

              <span>
                {money(order.subtotal)}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4 text-sm">
              <span className="opacity-60">
                Diskon
              </span>

              <span>
                - {money(order.discount_amount)}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4 text-sm">
              <span className="opacity-60">
                Pajak
              </span>

              <span>
                {money(order.tax_amount)}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4 text-sm">
              <span className="opacity-60">
                Service Charge
              </span>

              <span>
                {money(order.service_charge)}
              </span>
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between gap-4 text-xl font-bold">
                <span>Total</span>

                <span>
                  {money(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <section className="rounded-2xl border p-5">
            <h2 className="text-lg font-bold">
              Metode Pembayaran
            </h2>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {PAYMENT_METHODS.map((paymentMethod) => (
                <button
                  key={paymentMethod.value}
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    setMethod(paymentMethod.value)
                  }
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    method === paymentMethod.value
                      ? 'border-black bg-black text-white'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {paymentMethod.label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border p-5">
            <h2 className="text-lg font-bold">
              Nominal Pembayaran
            </h2>

            <div className="mt-4">
              <label
                htmlFor="paidAmount"
                className="text-sm font-semibold"
              >
                Uang Diterima
              </label>

              <input
                id="paidAmount"
                type="number"
                min="0"
                step="1000"
                inputMode="numeric"
                value={paidAmount}
                onChange={(event) =>
                  setPaidAmount(event.target.value)
                }
                placeholder="Contoh: 100000"
                disabled={saving}
                className="mt-2 w-full rounded-xl border px-4 py-4 text-xl font-bold outline-none focus:border-black"
              />
            </div>

            <div className="mt-4 grid gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setPaidAmount(String(totalAmount))
                }
                className="rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50"
              >
                Uang Pas
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setPaidAmount(
                    String(
                      Math.ceil(
                        totalAmount / 10000,
                      ) * 10000,
                    ),
                  )
                }
                className="rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50"
              >
                Bulatkan ke Atas
              </button>
            </div>

            <div className="mt-5 space-y-3 border-t pt-5">
              <div className="flex justify-between gap-4 text-sm">
                <span className="opacity-60">
                  Total
                </span>

                <span>
                  {money(totalAmount)}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="opacity-60">
                  Diterima
                </span>

                <span>
                  {money(paid)}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-lg font-bold">
                <span>
                  {paymentCalculation.isEnough
                    ? 'Kembalian'
                    : 'Kekurangan'}
                </span>

                <span
                  className={
                    paymentCalculation.isEnough
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {paymentCalculation.isEnough
                    ? money(
                        paymentCalculation.changeAmount,
                      )
                    : money(
                        paymentCalculation.remainingAmount,
                      )}
                </span>
              </div>
            </div>
          </section>

          {method !== 'cash' && (
            <section className="rounded-2xl border p-5">
              <h2 className="text-lg font-bold">
                Referensi Pembayaran
              </h2>

              <label
                htmlFor="referenceNumber"
                className="mt-4 block text-sm font-semibold"
              >
                Nomor Referensi
              </label>

              <input
                id="referenceNumber"
                type="text"
                value={referenceNumber}
                onChange={(event) =>
                  setReferenceNumber(
                    event.target.value,
                  )
                }
                placeholder="Nomor transaksi / referensi"
                disabled={saving}
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-black"
              />
            </section>
          )}

          <section className="rounded-2xl border p-5">
            <h2 className="text-lg font-bold">
              Catatan
            </h2>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={3}
              placeholder="Catatan pembayaran..."
              disabled={saving}
              className="mt-4 w-full resize-none rounded-xl border px-4 py-3 outline-none focus:border-black"
            />
          </section>

          <button
            type="submit"
            disabled={
              saving ||
              order.payment_status === 'paid' ||
              !paymentCalculation.isEnough
            }
            className="w-full rounded-2xl bg-black px-5 py-5 text-lg font-bold text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving
              ? 'Memproses Pembayaran...'
              : `Bayar ${money(totalAmount)}`}
          </button>

          <p className="text-center text-xs opacity-50">
            Setelah pembayaran berhasil, order otomatis
            menjadi Completed dan Paid.
          </p>
        </form>
      </div>
    </div>
  )
}
