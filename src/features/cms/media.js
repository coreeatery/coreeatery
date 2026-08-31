import { supabase } from '../../lib/supabase/client'

const BUCKET = 'cms-media'

function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
}

export async function uploadCmsImage(file, folder = 'general') {
  if (!supabase) {
    throw new Error('Supabase belum terhubung.')
  }

  if (!file) {
    throw new Error('File gambar belum dipilih.')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar.')
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran gambar maksimal 5 MB.')
  }

  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`
  const path = `${folder}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) {
    throw uploadError
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path)

  return {
    path,
    publicUrl,
  }
}

export async function deleteCmsImage(path) {
  if (!supabase) {
    throw new Error('Supabase belum terhubung.')
  }

  if (!path) return

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path])

  if (error) {
    throw error
  }
}
