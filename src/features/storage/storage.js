import { supabase } from '../../lib/supabase/client'

const BUCKET = 'restaurant-media'

export async function uploadRestaurantImage(file, folder = 'general') {
  if (!supabase) {
    throw new Error('Supabase belum terhubung.')
  }

  if (!file) {
    throw new Error('File foto wajib dipilih.')
  }

  if (!file.type?.startsWith('image/')) {
    throw new Error('File harus berupa gambar.')
  }

  const maxSize = 5 * 1024 * 1024

  if (file.size > maxSize) {
    throw new Error('Ukuran foto maksimal 5 MB.')
  }

  const extension =
    file.name?.split('.').pop()?.toLowerCase() || 'jpg'

  const safeExtension =
    extension.replace(/[^a-z0-9]/g, '') || 'jpg'

  const fileName = `${crypto.randomUUID()}.${safeExtension}`
  const filePath = `${folder}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
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
    .getPublicUrl(filePath)

  return {
    path: filePath,
    publicUrl,
  }
}

export async function deleteRestaurantImage(path) {
  if (!supabase || !path) return

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path])

  if (error) {
    throw error
  }
}
