import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getPayments,
  cancelPayment,
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

const statusClass = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-700',
}

const methodLabel = {
  cash: 'Cash',
  qris: 'QRIS',
  debit: 'Debit',
  credit: 'Credit',
  transfer: 'Transfer',
  ewallet: 'E-Wallet',
}

export default function CashierTransactionsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [date, setDate] = useState('')
  const [search, setSearch] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const data = await getPayments({
        status,
        method,
        date,
      })

      setPayments(data)
    } catch (err) {
      console.error(err)
      setError(
        err.message || 'Gagal mengambil data transaksi.',
      )
    } finally {
      setLoading(false)
    }
  }, [status, method, date])

  useEffect(() => {
    let cancelled = false

    async function fetchPayments() {
      try {
        const data = await getPayments({
          status,
          method,
          date,
        })

        if (!cancelled) {
          setPayments(data)
          setError('')
          setLoading(false)
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setError(
            err.message || 'Gagal mengambil data transaksi.',
          )
          setLoading(false)
        }
      }
    }

    fetchPayments()

    return () => {
      cancelled = true
    }
  }, [status, method, date])

  async function handleCancel(payment) {
    if (!payment?.id) return

    const confirmed = window.confirm(
      `Batalkan transaksi ${payment.payment_code}?`,
    )

    if (!confirmed) return

    try {
      setCancellingId(payment.id)
      setError('')

      await cancelPayment(payment.id)
      await loadPayments()
    } catch (err) {
      console.error(err)
      setError(
        err.message || 'Gagal membatalkan transaksi.',
      )
    } finally {
      setCancellingId(null)
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const term = search.trim().toLowerCase()

    if (!term) return true

    return [
      payment.payment_code,
      payment.order_id,
      payment.reference_number,
      payment.method,
      payment.status,
    ]
      .filter(Boolean)
      .some((value) =>
        String(value).toLowerCase().includes(term),
      )
  })

  const paidPayments = filteredPayments.filter(
    (payment) => payment.status === 'paid',
  )

  const totalPaid = paidPayments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0,
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Transaksi
        </h1>

        <p className="mt-1 text-sm opacity-60">
          Riwayat pembayaran yang tercatat di sistem kasir.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border p-5">
          <p className="text-sm opacity-60">
            Total Transaksi
          </p>

          <p className="mt-2 text-2xl font-bold">
            {paidPayments.length}
          </p>
        </section>

        <section className="rounded-2xl border p-5">
          <p className="text-sm opacity-60">
            Total Pembayaran
          </p>

          <p className="mt-2 text-2xl font-bold">
            {money(totalPaid)}
          </p>
        </section>
      </div>

      <section className="rounded-2xl border p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_180px]">
          <input
            type="search"
            placeholder="Cari kode pembayaran / order..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
          />

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="rounded-xl border px-4 py-3 text-sm"
          >
            <option value="">Semua Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="cancelled">
              Cancelled
            </option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={method}
            onChange={(event) =>
              setMethod(event.target.value)
            }
            className="rounded-xl border px-4 py-3 text-sm"
          >
            <option value="">Semua Metode</option>
            <option value="cash">Cash</option>
            <option value="qris">QRIS</option>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
            <option value="transfer">Transfer</option>
            <option value="ewallet">E-Wallet</option>
          </select>

          <input
            type="date"
            value={date}
            onChange={(event) =>
              setDate(event.target.value)
            }
            className="rounded-xl border px-4 py-3 text-sm"
          />
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border">
        <div className="border-b p-5">
          <h2 className="font-bold">
            Riwayat Pembayaran
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm opacity-60">
            Memuat transaksi...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-sm opacity-60">
            Belum ada transaksi yang sesuai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="border-b bg-gray-50">
                <tr className="text-left">
                  <th className="px-5 py-4">
                    Pembayaran
                  </th>
                  <th className="px-5 py-4">
                    Order
                  </th>
                  <th className="px-5 py-4">
                    Metode
                  </th>
                  <th className="px-5 py-4">
                    Nominal
                  </th>
                  <th className="px-5 py-4">
                    Status
                  </th>
                  <th className="px-5 py-4">
                    Waktu
                  </th>
                  <th className="px-5 py-4 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold">
                        {payment.payment_code}
                      </p>

                      {payment.reference_number && (
                        <p className="mt-1 text-xs opacity-50">
                          Ref: {payment.reference_number}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        to={`/cashier/orders/${payment.order_id}`}
                        className="font-semibold hover:underline"
                      >
                        Lihat Order
                      </Link>
                    </td>

                    <td className="px-5 py-4">
                      {methodLabel[payment.method] ||
                        payment.method ||
                        '-'}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {money(payment.amount)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusClass[payment.status] ||
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {dateTime(payment.paid_at)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {payment.status === 'paid' && (
                        <button
                          type="button"
                          disabled={
                            cancellingId === payment.id
                          }
                          onClick={() =>
                            handleCancel(payment)
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {cancellingId === payment.id
                            ? 'Membatalkan...'
                            : 'Batalkan'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
