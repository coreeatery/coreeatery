import { useEffect, useMemo, useState } from 'react'
import { getMenuCategories, getMenuItems } from '../../features/menu/menu'

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export default function MenuPage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const [menuData, categoryData] = await Promise.all([
          getMenuItems(),
          getMenuCategories(),
        ])

        if (!mounted) return

        setItems(menuData.filter((item) =>
          item.status === 'active' &&
          item.is_available
        ))

        setCategories(
          categoryData.filter((category) => category.is_active)
        )
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Gagal memuat menu.')
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

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') {
      return items
    }

    return items.filter(
      (item) => item.category_id === activeCategory
    )
  }, [items, activeCategory])

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6">
        <p className="text-sm text-neutral-500">
          Memuat menu...
        </p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-neutral-500">
          COREÉATERY
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Menu
        </h1>

        <p className="mt-3 max-w-2xl text-neutral-500">
          Pilihan makanan dan minuman terbaik dari COREÉATERY.
        </p>
      </header>

      {categories.length > 0 && (
        <div className="mb-10 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={
              activeCategory === 'all'
                ? 'shrink-0 rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white'
                : 'shrink-0 rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-medium'
            }
          >
            Semua
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={
                activeCategory === category.id
                  ? 'shrink-0 rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white'
                  : 'shrink-0 rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-medium'
              }
            >
              {category.name_id}
            </button>
          ))}
        </div>
      )}

      {filteredItems.length === 0 ? (
        <section className="rounded-3xl border border-neutral-200 bg-neutral-50 p-12 text-center">
          <p className="text-lg font-semibold">
            Menu belum tersedia
          </p>

          <p className="mt-2 text-sm text-neutral-500">
            Silakan kembali lagi nanti.
          </p>
        </section>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name_id}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                    No Image
                  </div>
                )}

                {item.is_featured && (
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold shadow">
                    ⭐ Unggulan
                  </span>
                )}
              </div>

              <div className="p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                  {item.menu_categories?.name_id || 'Menu'}
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  {item.name_id}
                </h2>

                {item.description_id && (
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-500">
                    {item.description_id}
                  </p>
                )}

                <div className="mt-5 flex items-center justify-between">
                  <p className="text-lg font-bold">
                    {formatRupiah(item.base_price)}
                  </p>

                  <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
                    Tersedia
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
