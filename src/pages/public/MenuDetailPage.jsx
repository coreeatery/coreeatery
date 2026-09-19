import { getLocale } from '../../lib/i18n/locale'
import { normalizeLanguage, pickLocalized } from '../../lib/i18n/content'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMenuItems } from '../../features/menu/menu'
function formatRupiah(value) {
  return new Intl.NumberFormat(getLocale(), { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0)
}

export default function MenuDetailPage() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language)
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getMenuItems()
      .then((items) => setItem(items.find((entry) => entry.id === id && entry.status === 'active' && entry.is_available) || null))
      .catch(() => setError(t('public.loadMenuDetailError')))
      .finally(() => setLoading(false))
  }, [id, t])

  if (loading) return <main className="flex min-h-[80vh] items-center justify-center bg-[#f5f1e8]"><p className="font-serif italic text-[#6e6659]">{t('menu.loading')}</p></main>
  if (error) return <main className="px-6 py-32 text-center text-sm text-red-600">{error}</main>
  if (!item) return <main className="px-6 py-32 text-center"><p className="font-serif text-3xl">{t('menu.notFound')}</p><Link to="/menu" className="mt-6 inline-flex text-[9px] uppercase tracking-[0.25em] text-[#8f7850] underline underline-offset-8">{t('menu.backToMenu')}</Link></main>

  const name = pickLocalized(item, 'name', language)
  const description = pickLocalized(item, 'description', language)
  const variants = (item.menu_variants || []).filter((variant) => variant.is_available).sort((a, b) => a.sort_order - b.sort_order)

  return <main className="bg-[#f5f1e8] pt-20 text-[#201d18]"><section className="mx-auto grid max-w-[1400px] lg:grid-cols-2"><div className="min-h-[520px] bg-[#ddd4c4] lg:min-h-[720px]">{item.image_url ? <img src={item.image_url} alt={name} className="h-full w-full object-cover" /> : <div className="flex h-full min-h-[520px] items-center justify-center text-[9px] uppercase tracking-[0.3em] text-[#9b8355]">COREÉATERY</div>}</div><div className="flex items-center px-6 py-16 sm:px-10 lg:px-16"><div className="max-w-xl"><Link to="/menu" className="text-[9px] uppercase tracking-[0.28em] text-[#9b8355]">← {t('menu.backToMenu')}</Link><p className="mt-12 text-[9px] uppercase tracking-[0.35em] text-[#9b8355]">{pickLocalized(item.menu_categories, 'name', language) || 'COREÉATERY'}</p><h1 className="mt-5 font-serif text-5xl leading-tight sm:text-6xl">{name}</h1><p className="mt-6 text-xl text-[#6e6659]">{formatRupiah(item.base_price)}</p>{description && <p className="mt-7 whitespace-pre-line text-sm leading-8 text-[#6e6659]">{description}</p>}{variants.length > 0 && <div className="mt-10 border-t border-[#d2c8b7] pt-7"><p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#9b8355]">{t('menu.availableVariants')}</p><div className="mt-4 space-y-3">{variants.map((variant) => <div key={variant.id} className="flex justify-between gap-5 border-b border-[#e2dbcf] pb-3 text-sm"><span>{pickLocalized(variant, 'name', language)}</span><span className="text-[#6e6659]">{formatRupiah(variant.price)}</span></div>)}</div></div>}<Link to="/reservasi" className="mt-10 inline-flex bg-[#201d18] px-7 py-4 text-[9px] font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-[#9b8355]">{t('menu.reserveTable')} ↗</Link></div></div></section></main>
}
