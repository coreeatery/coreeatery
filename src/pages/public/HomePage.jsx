import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHomepageSettings } from '../../features/cms/homepage'

export default function HomePage() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const data = await getHomepageSettings()

        if (mounted) {
          setSettings(data)
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Gagal memuat homepage.')
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

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-6">
        <p className="text-sm text-neutral-500">
          Memuat homepage...
        </p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </main>
    )
  }

  if (!settings) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-20">
        <section className="rounded-3xl border border-neutral-200 bg-neutral-50 p-10 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
            COREÉATERY
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Homepage belum dikonfigurasi
          </h1>

          <p className="mt-3 text-neutral-500">
            Silakan isi Homepage melalui Admin Panel.
          </p>

          <Link
            to="/admin/homepage"
            className="mt-6 inline-flex rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Buka Admin Homepage
          </Link>
        </section>
      </main>
    )
  }

  const whatsappNumber = settings.whatsapp_number?.replace(/\D/g, '')

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}`
    : null

  return (
    <main>
      {/* HERO */}
      <section className="relative min-h-[75vh] overflow-hidden bg-neutral-950 text-white">
        {settings.hero_image_url && (
          <img
            src={settings.hero_image_url}
            alt={settings.hero_title_id || 'COREÉATERY'}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-black/55" />

        <div className="relative mx-auto flex min-h-[75vh] max-w-7xl items-center px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.35em] text-white/70">
              COREÉATERY
            </p>

            <h1 className="mt-5 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              {settings.hero_title_id || 'Nikmati Pengalaman Kuliner Terbaik'}
            </h1>

            {settings.hero_subtitle_id && (
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
                {settings.hero_subtitle_id}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/reservasi"
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-neutral-950"
              >
                {settings.reservation_button_text_id || 'Reservasi Sekarang'}
              </Link>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      {(settings.about_title_id ||
        settings.about_description_id ||
        settings.about_image_url) && (
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-neutral-500">
                Tentang Kami
              </p>

              <h2 className="mt-3 text-4xl font-bold tracking-tight">
                {settings.about_title_id || 'Tentang COREÉATERY'}
              </h2>

              {settings.about_description_id && (
                <p className="mt-5 whitespace-pre-line text-base leading-8 text-neutral-600">
                  {settings.about_description_id}
                </p>
              )}
            </div>

            {settings.about_image_url && (
              <div className="overflow-hidden rounded-3xl">
                <img
                  src={settings.about_image_url}
                  alt={settings.about_title_id || 'Tentang COREÉATERY'}
                  className="aspect-[4/3] h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* RESERVATION */}
      <section className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-white/50">
              Reservasi
            </p>

            <h2 className="mt-3 text-4xl font-bold tracking-tight">
              {settings.reservation_title_id || 'Nikmati Momen Bersama Kami'}
            </h2>

            {settings.reservation_description_id && (
              <p className="mt-5 whitespace-pre-line text-lg leading-8 text-white/70">
                {settings.reservation_description_id}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/reservasi"
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-neutral-950"
              >
                {settings.reservation_button_text_id || 'Reservasi Sekarang'}
              </Link>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white"
                >
                  Hubungi WhatsApp
                </a>
              )}
            </div>
          </div>

          <div className="mt-12 grid gap-5 border-t border-white/10 pt-8 sm:grid-cols-3">
            {settings.address && (
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40">
                  Alamat
                </p>
                <p className="mt-2 whitespace-pre-line text-sm text-white/70">
                  {settings.address}
                </p>
              </div>
            )}

            {settings.opening_hours && (
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40">
                  Jam Operasional
                </p>
                <p className="mt-2 whitespace-pre-line text-sm text-white/70">
                  {settings.opening_hours}
                </p>
              </div>
            )}

            {settings.instagram_url && (
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40">
                  Instagram
                </p>

                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-white underline"
                >
                  Instagram COREÉATERY
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
