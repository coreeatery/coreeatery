import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createMenuItem,
  deleteMenuItem,
  getMenuCategories,
  getMenuItems,
  updateMenuItem,
} from '../../features/menu/menu'
import { uploadCmsImage } from '../../features/cms/media'

const EMPTY_FORM = {
  category_id: '',
  name_id: '',
  name_en: '',
  name_zh: '',
  description_id: '',
  description_en: '',
  description_zh: '',
  slug: '',
  image_url: '',
  base_price: '',
  status: 'active',
  is_featured: false,
  is_available: true,
  sort_order: 0,
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function AdminMenuPage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [menuData, categoryData] = await Promise.all([
        getMenuItems(),
        getMenuCategories(),
      ])

      setItems(menuData)
      setCategories(categoryData)
    } catch (err) {
      setError(err.message || 'Gagal mengambil data menu.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadData])

  const filteredItems = useMemo(() => {
    const keyword = search.toLowerCase().trim()

    return items.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.name_id?.toLowerCase().includes(keyword) ||
        item.name_en?.toLowerCase().includes(keyword)

      const matchesCategory =
        categoryFilter === 'all' ||
        item.category_id === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [items, search, categoryFilter])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
    setError('')
  }

  function openEdit(item) {
    setEditingId(item.id)

    setForm({
      category_id: item.category_id ?? '',
      name_id: item.name_id ?? '',
      name_en: item.name_en ?? '',
      name_zh: item.name_zh ?? '',
      description_id: item.description_id ?? '',
      description_en: item.description_en ?? '',
      description_zh: item.description_zh ?? '',
      slug: item.slug ?? '',
      image_url: item.image_url ?? '',
      base_price: item.base_price ?? '',
      status: item.status ?? 'active',
      is_featured: Boolean(item.is_featured),
      is_available: Boolean(item.is_available),
      sort_order: item.sort_order ?? 0,
    })

    setFormOpen(true)
    setError('')
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0]

    if (!file) return

    setUploadingImage(true)
    setError('')

    try {
      const result = await uploadCmsImage(file, 'menu')
      updateField('image_url', result.publicUrl)
    } catch (err) {
      setError(err.message || 'Gagal mengupload foto menu.')
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  function handleNameChange(value) {
    setForm((current) => ({
      ...current,
      name_id: value,
      slug: current.slug || createSlug(value),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.name_id.trim()) {
      setError('Nama menu wajib diisi.')
      return
    }

    if (Number(form.base_price) < 0) {
      setError('Harga tidak boleh negatif.')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      category_id: form.category_id || null,
      name_id: form.name_id.trim(),
      name_en: form.name_en.trim() || null,
      name_zh: form.name_zh.trim() || null,
      description_id: form.description_id.trim() || null,
      description_en: form.description_en.trim() || null,
      description_zh: form.description_zh.trim() || null,
      slug: createSlug(form.slug || form.name_id),
      image_url: form.image_url.trim() || null,
      base_price: Number(form.base_price) || 0,
      status: form.status,
      is_featured: Boolean(form.is_featured),
      is_available: Boolean(form.is_available),
      sort_order: Number(form.sort_order) || 0,
    }

    try {
      if (editingId) {
        await updateMenuItem(editingId, payload)
      } else {
        await createMenuItem(payload)
      }

      setFormOpen(false)
      setForm(EMPTY_FORM)
      setEditingId(null)

      await loadData()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan menu.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Hapus menu "${item.name_id}"? Tindakan ini tidak dapat dibatalkan.`,
    )

    if (!confirmed) return

    setError('')

    try {
      await deleteMenuItem(item.id)
      await loadData()
    } catch (err) {
      setError(err.message || 'Gagal menghapus menu.')
    }
  }

  async function toggleAvailability(item) {
    try {
      await updateMenuItem(item.id, {
        is_available: !item.is_available,
      })

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, is_available: !entry.is_available }
            : entry,
        ),
      )
    } catch (err) {
      setError(err.message || 'Gagal mengubah status menu.')
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
            Menu
          </h1>

          <p className="mt-1 text-sm text-neutral-500">
            Kelola makanan, minuman, harga, kategori, dan ketersediaan.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          + Tambah Menu
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm md:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari menu..."
          className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-500"
        />

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none"
        >
          <option value="all">Semua kategori</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name_id}
            </option>
          ))}
        </select>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {editingId ? 'Edit Menu' : 'Tambah Menu'}
              </h2>

              <p className="text-sm text-neutral-500">
                Data ini akan digunakan oleh website dan POS.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100"
            >
              Tutup
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium">Nama Menu *</span>

              <input
                value={form.name_id}
                onChange={(event) => handleNameChange(event.target.value)}
                required
                className="w-full rounded-xl border border-neutral-200 px-4 py-3"
                placeholder="Nasi Goreng Spesial"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Kategori</span>

              <select
                value={form.category_id}
                onChange={(event) =>
                  updateField('category_id', event.target.value)
                }
                className="w-full rounded-xl border border-neutral-200 px-4 py-3"
              >
                <option value="">Tanpa kategori</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name_id}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Nama English</span>

              <input
                value={form.name_en}
                onChange={(event) =>
                  updateField('name_en', event.target.value)
                }
                className="w-full rounded-xl border border-neutral-200 px-4 py-3"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Harga *</span>

              <input
                type="number"
                min="0"
                step="500"
                value={form.base_price}
                onChange={(event) =>
                  updateField('base_price', event.target.value)
                }
                required
                className="w-full rounded-xl border border-neutral-200 px-4 py-3"
                placeholder="25000"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Deskripsi</span>

              <textarea
                value={form.description_id}
                onChange={(event) =>
                  updateField('description_id', event.target.value)
                }
                rows={3}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3"
                placeholder="Deskripsi menu..."
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Slug</span>

              <input
                value={form.slug}
                onChange={(event) =>
                  updateField('slug', event.target.value)
                }
                className="w-full rounded-xl border border-neutral-200 px-4 py-3"
              />
            </label>

            <div className="space-y-3 md:col-span-2">
              <span className="text-sm font-medium">Foto Menu</span>

              <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 sm:flex-row sm:items-center">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-200">
                  {form.image_url ? (
                    <img
                      src={form.image_url}
                      alt={form.name_id || 'Foto menu'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-neutral-500">
                      No Image
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-fit rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingImage
                      ? 'Mengupload...'
                      : form.image_url
                        ? 'Ganti Foto'
                        : '📷 Pilih Foto dari Galeri'}
                  </button>

                  {form.image_url && (
                    <button
                      type="button"
                      onClick={() => updateField('image_url', '')}
                      className="w-fit rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Hapus Foto
                    </button>
                  )}

                  <p className="text-xs text-neutral-500">
                    JPG, PNG, WEBP • Maksimal 5 MB
                  </p>
                </div>
              </div>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium">Status</span>

              <select
                value={form.status}
                onChange={(event) =>
                  updateField('status', event.target.value)
                }
                className="w-full rounded-xl border border-neutral-200 px-4 py-3"
              >
                <option value="draft">Draft</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Urutan</span>

              <input
                type="number"
                value={form.sort_order}
                onChange={(event) =>
                  updateField('sort_order', event.target.value)
                }
                className="w-full rounded-xl border border-neutral-200 px-4 py-3"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(event) =>
                  updateField('is_available', event.target.checked)
                }
              />
              Tersedia
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(event) =>
                  updateField('is_featured', event.target.checked)
                }
              />
              Menu unggulan
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-semibold"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Menu'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-10 text-center text-sm text-neutral-500">
            Memuat menu...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold">Belum ada menu</p>
            <p className="mt-1 text-sm text-neutral-500">
              Tambahkan menu pertama restoran.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name_id}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-neutral-400">
                        No Image
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">
                        {item.name_id}
                      </h3>

                      {item.is_featured && (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                          Unggulan
                        </span>
                      )}

                      {!item.is_available && (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                          Habis
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-neutral-500">
                      {item.menu_categories?.name_id || 'Tanpa kategori'}
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatRupiah(item.base_price)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAvailability(item)}
                    className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium"
                  >
                    {item.is_available ? 'Tandai Habis' : 'Aktifkan'}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600"
                  >
                    Hapus
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
