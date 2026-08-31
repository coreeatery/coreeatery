import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPayments } from '../../features/payments/payments'

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

const methodLabel = {
  cash: 'Tunai',
  debit: 'Debit',
  credit_card: 'Kartu Kredit',
  qris: 'QRIS',
  bank_transfer: 'Transfer Bank',
  e_wallet: 'E-Wallet',
}

const statusClass = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-700',
}

export default function CashierTransactionsPage() {
  const [payments, setPayments] = useState([])
  const [method, setMethod] = useState('')
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchPayments() {
      try {
        setLoading(true)
        setError('')

        const data = await getPayments({
          method,
          status,
          date,
        })

        if (!cancelled) {
          setPayments(data)
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setError(
            err.message || 'Gagal mengambil data transaksi.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchPayments()

    return () => {
      cancelled = true
    }
  }, [method, status, date])

  const totalPaid = payments
    .filter((payment) => payment.status === 'paid')
    .reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0,
    )

  const totalTransactions = payments.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Transaksi
        </h1>

        <p className="mt-1 opacity-60">
          Riwayat pembayaran yang tercatat di sistem kasir.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border p-5">
          <p className="text-sm opacity-60">
            Total Transaksi
          </p>

          <p className="mt-2 text-2xl font-bold">
            {totalTransactions}
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
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label
              htmlFor="transaction-date"
              className="mb-2 block text-sm font-semibold"
            >
              Tanggal
            </label>

            <input
              id="transaction-date"
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label
              htmlFor="transaction-method"
              className="mb-2 block text-sm font-semibold"
            >
              Metode Pembayaran
            </label>

            <select
              id="transaction-method"
              value={method}
              onChange={(event) =>
                setMethod(event.target.value)
              }
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="">Semua Metode</option>
              <option value="cash">Tunai</option>
              <option value="debit">Debit</option>
              <option value="credit_card">
                Kartu Kredit
              </option>
              <option value="qris">QRIS</option>
              <option value="bank_transfer">
                Transfer Bank
              </option>
              <option value="e_wallet">
                E-Wallet
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="transaction-status"
              className="mb-2 block text-sm font-semibold"
            >
              Status
            </label>

            <select
              id="transaction-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="w-full rounded-xl border px-4 py-3"
            >
              <option value="">Semua Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="cancelled">
                Cancelled
              </option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border">
        <div className="border-b p-5">
          <h2 className="text-lg font-bold">
            Riwayat Transaksi
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm opacity-60">
            Memuat transaksi...
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-semibold">
              Belum ada transaksi
            </p>

            <p className="mt-1 text-sm opacity-60">
              Transaksi pembayaran akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">
                    Kode Pembayaran
                  </th>

                  <th className="px-5 py-4 text-left font-semibold">
                    Order
                  </th>

                  <th className="px-5 py-4 text-left font-semibold">
                    Metode
                  </th>

                  <th className="px-5 py-4 text-right font-semibold">
                    Nominal
                  </th>

                  <th className="px-5 py-4 text-left font-semibold">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left font-semibold">
                    Waktu
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-gray-50"
                  >
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
                        payment.method}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold">
                      {money(payment.amount)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          statusClass[payment.status] ||
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {dateTime(payment.paid_at)}
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
