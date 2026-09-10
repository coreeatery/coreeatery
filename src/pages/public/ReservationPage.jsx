import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createReservation } from '../../features/reservations/reservations'

const TIME_SLOTS = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
const INITIAL = { customer_name: '', customer_phone: '', customer_email: '', reservation_date: '', reservation_time: '', guest_count: 2, occasion: 'Dine In', notes: '' }

export default function ReservationPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState(INITIAL)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')
  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSuccess(null)
    if (!form.customer_name.trim() || !form.customer_phone.trim() || !form.reservation_date || !form.reservation_time) {
      setError(t('reservation.requiredFields'))
      return
    }
    setSaving(true)
    try {
      const reservation = await createReservation({ ...form, customer_name: form.customer_name.trim(), customer_phone: form.customer_phone.trim(), customer_email: form.customer_email.trim() || null, guest_count: Number(form.guest_count), occasion: form.occasion.trim() || null, notes: form.notes.trim() || null, status: 'pending', table_id: null, created_by: null })
      setSuccess(reservation)
      setForm(INITIAL)
    } catch (err) {
      setError(err.message || 'Reservasi gagal dikirim. Silakan coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  if (success) return <main className="min-h-[80vh] bg-[#f5f1e8] px-6 pb-24 pt-32 text-[#201d18]"><div className="mx-auto max-w-2xl border-y border-[#cfc5b3] py-16 text-center"><p className="text-[9px] font-semibold uppercase tracking-[0.4em] text-[#9b8355]">{t('reservation.received')}</p><h1 className="mt-6 font-serif text-5xl">{t('reservation.seeYouSoon')}</h1><p className="mx-auto mt-6 max-w-lg text-sm leading-8 text-[#6e6659]">Permintaan reservasi Anda sudah kami terima dan menunggu konfirmasi dari tim COREÉATERY.</p><div className="mt-8 border border-[#d2c8b7] bg-[#eee8dc] px-6 py-5"><p className="text-[9px] uppercase tracking-[0.3em] text-[#9b8355]">{t('reservation.code')}</p><p className="mt-2 font-serif text-2xl">{success.reservation_code}</p></div><button type="button" onClick={() => setSuccess(null)} className="mt-8 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#8f7850] underline underline-offset-8">{t('reservation.another')}</button></div></main>

  return <main className="bg-[#f5f1e8] pt-20 text-[#201d18]"><section className="bg-[#201d18] px-6 py-20 text-white sm:px-10 lg:px-16 lg:py-28"><div className="mx-auto max-w-[1400px]"><p className="text-[9px] uppercase tracking-[0.45em] text-[#dbc38f]">{t('reservation.title')}</p><h1 className="mt-5 font-serif text-5xl sm:text-7xl">{t('reservation.pageTitle')}</h1><p className="mt-6 max-w-xl text-sm leading-8 text-white/50">{t('reservation.intro')}</p></div></section><section className="mx-auto grid max-w-[1200px] gap-12 px-6 py-16 sm:px-10 lg:grid-cols-[0.65fr_1.35fr] lg:px-16 lg:py-24"><aside><p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-[#9b8355]">{t('reservation.beforeVisit')}</p><h2 className="mt-5 font-serif text-3xl">{t('reservation.details')}</h2><p className="mt-5 text-sm leading-8 text-[#6e6659]">{t('reservation.note')}</p><div className="mt-8 border-t border-[#d2c8b7] pt-6"><p className="text-[9px] uppercase tracking-[0.3em] text-[#9b8355]">{t('reservation.availableSlots')}</p><p className="mt-3 text-sm leading-7 text-[#6e6659]">10:00 · 12:00 · 14:00<br />16:00 · 18:00 · 20:00</p></div></aside><form onSubmit={submit} className="border border-[#d2c8b7] bg-[#eee8dc] p-6 sm:p-9">{error && <div className="mb-7 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}<div className="grid gap-6 sm:grid-cols-2"><Field label={t('reservation.name')} value={form.customer_name} onChange={(v) => update('customer_name', v)} required /><Field label={t('reservation.whatsapp')} type="tel" value={form.customer_phone} onChange={(v) => update('customer_phone', v)} required /><Field label={t('reservation.email')} type="email" value={form.customer_email} onChange={(v) => update('customer_email', v)} /><Field label={t('reservation.guestCount')} type="number" min="1" max="50" value={form.guest_count} onChange={(v) => update('guest_count', v)} required /><Field label={t('reservation.date')} type="date" min={minDate} value={form.reservation_date} onChange={(v) => update('reservation_date', v)} required /><label className="block"><span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.25em] text-[#6e6659]">{t('reservation.time')}</span><select value={form.reservation_time} onChange={(e) => update('reservation_time', e.target.value)} required className="h-12 w-full border border-[#cfc5b3] bg-[#f8f4eb] px-4 text-sm outline-none focus:border-[#9b8355]"><option value="">{t('reservation.selectTime')}</option>{TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></label><Field label={t('reservation.occasion')} value={form.occasion} onChange={(v) => update('occasion', v)} /></div><label className="mt-6 block"><span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.25em] text-[#6e6659]">{t('reservation.notes')}</span><textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows="4" placeholder={t('reservation.notesPlaceholder')} className="w-full border border-[#cfc5b3] bg-[#f8f4eb] px-4 py-3 text-sm outline-none focus:border-[#9b8355]" /></label><button disabled={saving} className="mt-8 w-full bg-[#201d18] px-7 py-4 text-[9px] font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-[#9b8355] disabled:cursor-not-allowed disabled:opacity-50">{saving ? t('reservation.sending') : `${t('reservation.request')} ↗`}</button></form></section></main>
}

function Field({ label, value, onChange, type = 'text', ...props }) {
  return <label className="block"><span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.25em] text-[#6e6659]">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full border border-[#cfc5b3] bg-[#f8f4eb] px-4 text-sm outline-none focus:border-[#9b8355]" {...props} /></label>
}
