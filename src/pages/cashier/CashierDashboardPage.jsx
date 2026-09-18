import { useCallback, useEffect, useMemo, useState } from "react"
import { getLocale } from "../../lib/i18n/locale"
import { getCurrentOpenShift } from "../../features/payments/payments"
import { getSalesReport } from "../../features/reports/reports"

const money = (value) => new Intl.NumberFormat(getLocale(), { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value) || 0)

export default function CashierDashboardPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [data, setData] = useState(null)
  const [shift, setShift] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const load = useCallback(async () => { setLoading(true); setError(""); try { const [report, currentShift] = await Promise.all([getSalesReport({ startDate: today, endDate: today }), getCurrentOpenShift()]); setData(report); setShift(currentShift) } catch (err) { setError(err.message || "Gagal memuat ringkasan kasir.") } finally { setLoading(false) } }, [today])
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [load])
  if (loading) return <section className="p-6 text-sm text-neutral-500">Memuat ringkasan kasir...</section>
  return <section className="space-y-6"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium uppercase tracking-wider text-neutral-500">OPERASIONAL KASIR</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard Kasir</h1><p className="mt-2 text-sm text-neutral-500">Ringkasan read-only untuk transaksi pada tanggal perangkat.</p></div><button type="button" onClick={load} className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium">Muat ulang</button></header>{error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}{!error && <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Penjualan selesai" value={money(data.summary.totalSales)} /><Metric label="Order selesai" value={data.summary.orderCount} /><Metric label="Pembayaran tercatat" value={data.summary.transactionCount} /><Metric label="Rata-rata order" value={money(data.summary.averageTransaction)} /></div><section className="grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"><p className="text-sm text-neutral-500">Shift saat ini</p><p className="mt-2 text-xl font-bold">{shift ? "Shift terbuka" : "Tidak ada shift terbuka"}</p>{shift && <p className="mt-3 text-sm text-neutral-600">{shift.register_name} · modal {money(shift.opening_cash)}</p>}</div><div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"><p className="text-sm text-neutral-500">Pembayaran per metode</p>{data.paymentMethods.length === 0 ? <p className="mt-3 text-sm text-neutral-500">Belum ada pembayaran tercatat hari ini.</p> : <div className="mt-3 space-y-2">{data.paymentMethods.map((item) => <div key={item.method} className="flex justify-between text-sm"><span className="uppercase">{item.method}</span><span>{money(item.amount)}</span></div>)}</div>}</div></section></>}</section>
}
function Metric({ label, value }) { return <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"><p className="text-sm text-neutral-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div> }
