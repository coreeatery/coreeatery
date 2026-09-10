import { getLocale } from '../../lib/i18n/locale'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getHomepageSettings } from '../../features/cms/homepage'
import { getGalleryItems } from '../../features/cms/gallery'
import { getActivePromotions } from '../../features/cms/promotions'
import { getMenuItems } from '../../features/menu/menu'
function pickLanguage(row, field, language) {
  const suffix = language === 'en' ? 'en' : language === 'zh' ? 'zh' : 'id'
  return row?.[`${field}_${suffix}`] || row?.[`${field}_id`] || row?.[field] || ''
}

function formatRupiah(value) {
  return new Intl.NumberFormat(getLocale(language), {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function SectionLabel({ children, light = false }) {
  return (
    <div className="flex items-center gap-4">
      <span className={`h-px w-10 ${light ? 'bg-[#c7aa70]' : 'bg-[#b79b63]'}`} />
      <p className={`text-[9px] font-semibold uppercase tracking-[0.42em] ${light ? 'text-[#dbc38f]' : 'text-[#9b8355]'}`}>
        {children}
      </p>
    </div>
  )
}

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const [settings, setSettings] = useState(null)
  const [featured, setFeatured] = useState([])
  const [gallery, setGallery] = useState([])
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [homepage, menu, galleryData, promoData] = await Promise.all([
          getHomepageSettings(),
          getMenuItems(),
          getGalleryItems(),
          getActivePromotions(),
        ])
        if (!mounted) return
        setSettings(homepage)
        setFeatured(menu.filter((item) => item.status === 'active' && item.is_available && item.is_featured).slice(0, 4))
        setGallery(galleryData.filter((item) => item.is_active).slice(0, 6))
        setPromotions(promoData.slice(0, 2))
      } catch (err) {
        if (mounted) setError(err.message || 'Gagal memuat homepage.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const whatsappUrl = useMemo(() => {
    const number = settings?.whatsapp_number?.replace(/\D/g, '')
    return number ? `https://wa.me/${number}` : null
  }, [settings])

  if (loading) {
    return <main className="flex min-h-[80vh] items-center justify-center bg-[#171512] text-white"><div className="text-center"><div className="mx-auto mb-5 h-px w-12 bg-[#c7aa70]" /><p className="font-serif text-lg italic text-white/60">{t('common.preparing')}</p></div></main>
  }

  if (error) {
    return <main className="flex min-h-[70vh] items-center justify-center bg-[#f5f1e8] px-6"><div className="max-w-xl border border-red-200 bg-white p-8 text-center"><p className="text-[10px] uppercase tracking-[0.3em] text-red-500">{t('common.error')}</p><p className="mt-4 text-sm text-neutral-600">{error}</p></div></main>
  }

  if (!settings) {
    return <main className="flex min-h-[70vh] items-center justify-center bg-[#f5f1e8] px-6"><div className="max-w-xl text-center"><p className="text-xs uppercase tracking-[0.4em] text-[#9b8355]">COREÉATERY</p><h1 className="mt-6 font-serif text-4xl">{t('common.noData')}</h1><Link to="/admin/homepage" className="mt-8 inline-flex bg-[#201d18] px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white">{t('admin.homepage')}</Link></div></main>
  }

  const heroTitle = pickLanguage(settings, 'hero_title', language) || 'Nikmati Pengalaman Kuliner Terbaik'
  const heroSubtitle = pickLanguage(settings, 'hero_subtitle', language)
  const aboutTitle = pickLanguage(settings, 'about_title', language) || 'Rasa yang dibuat dengan niat.'
  const aboutDescription = pickLanguage(settings, 'about_description', language)
  const reservationTitle = pickLanguage(settings, 'reservation_title', language) || t('public.findYourTable')
  const reservationDescription = pickLanguage(settings, 'reservation_description', language)
  const reservationButton = pickLanguage(settings, 'reservation_button_text', language) || 'Reservasi Sekarang'

  return (
    <main className="bg-[#f5f1e8] text-[#201d18]">
      <section className="relative min-h-[92svh] overflow-hidden bg-[#171512] text-white">
        {settings.hero_image_url && <img src={settings.hero_image_url} alt={heroTitle} className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35" />
        <div className="relative mx-auto flex min-h-[92svh] max-w-[1400px] items-end px-6 pb-16 pt-28 sm:px-10 lg:px-16 lg:pb-24">
          <div className="max-w-5xl">
            <SectionLabel light>{t('public.contemporaryDining')}</SectionLabel>
            <h1 className="mt-7 max-w-5xl font-serif text-[3.3rem] font-normal leading-[0.94] tracking-[-0.035em] sm:text-6xl lg:text-8xl">{heroTitle}</h1>
            {heroSubtitle && <p className="mt-7 max-w-2xl text-sm leading-7 text-white/70 sm:text-base sm:leading-8">{heroSubtitle}</p>}
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/reservasi" className="inline-flex items-center gap-4 bg-[#c7aa70] px-7 py-4 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#171512] transition hover:bg-[#e1ca98]">{reservationButton}<span>↗</span></Link>
              <Link to="/menu" className="inline-flex border border-white/30 bg-black/10 px-7 py-4 text-[9px] font-semibold uppercase tracking-[0.28em] text-white backdrop-blur-sm transition hover:bg-white hover:text-[#171512]">{t('public.exploreMenu')}</Link>
            </div>
          </div>
        </div>
      </section>

      {promotions.length > 0 && <section className="border-b border-[#d8d0c1] bg-[#eee8dc]"><div className="mx-auto grid max-w-[1400px] md:grid-cols-2">{promotions.map((promo) => <article key={promo.id} className="grid min-h-[260px] grid-cols-[1fr_0.9fr] border-b border-[#d8d0c1] last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"><div className="flex flex-col justify-center p-7 sm:p-10"><p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-[#9b8355]">{t('public.limitedOffering')}</p><h2 className="mt-4 font-serif text-2xl sm:text-3xl">{pickLanguage(promo, 'title', language) || promo.title_id}</h2>{promo.discount_text && <p className="mt-3 text-sm text-[#9b8355]">{promo.discount_text}</p>}</div>{promo.image_url ? <img src={promo.image_url} alt={pickLanguage(promo, 'title', language)} className="h-full min-h-[260px] w-full object-cover" /> : <div className="bg-[#dcd3c2]" />}</article>)}</div></section>}

      {(settings.about_title_id || settings.about_description_id || settings.about_image_url) && <section className="mx-auto max-w-[1400px] px-6 py-24 sm:px-10 lg:px-16 lg:py-32"><div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr] lg:items-center lg:gap-24"><div className="order-2 lg:order-1"><SectionLabel>{t('public.ourPhilosophy')}</SectionLabel><h2 className="mt-7 max-w-xl font-serif text-4xl font-normal leading-tight sm:text-5xl lg:text-6xl">{aboutTitle}</h2>{aboutDescription && <p className="mt-7 max-w-xl whitespace-pre-line text-sm leading-8 text-[#6e6659] sm:text-base">{aboutDescription}</p>}<div className="mt-9 flex items-center gap-4 text-[9px] uppercase tracking-[0.28em] text-[#9b8355]"><span className="h-px w-8 bg-[#b79b63]" />{t('public.craftedWithIntention')}</div></div>{settings.about_image_url && <div className="order-1 lg:order-2"><div className="relative"><div className="absolute -bottom-4 -left-4 h-full w-full border border-[#c9b589]/60" /><img src={settings.about_image_url} alt={aboutTitle} className="relative aspect-[4/5] w-full object-cover sm:aspect-[4/3]" /></div></div>}</div></section>}

      {featured.length > 0 && <section className="border-y border-[#d8d0c1] bg-[#eee8dc]"><div className="mx-auto max-w-[1400px] px-6 py-24 sm:px-10 lg:px-16 lg:py-32"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><SectionLabel>{t('public.signatureMenu')}</SectionLabel><h2 className="mt-7 font-serif text-4xl sm:text-5xl">{t('public.signatureDescription')}</h2></div><Link to="/menu" className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#8f7850] underline decoration-[#c7aa70] underline-offset-8">{t('public.viewFullMenu')} ↗</Link></div><div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">{featured.map((item) => <Link key={item.id} to={`/menu/${item.id}`} className="group"><div className="aspect-[4/5] overflow-hidden bg-[#d9d1c2]">{item.image_url ? <img src={item.image_url} alt={item.name_id} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-[9px] uppercase tracking-[0.25em] text-[#9b8355]">COREÉATERY</div>}</div><div className="mt-5 flex items-start justify-between gap-4"><div><p className="text-[9px] uppercase tracking-[0.22em] text-[#9b8355]">{item.menu_categories?.name_id || t('menu.signature')}</p><h3 className="mt-2 font-serif text-xl">{pickLanguage(item, 'name', language) || item.name_id}</h3></div><span className="pt-1 text-xs text-[#6e6659]">{formatRupiah(item.base_price)}</span></div></Link>)}</div></div></section>}

      {gallery.length > 0 && <section className="bg-[#f5f1e8]"><div className="mx-auto max-w-[1400px] px-6 py-24 sm:px-10 lg:px-16 lg:py-32"><div className="flex items-end justify-between gap-8"><div><SectionLabel>{t('public.theExperience')}</SectionLabel><h2 className="mt-7 font-serif text-4xl sm:text-5xl">{t('public.insideCoreatery')}</h2></div><Link to="/galeri" className="hidden text-[9px] font-semibold uppercase tracking-[0.28em] text-[#8f7850] sm:block">{t('public.viewGallery')} ↗</Link></div><div className="mt-12 grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:grid-cols-3 lg:auto-rows-[260px]">{gallery.map((item, index) => <Link key={item.id} to="/galeri" className={`group overflow-hidden ${index === 0 ? 'col-span-2 row-span-2' : index === 3 ? 'row-span-2' : ''}`}><img src={item.image_url} alt={item.alt_text || item.title || 'COREÉATERY'} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /></Link>)}</div><Link to="/galeri" className="mt-8 inline-flex text-[9px] font-semibold uppercase tracking-[0.28em] text-[#8f7850] sm:hidden">{t('public.viewGallery')} ↗</Link></div></section>}

      <section className="relative overflow-hidden bg-[#171512] text-white"><div className="mx-auto grid max-w-[1400px] lg:grid-cols-2"><div className="flex min-h-[500px] items-center px-6 py-20 sm:px-10 lg:px-16"><div className="max-w-xl"><SectionLabel light>{t('public.privateDining')}</SectionLabel><h2 className="mt-7 font-serif text-4xl leading-tight sm:text-5xl">{t('public.makeTheMoment')}<br /><span className="italic text-[#cdb47e]">{t('public.trulyYours')}</span></h2><p className="mt-7 text-sm leading-8 text-white/55 sm:text-base">{t('public.privateDiningDescription')}</p><Link to="/reservasi" className="mt-9 inline-flex items-center gap-4 border border-white/25 px-7 py-4 text-[9px] font-semibold uppercase tracking-[0.28em] transition hover:border-[#c7aa70] hover:bg-[#c7aa70] hover:text-[#171512]">{t('public.planYourVisit')} ↗</Link></div></div><div className="relative min-h-[360px] lg:min-h-[500px]">{settings.about_image_url && <img src={settings.about_image_url} alt="COREÉATERY dining experience" className="absolute inset-0 h-full w-full object-cover opacity-70" />}<div className="absolute inset-0 bg-gradient-to-r from-[#171512] via-transparent to-transparent" /></div></div></section>

      <section className="bg-[#f5f1e8]"><div className="mx-auto max-w-[1400px] px-6 py-24 sm:px-10 lg:px-16 lg:py-32"><div className="border-y border-[#cfc5b3] py-16 text-center sm:py-20"><SectionLabel><span className="inline-block">{t('public.reserveYourTable')}</span></SectionLabel><h2 className="mx-auto mt-7 max-w-4xl font-serif text-4xl leading-tight sm:text-5xl lg:text-7xl">{reservationTitle}</h2>{reservationDescription && <p className="mx-auto mt-7 max-w-2xl whitespace-pre-line text-sm leading-8 text-[#6e6659] sm:text-base">{reservationDescription}</p>}<div className="mt-9 flex flex-wrap justify-center gap-3"><Link to="/reservasi" className="inline-flex items-center gap-4 bg-[#201d18] px-8 py-4 text-[9px] font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-[#9b8355]">{reservationButton} ↗</Link>{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex border border-[#201d18] px-8 py-4 text-[9px] font-semibold uppercase tracking-[0.28em] transition hover:bg-[#201d18] hover:text-white">{t('public.whatsapp')}</a>}</div></div></div></section>

      <section className="bg-[#201d18] text-white"><div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-16 sm:grid-cols-3 sm:px-10 lg:px-16">{settings.address && <div><p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-[#c7aa70]">{t('public.visitUs')}</p><p className="mt-4 whitespace-pre-line text-sm leading-7 text-white/50">{settings.address}</p>{settings.google_maps_url && <a href={settings.google_maps_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-[9px] uppercase tracking-[0.25em] text-white/70 underline underline-offset-4">{t('public.openMaps')} ↗</a>}</div>}{settings.opening_hours && <div><p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-[#c7aa70]">{t('public.openingHours')}</p><p className="mt-4 whitespace-pre-line text-sm leading-7 text-white/50">{settings.opening_hours}</p></div>}{settings.instagram_url && <div><p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-[#c7aa70]">{t('public.followAlong')}</p><a href={settings.instagram_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm text-white/65 underline decoration-white/20 underline-offset-4 hover:text-white">{t('public.instagramLink')} ↗</a></div>}</div></section>
    </main>
  )
}
