import { supabase } from '../../lib/supabase/client'

export async function getMenuCategories() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getMenuItems() {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      menu_categories (
        id,
        name_id,
        name_en,
        name_zh
      ),
      menu_variants (
        id,
        name_id,
        name_en,
        name_zh,
        price,
        is_available,
        sort_order
      )
    `)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createMenuCategory(payload) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')

  const { data, error } = await supabase
    .from('menu_categories')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMenuCategory(id, payload) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')

  const { data, error } = await supabase
    .from('menu_categories')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMenuCategory(id) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')

  const { error } = await supabase
    .from('menu_categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function createMenuItem(payload) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')

  const { data, error } = await supabase
    .from('menu_items')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMenuItem(id, payload) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')

  const { data, error } = await supabase
    .from('menu_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMenuItem(id) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')

  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function createMenuVariant(payload) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')

  const { data, error } = await supabase
    .from('menu_variants')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMenuVariant(id, payload) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')

  const { data, error } = await supabase
    .from('menu_variants')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMenuVariant(id) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')

  const { error } = await supabase
    .from('menu_variants')
    .delete()
    .eq('id', id)

  if (error) throw error
}
