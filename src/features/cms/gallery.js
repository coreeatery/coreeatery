import { supabase } from '../../lib/supabase/client'

const TABLE = 'gallery_items'

export async function getGalleryItems() {
  if (!supabase) {
    throw new Error('Supabase belum terhubung.')
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error

  return data ?? []
}

export async function createGalleryItem(payload) {
  if (!supabase) {
    throw new Error('Supabase belum terhubung.')
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function updateGalleryItem(id, payload) {
  if (!supabase) {
    throw new Error('Supabase belum terhubung.')
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function deleteGalleryItem(id) {
  if (!supabase) {
    throw new Error('Supabase belum terhubung.')
  }

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', id)

  if (error) throw error
}
