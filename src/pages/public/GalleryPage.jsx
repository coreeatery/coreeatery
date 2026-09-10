import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getGalleryItems } from '../../features/cms/gallery'

export default function GalleryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getGalleryItems()
      .then((data) => setItems(data.filter((item) => item.is_active)))
      .catch((err) => setError(err.message || 'Gagal memuat galeri.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <main className="flex min-h-[80vh] items-center justify-center bg-[#f5f1e8]"><p className="font-serif italic text-[#6e6659]">Opening the gallery...</p></main>
  if (error) return <main className="px-6 py-32 text-center text-sm text-red-600">{error}</main>

  return <main className="bg-[#f5f1e8] pt-20 text-[#201d18]"><section className="bg-[#201d18] px-6 py-20 text-white sm:px-10 lg:px-16 lg:py-28"><div className="mx-auto max-w-[1400px]"><p className="text-[9px] uppercase tracking-[0.45em] text-[#dbc38f]">Visual Journal</p><h1 className="mt-5 font-serif text-5xl sm:text-7xl">The Gallery</h1><p className="mt-6 max-w-xl text-sm leading-8 text-white/50">A glimpse into the room, the table, and the moments around it.</p></div></section><section className="mx-auto max-w-[1400px] px-6 py-12 sm:px-10 lg:px-16 lg:py-20">{items.length === 0 ? <div className="py-24 text-center"><p className="font-serif text-2xl">Belum ada foto.</p></div> : <div className="grid auto-rows-[190px] grid-cols-2 gap-3 sm:auto-rows-[240px] sm:grid-cols-3 lg:auto-rows-[300px]">{items.map((item, index) => <figure key={item.id} className={`group relative overflow-hidden bg-[#ddd4c4] ${index % 7 === 0 ? 'col-span-2 row-span-2' : index % 5 === 0 ? 'row-span-2' : ''}`}><img src={item.image_url} alt={item.alt_text || item.title || 'COREÉATERY'} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />{item.title && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-5 pb-5 pt-14 text-xs text-white/85 opacity-0 transition group-hover:opacity-100">{item.title}</figcaption>}</figure>)}</div>}<div className="mt-14 border-t border-[#d2c8b7] pt-8"><Link to="/reservasi" className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#8f7850] underline decoration-[#c7aa70] underline-offset-8">Reserve your table ↗</Link></div></section></main>
}
