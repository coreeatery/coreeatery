import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase/client'

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

export default function CashierRegisterPage() {
  const [shift, setShift] = useState(null)
  const [openingCash, setOpeningCash] = useState('')
  const [closingCash, setClosingCash] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchShift() {
      if (!supabase) {
        if (!cancelled) {
          setError('Supabase belum dikonfigurasi.')
          setLoading(false)
        }
        return
      }

      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        const userId = userData?.user?.id

        if (!userId) {
          throw new Error('User kasir belum login.')
        }

        const { data, error: shiftError } = await supabase
          .from('cash_register_shifts')
          .select('*')
          .eq('cashier_id', userId)
          .order('opened_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (shiftError) {
          throw shiftError
        }

        if (!cancelled) {
          setShift(data)
          setError('')
          setLoading(false)
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setError(
            err.message || 'Gagal mengambil data shift.',
          )
          setLoading(false)
        }
      }
    }

    fetchShift()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleOpenShift(event) {
    event.preventDefault()

    const amount = Number(openingCash) || 0

    if (amount < 0) {
      setError('Modal awal tidak boleh negatif.')
      return
    }

    if (!supabase) {
      setError('Supabase belum dikonfigurasi.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      const userId = userData?.user?.id

      if (!userId) {
        throw new Error('User kasir belum login.')
      }

      const { data: existing, error: existingError } =
        await supabase
          .from('cash_register_shifts')
          .select('id')
          .eq('cashier_id', userId)
          .eq('status', 'open')
          .maybeSingle()

      if (existingError) {
        throw existingError
      }

      if (existing) {
        throw new Error(
          'Masih ada shift kasir yang terbuka.',
        )
      }

      const { data, error } = await supabase
        .from('cash_register_shifts')
        .insert({
          cashier_id: userId,
          opening_cash: amount,
          status: 'open',
        })
        .select('*')
        .single()

      if (error) {
        throw error
      }

      setShift(data)
      setOpeningCash('')
      setMessage('Shift berhasil dibuka.')
    } catch (err) {
      console.error(err)
      setError(
        err.message || 'Gagal membuka shift.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleCloseShift(event) {
    event.preventDefault()

    if (!shift) {
      return
    }

    const amount = Number(closingCash) || 0

    if (amount < 0) {
      setError('Kas akhir tidak boleh negatif.')
      return
    }

    if (!supabase) {
      setError('Supabase belum dikonfigurasi.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      const { data, error } = await supabase
        .from('cash_register_shifts')
        .update({
          closing_cash: amount,
          closed_at: new Date().toISOString(),
          status: 'closed',
        })
        .eq('id', shift.id)
        .select('*')
        .single()

      if (error) {
        throw error
      }

      setShift(data)
      setClosingCash('')
      setMessage('Shift berhasil ditutup.')
    } catch (err) {
      console.error(err)
      setError(
        err.message || 'Gagal menutup shift.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center opacity-60">
        Memuat cash register...
      </div>
    )
  }

  const isOpen = shift?.status === 'open'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Cash Register
        </h1>

        <p className="mt-1 text-sm opacity-60">
          Kelola buka dan tutup shift kasir.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {message}
        </div>
      )}

      <section className="rounded-2xl border p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm opacity-60">
              Status Shift
            </p>

            <div className="mt-2">
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  isOpen
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {isOpen ? 'SHIFT OPEN' : 'SHIFT CLOSED'}
              </span>
            </div>
          </div>

          {shift && (
            <div className="text-left sm:text-right">
              <p className="text-sm opacity-60">
                Dibuka
              </p>

              <p className="font-semibold">
                {dateTime(shift.opened_at)}
              </p>
            </div>
          )}
        </div>
      </section>

      {!isOpen ? (
        <section className="max-w-xl rounded-2xl border p-6">
          <h2 className="text-xl font-bold">
            Buka Shift
          </h2>

          <p className="mt-1 text-sm opacity-60">
            Masukkan uang kas awal sebelum mulai
            bertransaksi.
          </p>

          <form
            onSubmit={handleOpenShift}
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="opening-cash"
                className="mb-2 block text-sm font-semibold"
              >
                Kas Awal
              </label>

              <input
                id="opening-cash"
                type="number"
                min="0"
                value={openingCash}
                onChange={(event) =>
                  setOpeningCash(event.target.value)
                }
                placeholder="0"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? 'Membuka Shift...'
                : 'Buka Shift'}
            </button>
          </form>
        </section>
      ) : (
        <section className="max-w-xl rounded-2xl border p-6">
          <h2 className="text-xl font-bold">
            Tutup Shift
          </h2>

          <div className="mt-5 rounded-xl bg-gray-50 p-4">
            <p className="text-sm opacity-60">
              Kas Awal
            </p>

            <p className="mt-1 text-xl font-bold">
              {money(shift.opening_cash)}
            </p>
          </div>

          <form
            onSubmit={handleCloseShift}
            className="mt-6 space-y-4"
          >
            <div>
              <label
                htmlFor="closing-cash"
                className="mb-2 block text-sm font-semibold"
              >
                Kas Akhir
              </label>

              <input
                id="closing-cash"
                type="number"
                min="0"
                value={closingCash}
                onChange={(event) =>
                  setClosingCash(event.target.value)
                }
                placeholder="0"
                className="w-full rounded-xl border px-4 py-3"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? 'Menutup Shift...'
                : 'Tutup Shift'}
            </button>
          </form>
        </section>
      )}

      {shift && (
        <section className="rounded-2xl border p-6">
          <h2 className="text-lg font-bold">
            Detail Shift Terakhir
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm opacity-60">
                Kas Awal
              </p>

              <p className="mt-1 font-bold">
                {money(shift.opening_cash)}
              </p>
            </div>

            <div>
              <p className="text-sm opacity-60">
                Kas Akhir
              </p>

              <p className="mt-1 font-bold">
                {shift.closing_cash == null
                  ? '-'
                  : money(shift.closing_cash)}
              </p>
            </div>

            <div>
              <p className="text-sm opacity-60">
                Ditutup
              </p>

              <p className="mt-1 font-bold">
                {shift.closed_at
                  ? dateTime(shift.closed_at)
                  : '-'}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
