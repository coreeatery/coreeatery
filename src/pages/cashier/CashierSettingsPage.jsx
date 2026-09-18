import { useEffect, useRef, useState } from 'react'
import {
  getCurrentProfile,
  updateCurrentProfile,
} from '../../features/auth/profile'

export default function CashierSettingsPage() {
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const submitting = useRef(false)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        const profile = await getCurrentProfile()

        if (!profile) throw new Error('Profil tidak ditemukan.')

        if (active) {
          setForm({
            full_name: profile.full_name || '',
            phone: profile.phone || '',
          })
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || 'Gagal memuat profil.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()

    if (submitting.current || saving) return

    const fullName = form.full_name.trim()
    const phone = form.phone.replace(/[^0-9+]/g, '')

    if (fullName.length < 2 || fullName.length > 100) {
      setError('Nama lengkap harus terdiri dari 2–100 karakter.')
      setSuccess('')
      return
    }

    if (phone && !/^\+?[0-9]{8,16}$/.test(phone)) {
      setError('Nomor telepon harus berisi 8–16 digit.')
      setSuccess('')
      return
    }

    submitting.current = true
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const profile = await updateCurrentProfile({
        full_name: fullName,
        phone: phone || null,
      })

      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      })
      setSuccess('Profil berhasil diperbarui.')
    } catch (saveError) {
      setError(saveError.message || 'Gagal memperbarui profil.')
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="p-6 text-sm text-neutral-500">
        Memuat profil kasir...
      </section>
    )
  }

  return (
    <section className="max-w-2xl space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          PENGATURAN KASIR
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Profil Saya</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Anda hanya dapat mengubah nama dan nomor telepon milik sendiri.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <Field
          label="Nama lengkap"
          value={form.full_name}
          onChange={(value) =>
            setForm((current) => ({ ...current, full_name: value }))
          }
          minLength={2}
          maxLength={100}
          required
        />
        <Field
          label="Nomor telepon"
          value={form.phone}
          onChange={(value) =>
            setForm((current) => ({ ...current, phone: value }))
          }
          inputMode="tel"
          maxLength={20}
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-neutral-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'Simpan profil'}
        </button>
      </form>
    </section>
  )
}

function Field({ label, value, onChange, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm"
        {...props}
      />
    </label>
  )
}
