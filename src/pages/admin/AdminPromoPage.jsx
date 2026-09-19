import { useCallback, useEffect, useState } from "react"
import { createPromotion, deletePromotion, getPromotions, updatePromotion } from "../../features/cms/promotions"
import { uploadCmsImage } from "../../features/cms/media"

const EMPTY = { title_id: "", title_en: "", title_zh: "", description_id: "", description_en: "", description_zh: "", image_url: "", discount_text: "", discount_text_id: "", discount_text_en: "", discount_text_zh: "", start_date: "", end_date: "", sort_order: 0, is_active: true }

export default function AdminPromoPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const load = useCallback(async () => { setLoading(true); try { setItems(await getPromotions()) } catch (err) { setError(err.message || "Gagal memuat promosi.") } finally { setLoading(false) } }, [])
  useEffect(() => { const timer = window.setTimeout(() => { void load() }, 0); return () => window.clearTimeout(timer) }, [load])
  const update = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setError(""); setSuccess("") }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    console.log("[PROMO UPLOAD] File dipilih:", file?.name, file?.size, file?.type)
    if (!file) return

    setUploading(true)
    setError("")
    setSuccess("")

    try {
      console.log("[PROMO UPLOAD] Memulai upload...")
      const result = await uploadCmsImage(file, "promotions")
      console.log("[PROMO UPLOAD] Hasil:", result)
      update("image_url", result.publicUrl)
      setSuccess("Gambar promosi berhasil diunggah.")
    } catch (err) {
      setError(err.message || "Gagal mengunggah gambar promosi.")
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }
  const submit = async (event) => { event.preventDefault(); if (!form.title_id.trim()) { setError("Judul promosi Indonesia wajib diisi."); return } if (form.start_date && form.end_date && form.end_date < form.start_date) { setError("Tanggal akhir tidak boleh sebelum tanggal mulai."); return } setSaving(true); setError(""); try { const payload = { ...form, title_id: form.title_id.trim(), title_en: form.title_en.trim() || null, title_zh: form.title_zh.trim() || null, description_id: form.description_id.trim() || null, description_en: form.description_en.trim() || null, description_zh: form.description_zh.trim() || null, discount_text_id: form.discount_text_id.trim() || null, discount_text_en: form.discount_text_en.trim() || null, discount_text_zh: form.discount_text_zh.trim() || null, image_url: form.image_url.trim() || null, discount_text: form.discount_text.trim() || null, start_date: form.start_date || null, end_date: form.end_date || null, sort_order: Number(form.sort_order) || 0 }; if (editingId) await updatePromotion(editingId, payload); else await createPromotion(payload); setSuccess(editingId ? "Promosi diperbarui." : "Promosi dibuat."); setEditingId(""); setForm(EMPTY); await load() } catch (err) { setError(err.message || "Gagal menyimpan promosi.") } finally { setSaving(false) } }
  const edit = (item) => { setEditingId(item.id); setForm({ ...EMPTY, ...item, start_date: item.start_date || "", end_date: item.end_date || "" }); setError(""); setSuccess("") }
  const remove = async (id) => { if (!window.confirm("Hapus promosi ini?")) return; try { await deletePromotion(id); if (editingId === id) { setEditingId(""); setForm(EMPTY) } await load() } catch (err) { setError(err.message || "Gagal menghapus promosi.") } }
  return <section className="space-y-6"><header><p className="text-sm font-medium uppercase tracking-wider text-neutral-500">CMS RESTORAN</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Promotion Management</h1><p className="mt-2 text-sm text-neutral-500">Kelola promosi yang dapat tampil di website publik.</p></header>{error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}{success && <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>}<form onSubmit={submit} className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:grid-cols-2"><Field label="Judul Indonesia" value={form.title_id} onChange={(value) => update("title_id", value)} required /><Field label="Judul English" value={form.title_en} onChange={(value) => update("title_en", value)} /><Field label="Judul Mandarin" value={form.title_zh} onChange={(value) => update("title_zh", value)} /><Field label="Tanggal mulai" type="date" value={form.start_date} onChange={(value) => update("start_date", value)} /><Field label="Tanggal akhir" type="date" value={form.end_date} onChange={(value) => update("end_date", value)} /><Field label="Diskon Indonesia" value={form.discount_text_id} onChange={(value) => update("discount_text_id", value)} /><Field label="Diskon English" value={form.discount_text_en} onChange={(value) => update("discount_text_en", value)} /><Field label="Diskon Mandarin" value={form.discount_text_zh} onChange={(value) => update("discount_text_zh", value)} /><Field label="Urutan" type="number" min="0" value={form.sort_order} onChange={(value) => update("sort_order", value)} /><div className="md:col-span-2">
  <span className="text-sm font-medium">Gambar promosi</span>
  <input
    type="file"
    accept="image/*"
    onChange={handleImageUpload}
    disabled={uploading}
    className="mt-2 block w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm"
  />
  <p className="mt-1 text-xs text-neutral-500">
    Pilih gambar dari galeri. Format gambar, maksimal 5 MB.
  </p>
  {uploading && (
    <p className="mt-2 text-sm text-neutral-500">
      Mengunggah gambar...
    </p>
  )}
  {form.image_url && (
    <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200">
      <img
        src={form.image_url}
        alt="Preview promosi"
        className="h-48 w-full object-cover"
      />
    </div>
  )}
</div><label><span className="text-sm font-medium">Deskripsi Indonesia</span><textarea value={form.description_id} onChange={(event) => update("description_id", event.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm" rows="3" /></label><label><span className="text-sm font-medium">Deskripsi English</span><textarea value={form.description_en} onChange={(event) => update("description_en", event.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm" rows="3" /></label><label><span className="text-sm font-medium">Deskripsi Mandarin</span><textarea value={form.description_zh} onChange={(event) => update("description_zh", event.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm" rows="3" /></label><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.is_active} onChange={(event) => update("is_active", event.target.checked)} /> Aktif</label><div className="flex items-end gap-3"><button disabled={saving} className="rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Menyimpan..." : editingId ? "Perbarui promosi" : "Tambah promosi"}</button>{editingId && <button type="button" onClick={() => { setEditingId(""); setForm(EMPTY) }} className="text-sm underline">Batal</button>}</div></form><section className="rounded-2xl border border-neutral-200 bg-white shadow-sm"><div className="border-b border-neutral-200 p-6"><h2 className="text-lg font-bold">Daftar promosi</h2></div>{loading ? <p className="p-6 text-sm text-neutral-500">Memuat promosi...</p> : items.length === 0 ? <p className="p-6 text-sm text-neutral-500">Belum ada promosi.</p> : <div className="divide-y divide-neutral-100">{items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 p-5"><div><p className="font-semibold">{item.title_id}</p><p className="mt-1 text-sm text-neutral-500">{item.start_date || "Tanpa tanggal mulai"} — {item.end_date || "Tanpa tanggal akhir"}</p></div><div className="flex gap-3"><button type="button" onClick={() => edit(item)} className="text-sm font-medium underline">Edit</button><button type="button" onClick={() => remove(item.id)} className="text-sm font-medium text-red-600 underline">Hapus</button></div></div>)}</div>}</section></section>
}

function Field({ label, value, onChange, type = "text", ...props }) { return <label><span className="text-sm font-medium">{label}</span><input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm" {...props} /></label> }
