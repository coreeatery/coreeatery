import { useCallback, useEffect, useState } from 'react'
import {
  createGalleryItem,
  deleteGalleryItem,
  getGalleryItems,
  updateGalleryItem,
} from '../../features/cms/gallery'
import {
  deleteCmsImage,
  uploadCmsImage,
} from '../../features/cms/media'

export default function AdminGalleryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const loadGallery = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getGalleryItems()
      setItems(data)
    } catch (err) {
      setError(err.message || 'Gagal mengambil galeri.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGallery()
  }, [loadGallery])

  async function handleUpload(event) {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file) return

    setUploading(true)
    setError('')

    try {
      const { path, publicUrl } = await uploadCmsImage(
        file,
        'gallery',
      )

      try {
        await createGalleryItem({
          title: file.name,
          image_url: publicUrl,
          alt_text: file.name,
          sort_order: items.length,
          is_active: true,
        })
      } catch (dbError) {
        await deleteCmsImage(path)
        throw dbError
      }

      await loadGallery()
    } catch (err) {
      setError(err.message || 'Gagal mengupload gambar.')
    } finally {
      setUploading(false)
    }
  }

  async function handleToggle(item) {
    try {
      await updateGalleryItem(item.id, {
        is_active: !item.is_active,
      })

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                is_active: !entry.is_active,
              }
            : entry,
        ),
      )
    } catch (err) {
      setError(err.message || 'Gagal mengubah status.')
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Hapus foto "${item.title || 'Foto'}"?`,
    )

    if (!confirmed) return

    setError('')

    try {
      await deleteGalleryItem(item.id)

      const url = item.image_url

      if (url) {
        const marker = '/cms-media/'
        const index = url.indexOf(marker)

        if (index !== -1) {
          const path = url.slice(index + marker.length)
          await deleteCmsImage(path)
        }
      }

      setItems((current) =>
        current.filter((entry) => entry.id !== item.id),
      )
    } catch (err) {
      setError(err.message || 'Gagal menghapus foto.')
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">
            CMS RESTORAN
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Galeri
          </h1>

          <p className="mt-1 text-sm text-neutral-500">
            Kelola foto restoran langsung dari galeri HP.
          </p>
        </div>

        <label className="cursor-pointer rounded-xl bg-neutral-950 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-800">
          {uploading ? 'Mengupload...' : '+ Upload Foto'}

          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500">
          Memuat galeri...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <p className="font-semibold">
            Belum ada foto
          </p>

          <p className="mt-2 text-sm text-neutral-500">
            Upload foto pertama dari galeri HP admin.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
            >
              <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
                <img
                  src={item.image_url}
                  alt={item.alt_text || item.title || 'Gallery'}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <h2 className="truncate font-semibold">
                    {item.title || 'Foto restoran'}
                  </h2>

                  <p className="mt-1 text-xs text-neutral-500">
                    {item.is_active
                      ? 'Tampil di website'
                      : 'Disembunyikan'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(item)}
                    className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium"
                  >
                    {item.is_active
                      ? 'Sembunyikan'
                      : 'Tampilkan'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
