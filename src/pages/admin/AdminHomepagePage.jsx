import { useEffect, useRef, useState } from 'react'
import {
  getHomepageSettings,
  saveHomepageSettings,
} from '../../features/cms/homepage'
import { uploadCmsImage } from '../../features/cms/media'

const EMPTY_FORM = {
  hero_title_id: '',
  hero_title_en: '',
  hero_subtitle_id: '',
  hero_subtitle_en: '',
  hero_image_url: '',

  about_title_id: '',
  about_title_en: '',
  about_description_id: '',
  about_description_en: '',
  about_image_url: '',

  reservation_title_id: '',
  reservation_title_en: '',
  reservation_description_id: '',
  reservation_description_en: '',
  reservation_button_text_id: 'Reservasi Sekarang',
  reservation_button_text_en: 'Make a Reservation',

  whatsapp_number: '',
  address: '',
  google_maps_url: '',
  instagram_url: '',
  opening_hours: '',
}

export default function AdminHomepagePage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const heroInputRef = useRef(null)
  const aboutInputRef = useRef(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const data = await getHomepageSettings()

        if (mounted && data) {
          setForm({
            ...EMPTY_FORM,
            ...data,
          })
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Gagal mengambil pengaturan homepage.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setSuccess('')
    setError('')
  }

  async function handleImageUpload(event, field, folder) {
    const file = event.target.files?.[0]

    if (!file) return

    setUploading(field)
    setError('')
    setSuccess('')

    try {
      const result = await uploadCmsImage(file, folder)

      updateField(field, result.publicUrl)

      setSuccess('Foto berhasil diupload. Jangan lupa simpan homepage.')
    } catch (err) {
      setError(err.message || 'Gagal mengupload foto.')
    } finally {
      setUploading('')
      event.target.value = ''
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await saveHomepageSettings({
        hero_title_id: form.hero_title_id.trim() || null,
        hero_title_en: form.hero_title_en.trim() || null,
        hero_subtitle_id: form.hero_subtitle_id.trim() || null,
        hero_subtitle_en: form.hero_subtitle_en.trim() || null,
        hero_image_url: form.hero_image_url.trim() || null,

        about_title_id: form.about_title_id.trim() || null,
        about_title_en: form.about_title_en.trim() || null,
        about_description_id: form.about_description_id.trim() || null,
        about_description_en: form.about_description_en.trim() || null,
        about_image_url: form.about_image_url.trim() || null,

        reservation_title_id:
          form.reservation_title_id.trim() || null,
        reservation_title_en:
          form.reservation_title_en.trim() || null,
        reservation_description_id:
          form.reservation_description_id.trim() || null,
        reservation_description_en:
          form.reservation_description_en.trim() || null,
        reservation_button_text_id:
          form.reservation_button_text_id.trim() ||
          'Reservasi Sekarang',
        reservation_button_text_en:
          form.reservation_button_text_en.trim() ||
          'Make a Reservation',

        whatsapp_number: form.whatsapp_number.trim() || null,
        address: form.address.trim() || null,
        google_maps_url: form.google_maps_url.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        opening_hours: form.opening_hours.trim() || null,
      })

      setSuccess('Homepage berhasil disimpan.')
    } catch (err) {
      setError(err.message || 'Gagal menyimpan homepage.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="p-6">
        <p className="text-sm text-neutral-500">
          Memuat Homepage CMS...
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          CMS RESTORAN
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Homepage
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Kelola isi homepage restoran tanpa mengubah kode.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* HERO */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Hero</h2>
            <p className="text-sm text-neutral-500">
              Bagian utama yang pertama kali dilihat pengunjung.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Judul Indonesia"
              value={form.hero_title_id}
              onChange={(value) => updateField('hero_title_id', value)}
              placeholder="Nikmati Pengalaman Kuliner Terbaik"
            />

            <Field
              label="Judul English"
              value={form.hero_title_en}
              onChange={(value) => updateField('hero_title_en', value)}
              placeholder="Enjoy the Ultimate Dining Experience"
            />

            <TextAreaField
              label="Subtitle Indonesia"
              value={form.hero_subtitle_id}
              onChange={(value) =>
                updateField('hero_subtitle_id', value)
              }
              placeholder="Makanan lezat, suasana nyaman, dan pengalaman yang berkesan."
            />

            <TextAreaField
              label="Subtitle English"
              value={form.hero_subtitle_en}
              onChange={(value) =>
                updateField('hero_subtitle_en', value)
              }
              placeholder="Delicious food, cozy atmosphere, memorable experience."
            />
          </div>

          <ImageUploader
            label="Foto Hero"
            value={form.hero_image_url}
            inputRef={heroInputRef}
            uploading={uploading === 'hero_image_url'}
            onChange={(event) =>
              handleImageUpload(
                event,
                'hero_image_url',
                'homepage/hero',
              )
            }
            onRemove={() => updateField('hero_image_url', '')}
          />
        </section>

        {/* ABOUT */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Tentang Restoran</h2>
            <p className="text-sm text-neutral-500">
              Informasi singkat tentang COREÉATERY.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Judul Indonesia"
              value={form.about_title_id}
              onChange={(value) => updateField('about_title_id', value)}
            />

            <Field
              label="Judul English"
              value={form.about_title_en}
              onChange={(value) => updateField('about_title_en', value)}
            />

            <TextAreaField
              label="Deskripsi Indonesia"
              value={form.about_description_id}
              onChange={(value) =>
                updateField('about_description_id', value)
              }
            />

            <TextAreaField
              label="Deskripsi English"
              value={form.about_description_en}
              onChange={(value) =>
                updateField('about_description_en', value)
              }
            />
          </div>

          <ImageUploader
            label="Foto About"
            value={form.about_image_url}
            inputRef={aboutInputRef}
            uploading={uploading === 'about_image_url'}
            onChange={(event) =>
              handleImageUpload(
                event,
                'about_image_url',
                'homepage/about',
              )
            }
            onRemove={() => updateField('about_image_url', '')}
          />
        </section>

        {/* RESERVATION */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Reservasi</h2>
            <p className="text-sm text-neutral-500">
              Konten CTA reservasi dan kontak restoran.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Judul Indonesia"
              value={form.reservation_title_id}
              onChange={(value) =>
                updateField('reservation_title_id', value)
              }
            />

            <Field
              label="Judul English"
              value={form.reservation_title_en}
              onChange={(value) =>
                updateField('reservation_title_en', value)
              }
            />

            <TextAreaField
              label="Deskripsi Indonesia"
              value={form.reservation_description_id}
              onChange={(value) =>
                updateField(
                  'reservation_description_id',
                  value,
                )
              }
            />

            <TextAreaField
              label="Deskripsi English"
              value={form.reservation_description_en}
              onChange={(value) =>
                updateField(
                  'reservation_description_en',
                  value,
                )
              }
            />

            <Field
              label="Teks Tombol Indonesia"
              value={form.reservation_button_text_id}
              onChange={(value) =>
                updateField(
                  'reservation_button_text_id',
                  value,
                )
              }
            />

            <Field
              label="Teks Tombol English"
              value={form.reservation_button_text_en}
              onChange={(value) =>
                updateField(
                  'reservation_button_text_en',
                  value,
                )
              }
            />
          </div>
        </section>

        {/* CONTACT */}
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Kontak & Informasi</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Nomor WhatsApp"
              value={form.whatsapp_number}
              onChange={(value) =>
                updateField('whatsapp_number', value)
              }
              placeholder="628xxxxxxxxxx"
            />

            <Field
              label="Jam Operasional"
              value={form.opening_hours}
              onChange={(value) =>
                updateField('opening_hours', value)
              }
              placeholder="10.00 - 22.00"
            />

            <TextAreaField
              label="Alamat"
              value={form.address}
              onChange={(value) => updateField('address', value)}
            />

            <Field
              label="Google Maps"
              value={form.google_maps_url}
              onChange={(value) =>
                updateField('google_maps_url', value)
              }
              placeholder="https://maps.google.com/..."
            />

            <Field
              label="Instagram"
              value={form.instagram_url}
              onChange={(value) =>
                updateField('instagram_url', value)
              }
              placeholder="https://instagram.com/..."
            />
          </div>
        </section>

        <div className="sticky bottom-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-neutral-950 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Homepage'}
          </button>
        </div>
      </form>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder = '',
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>

      <input
        type="text"
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
      />
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder = '',
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>

      <textarea
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
      />
    </label>
  )
}

function ImageUploader({
  label,
  value,
  inputRef,
  uploading,
  onChange,
  onRemove,
}) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-sm font-medium">{label}</div>

      <div className="overflow-hidden rounded-2xl border border-dashed border-neutral-300 bg-neutral-50">
        {value ? (
          <div className="relative">
            <img
              src={value}
              alt={label}
              className="h-64 w-full object-cover"
            />

            <div className="absolute bottom-3 left-3 right-3 flex justify-between gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold shadow"
              >
                Ganti Foto
              </button>

              <button
                type="button"
                onClick={onRemove}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow"
              >
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex min-h-48 w-full flex-col items-center justify-center gap-2 px-6 py-10 text-center"
          >
            <span className="text-4xl">📷</span>

            <span className="font-semibold">
              {uploading
                ? 'Mengupload foto...'
                : 'Pilih Foto dari Galeri'}
            </span>

            <span className="text-sm text-neutral-500">
              JPG, PNG, WEBP • Maksimal 5 MB
            </span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          className="hidden"
          onChange={onChange}
        />
      </div>
    </div>
  )
}
