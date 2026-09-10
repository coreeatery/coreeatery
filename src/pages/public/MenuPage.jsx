import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getMenuCategories, getMenuItems } from '../../features/menu/menu'

function pick(row, field, language) {
  const suffix = language === 'en' ? 'en' : language === 'zh' ? 'zh' : 'id'
  return row?.[`${field}_${suffix}`] || row?.[`${field}_id`] || ''
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0)
}

export default function MenuPage() {
  const { i18n } = useTranslation()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    Promise.all([getMenuItems(), getMenuCategories()])
      .then(([menuData, categoryData]) => {
        if (!mounted) return
        setItems(menuData.filter((item) => item.status === 'active' && item.is_available))
        setCategories(categoryData.filter((category) => category.is_active))
      })
      .catch((err) => mounted && setError(err.message || 'Gagal memuat menu.'))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  const filteredItems = useMemo(() => activeCategory === 'all' ? items : items.filter((item) => item.category_id === activeCategory), [items, activeCategory])

  if (loading) return <main className="flex min-h-[80vh] items-center justify-center bg-[#f5f1e8]"><p className="font-serif text-lg italic text-[#6e6659]">Preparing the menu...</p></main>
  if (error) return <main className="mx-auto max-w-3xl px-6 py-32"><div className="border border-red-200 bg-white p-8 text-sm text-red-700">{error}</div></main>

  return (
    <main className="bg-[#f5f1e8] pt-20 text-[#201d18]">
      <section className="border-b border-[#d8d0c1] bg-[#201d18] px-6 py-20 text-white sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-[1400px]"><p className="text-[9px] uppercase tracking-[0.45em] text-[#dbc38f]">COREÉATERY</p><h1 className="mt-5 font-serif text-5xl font-normal sm:text-7xl">The Menu</h1><p className="mt-6 max-w-2xl text-sm leading-8 text-white/55 sm:text-base">Pilihan hidangan yang dirancang untuk dinikmati perlahan, dibagikan, dan diingat.</p></div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
        {categories.length > 0 && <div className="mb-14 flex gap-6 overflow-x-auto border-b border-[#d8d0c1] pb-0">{[{ id: 'all', label: 'All' }, ...categories.map((category) => ({ id: category.id, label: pick(category, 'name', i18n.language) || category.name_id }))].map((category) => <button key={category.id} type="button" onClick={() => setActiveCategory(category.id)} className={`whitespace-nowrap border-b-2 px-1 pb-4 text-[9px] font-semibold uppercase tracking-[0.28em] transition ${activeCategory === category.id ? 'border-[#b79b63] text-[#8f7850]' : 'border-transparent text-[#6e6659] hover:text-[#201d18]'}`}>{category.label}</button>)}</div>}

        {filteredItems.length === 0 ? <div className="py-24 text-center"><p className="font-serif text-2xl">Belum ada hidangan tersedia.</p></div> : <div className="grid gap-x-7 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">{filteredItems.map((item) => <Link key={item.id} to={`/menu/${item.id}`} className="group"><div className="aspect-[4/5] overflow-hidden bg-[#ddd4c4]">{item.image_url ? <img src={item.image_url} alt={pick(item, 'name', i18n.language)} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-[9px] uppercase tracking-[0.3em] text-[#9b8355]">COREÉATERY</div>}</div><div className="mt-5 flex justify-between gap-5"><div><p className="text-[9px] uppercase tracking-[0.2em] text-[#9b8355]">{item.menu_categories?.name_id || 'COREÉATERY'}</p><h2 className="mt-2 font-serif text-2xl">{pick(item, 'name', i18n.language) || item.name_id}</h2>{pick(item, 'description', i18n.language) && <p className="mt-2 line-clamp-2 text-xs leading-6 text-[#6e6659]">{pick(item, 'description', i18n.language)}</p>}</div><p className="pt-1 text-xs text-[#6e6659]">{formatRupiah(item.base_price)}</p></div></Link>)}</div>}
      </section>
    </main>
  )
}
