import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSalesReport } from '../../features/reports/reports'

const money = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const dateFormatter = new Intl.DateTimeFormat(
  'id-ID',
  {
    dateStyle: 'medium',
  },
)

const methodLabel = {
  cash: 'Tunai',
  debit: 'Debit',
  credit_card: 'Kartu Kredit',
  qris: 'QRIS',
  bank_transfer: 'Transfer Bank',
  e_wallet: 'E-Wallet',
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function getFirstDayOfMonth() {
  const date = new Date()
  date.setDate(1)

  return date.toISOString().slice(0, 10)
}

export default function CashierReportsPage() {
  const [startDate, setStartDate] = useState(
    getFirstDayOfMonth(),
  )
  const [endDate, setEndDate] = useState(getToday())
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchReport() {
      try {
        setLoading(true)
        setError('')

        const data = await getSalesReport({
          startDate,
          endDate,
        })

        if (!cancelled) {
          setReport(data)
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setReport(null)
          setError(
            err.message ||
              'Gagal mengambil laporan penjualan.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchReport()

    return () => {
      cancelled = true
    }
  }, [startDate, endDate])

  const summary = report?.summary || {
    orderCount: 0,
    transactionCount: 0,
    subtotal: 0,
    discount: 0,
    tax: 0,
    serviceCharge: 0,
    totalSales: 0,
    totalPaid: 0,
    averageTransaction: 0,
  }

  const completedOrders =
    report?.completedOrders || []

  const cancelledOrders =
    report?.cancelledOrders || []

  const paymentMethods =
    report?.paymentMethods || []

  const formattedStartDate = startDate
    ? dateFormatter.format(new Date(`${startDate}T00:00:00`))
    : '-'

  const formattedEndDate = endDate
    ? dateFormatter.format(new Date(`${endDate}T00:00:00`))
    : '-'

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <Link
            to="/cashier"
            className="text-sm font-semibold opacity-60 hover:opacity-100"
          >
            ← Dashboard Kasir
          </Link>

          <h1 className="mt-3 text-3xl font-bold">
            Laporan Penjualan
          </h1>

          <p className="mt-1 opacity-60">
            Ringkasan performa penjualan berdasarkan
            transaksi restoran.
          </p>
        </div>
      </div>

      <section className="rounded-2xl border p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="report-start-date"
              className="mb-2 block text-sm font-semibold"
            >
              Tanggal Mulai
            </label>

            <input
              id="report-start-date"
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div>
            <label
              htmlFor="report-end-date"
              className="mb-2 block text-sm font-semibold"
            >
              Tanggal Akhir
            </label>

            <input
              id="report-end-date"
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <div className="flex items-end">
            <div className="w-full rounded-xl bg-gray-50 px-4 py-3 text-sm">
              <p className="font-semibold">
                Periode Laporan
              </p>

              <p className="mt-1 opacity-60">
                {formattedStartDate} - {formattedEndDate}
              </p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border p-10 text-center">
          <p className="font-semibold">
            Memuat laporan...
          </p>

          <p className="mt-1 text-sm opacity-60">
            Sedang menghitung data penjualan.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <section className="rounded-2xl border p-5">
              <p className="text-sm opacity-60">
                Total Omzet
              </p>

              <p className="mt-2 text-2xl font-bold">
                {money(summary.totalSales)}
              </p>
            </section>

            <section className="rounded-2xl border p-5">
              <p className="text-sm opacity-60">
                Order Selesai
              </p>

              <p className="mt-2 text-2xl font-bold">
                {summary.orderCount}
              </p>
            </section>

            <section className="rounded-2xl border p-5">
              <p className="text-sm opacity-60">
                Transaksi Dibayar
              </p>

              <p className="mt-2 text-2xl font-bold">
                {summary.transactionCount}
              </p>
            </section>

            <section className="rounded-2xl border p-5">
              <p className="text-sm opacity-60">
                Rata-rata Transaksi
              </p>

              <p className="mt-2 text-2xl font-bold">
                {money(summary.averageTransaction)}
              </p>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border p-5">
              <h2 className="text-lg font-bold">
                Ringkasan Keuangan
              </h2>

              <div className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="opacity-60">
                    Subtotal
                  </span>

                  <span className="font-semibold">
                    {money(summary.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="opacity-60">
                    Diskon
                  </span>

                  <span className="font-semibold">
                    - {money(summary.discount)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="opacity-60">
                    Pajak
                  </span>

                  <span className="font-semibold">
                    {money(summary.tax)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="opacity-60">
                    Service Charge
                  </span>

                  <span className="font-semibold">
                    {money(summary.serviceCharge)}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between gap-4 text-lg font-bold">
                    <span>Total Penjualan</span>

                    <span>
                      {money(summary.totalSales)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="opacity-60">
                    Total Pembayaran
                  </span>

                  <span className="font-semibold">
                    {money(summary.totalPaid)}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border p-5">
              <h2 className="text-lg font-bold">
                Metode Pembayaran
              </h2>

              {paymentMethods.length === 0 ? (
                <div className="mt-5 rounded-xl bg-gray-50 p-5 text-center text-sm opacity-60">
                  Belum ada transaksi pembayaran.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {paymentMethods.map((item) => (
                    <div
                      key={item.method}
                      className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-4"
                    >
                      <div>
                        <p className="font-semibold">
                          {methodLabel[item.method] ||
                            item.method}
                        </p>

                        <p className="mt-1 text-xs opacity-60">
                          {item.transactions} transaksi
                        </p>
                      </div>

                      <p className="font-bold">
                        {money(item.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">
                    Order Selesai
                  </h2>

                  <p className="mt-1 text-sm opacity-60">
                    Order yang sudah dibayar.
                  </p>
                </div>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  {completedOrders.length}
                </span>
              </div>

              {completedOrders.length === 0 ? (
                <div className="mt-5 rounded-xl bg-gray-50 p-5 text-center text-sm opacity-60">
                  Belum ada order selesai.
                </div>
              ) : (
                <div className="mt-5 max-h-80 space-y-3 overflow-y-auto">
                  {completedOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/cashier/orders/${order.id}`}
                      className="block rounded-xl border p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="font-semibold">
                            #{order.order_number}
                          </p>

                          <p className="mt-1 text-xs opacity-60">
                            {new Intl.DateTimeFormat(
                              'id-ID',
                              {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              },
                            ).format(
                              new Date(order.created_at),
                            )}
                          </p>
                        </div>

                        <p className="font-bold">
                          {money(order.total_amount)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">
                    Order Dibatalkan
                  </h2>

                  <p className="mt-1 text-sm opacity-60">
                    Order yang dibatalkan dalam periode ini.
                  </p>
                </div>

                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                  {cancelledOrders.length}
                </span>
              </div>

              {cancelledOrders.length === 0 ? (
                <div className="mt-5 rounded-xl bg-gray-50 p-5 text-center text-sm opacity-60">
                  Tidak ada order yang dibatalkan.
                </div>
              ) : (
                <div className="mt-5 max-h-80 space-y-3 overflow-y-auto">
                  {cancelledOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/cashier/orders/${order.id}`}
                      className="block rounded-xl border p-4 hover:bg-gray-50"
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="font-semibold">
                            #{order.order_number}
                          </p>

                          <p className="mt-1 text-xs opacity-60">
                            {new Intl.DateTimeFormat(
                              'id-ID',
                              {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              },
                            ).format(
                              new Date(order.created_at),
                            )}
                          </p>
                        </div>

                        <span className="text-sm font-semibold text-red-600">
                          Cancelled
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
