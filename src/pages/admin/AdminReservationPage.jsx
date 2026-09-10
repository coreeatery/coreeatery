import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { getLanguageFromI18n } from '../../lib/i18n/locale'
import {
  getReservations,
  getReservationSummary,
  updateReservationStatus,
  deleteReservation,
} from '../../features/reservations/reservations'
import {
  RESERVATION_STATUS_OPTIONS,
  getReservationStatusLabel,
} from '../../features/reservations/reservationStatus'

const STATUS_CLASSES = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  seated: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-neutral-200 text-neutral-700',
}

function formatDate(date) {
  if (!date) return '-'

  return new Intl.DateTimeFormat(getLocale(language), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function formatTime(time) {
  if (!time) return '-'
  return time.slice(0, 5)
}

function StatusBadge({ status, t }) {
  const statusKey = {
    pending: 'pending',
    confirmed: 'confirmed',
    seated: 'seated',
    completed: 'completed',
    cancelled: 'cancelled',
    no_show: 'noShow',
  }[status]

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        STATUS_CLASSES[status] ?? 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {statusKey ? t(`admin.${statusKey}`) : getReservationStatusLabel(status)}
    </span>
  )
}

export default function AdminReservationPage() {
  const { t, i18n } = useTranslation()
  const language = getLanguageFromI18n(i18n)
  const [reservations, setReservations] = useState([])
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    seated: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
  })

  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')
  const [search, setSearch] = useState('')
  const [selectedReservation, setSelectedReservation] = useState(null)

  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError('')

      try {
        const [reservationData, summaryData] = await Promise.all([
          getReservations({
            status,
            date,
            search,
          }),
          getReservationSummary(date),
        ])

        if (cancelled) return

        setReservations(reservationData)
        setSummary(summaryData)
      } catch (err) {
        if (cancelled) return

        console.error(err)
        setError(err.message || t('admin.loadReservationError'))
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [status, date, search, refreshKey])

  async function handleStatusChange(id, nextStatus) {
    setUpdatingId(id)
    setError('')

    try {
      const updated = await updateReservationStatus(id, nextStatus)

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === id ? { ...reservation, ...updated } : reservation,
        ),
      )

      setSelectedReservation((current) =>
        current?.id === id ? { ...current, ...updated } : current,
      )

      const nextSummary = await getReservationSummary(date)
      setSummary(nextSummary)
    } catch (err) {
      console.error(err)
      setError(err.message || t('admin.updateReservationStatusError'))
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDelete(reservation) {
    const confirmed = window.confirm(
      t('admin.deleteReservationConfirm', { code: reservation.reservation_code, name: reservation.customer_name }),
    )

    if (!confirmed) return

    setDeletingId(reservation.id)
    setError('')

    try {
      await deleteReservation(reservation.id)

      setReservations((current) =>
        current.filter((item) => item.id !== reservation.id),
      )

      if (selectedReservation?.id === reservation.id) {
        setSelectedReservation(null)
      }

      const nextSummary = await getReservationSummary(date)
      setSummary(nextSummary)
    } catch (err) {
      console.error(err)
      setError(err.message || t('admin.deleteReservationError'))
    } finally {
      setDeletingId(null)
    }
  }

  const summaryCards = [
    [t('common.total'), summary.total],
    [t('admin.pending'), summary.pending],
    [t('admin.confirmed'), summary.confirmed],
    [t('admin.seated'), summary.seated ?? 0],
    [t('admin.completed'), summary.completed],
    [t('admin.cancelled'), summary.cancelled],
    [t('admin.noShow'), summary.noShow],
  ]

  return (
    <main className="space-y-6 p-6">
      <header>
        <p className="text-sm font-medium text-neutral-500">
          {t('common.appName')}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Reservasi
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {t('admin.reservationManagement')}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {summaryCards.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-neutral-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              {t('admin.searchReservation')}
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('admin.reservationSearchPlaceholder')}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-700"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              {t('common.date')}
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-700"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              {t('common.status')}
            </span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-700"
            >
              <option value="">{t('admin.allStatuses')}</option>
              {RESERVATION_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(`admin.${option.value === 'no_show' ? 'noShow' : option.value}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 className="font-semibold">{t('admin.reservationList')}</h2>
            <p className="mt-1 text-xs text-neutral-500">
              {t('admin.reservationsFound', { count: reservations.length })}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('admin.refresh')}
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-neutral-500">
            {t('admin.loadingReservations')}
          </div>
        ) : reservations.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">{t('admin.noReservations')}</p>
            <p className="mt-1 text-sm text-neutral-500">
              {t('admin.changeReservationFilter')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-5 py-3">{t('admin.reservation')}</th>
                  <th className="px-5 py-3">{t('admin.customer')}</th>
                  <th className="px-5 py-3">{t('common.date')}</th>
                  <th className="px-5 py-3">{t('admin.guests')}</th>
                  <th className="px-5 py-3">{t('admin.table')}</th>
                  <th className="px-5 py-3">{t('common.status')}</th>
                  <th className="px-5 py-3">{t('admin.action')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100">
                {reservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-neutral-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold">
                        {reservation.reservation_code}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {formatTime(reservation.reservation_time)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium">
                        {reservation.customer_name}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {reservation.customer_phone}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {formatDate(reservation.reservation_date, language)}
                    </td>

                    <td className="px-5 py-4">
                      {reservation.guest_count} {t('admin.person')}
                    </td>

                    <td className="px-5 py-4">
                      {reservation.restaurant_tables?.table_number
                        ? t('admin.tableNumber', { number: reservation.restaurant_tables.table_number })
                        : '-'}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={reservation.status} t={t} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedReservation(reservation)
                          }
                          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100"
                        >
                          Detail
                        </button>

                        <select
                          value={reservation.status}
                          disabled={updatingId === reservation.id}
                          onChange={(event) =>
                            handleStatusChange(
                              reservation.id,
                              event.target.value,
                            )
                          }
                          className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-xs"
                        >
                          {RESERVATION_STATUS_OPTIONS.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                            >
                              {t(`admin.${option.value === 'no_show' ? 'noShow' : option.value}`)}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          disabled={deletingId === reservation.id}
                          onClick={() => handleDelete(reservation)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >{t('common.delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedReservation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedReservation(null)
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {t('admin.reservationDetail')}
                </p>
                <h2 className="mt-1 text-2xl font-bold">
                  {selectedReservation.reservation_code}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReservation(null)}
                className="rounded-lg px-3 py-2 text-sm hover:bg-neutral-100"
              >{t('common.close')}</button>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-neutral-500">{t('common.status')}</span>
                <StatusBadge status={selectedReservation.status} t={t} />
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">{t('common.name')}</span>
                <span className="font-medium">
                  {selectedReservation.customer_name}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">{t('common.phone')}</span>
                <span className="font-medium">
                  {selectedReservation.customer_phone}
                </span>
              </div>

              {selectedReservation.customer_email && (
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-500">Email</span>
                  <span className="font-medium">
                    {selectedReservation.customer_email}
                  </span>
                </div>
              )}

              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">{t('common.date')}</span>
                <span className="font-medium">
                  {formatDate(selectedReservation.reservation_date, language)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">{t('common.time')}</span>
                <span className="font-medium">
                  {formatTime(selectedReservation.reservation_time)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">{t('admin.guestCount')}</span>
                <span className="font-medium">
                  {selectedReservation.guest_count} {t('admin.person')}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">Meja</span>
                <span className="font-medium">
                  {selectedReservation.restaurant_tables?.table_number
                    ? t('admin.tableNumber', { number: selectedReservation.restaurant_tables.table_number })
                    : t('admin.tableNotAssigned')}
                </span>
              </div>

              {selectedReservation.occasion && (
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-500">{t('admin.event')}</span>
                  <span className="font-medium">
                    {selectedReservation.occasion}
                  </span>
                </div>
              )}

              {selectedReservation.notes && (
                <div>
                  <p className="text-neutral-500">{t('admin.notes')}</p>
                  <p className="mt-1 rounded-xl bg-neutral-50 p-3">
                    {selectedReservation.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
