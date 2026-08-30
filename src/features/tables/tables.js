import { supabase } from '../../lib/supabase/client'

const TABLE_SELECT = `
  id,
  table_number,
  capacity,
  location,
  is_active,
  created_at,
  updated_at
`

function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi.')
  }
}

export async function getTables({
  activeOnly = true,
} = {}) {
  ensureSupabase()

  let query = supabase
    .from('restaurant_tables')
    .select(TABLE_SELECT)
    .order('table_number', { ascending: true })

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) throw error

  return data ?? []
}

export async function getTableById(id) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('restaurant_tables')
    .select(TABLE_SELECT)
    .eq('id', id)
    .single()

  if (error) throw error

  return data
}

export async function createTable(payload) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('restaurant_tables')
    .insert(payload)
    .select(TABLE_SELECT)
    .single()

  if (error) throw error

  return data
}

export async function updateTable(id, payload) {
  ensureSupabase()

  const { data, error } = await supabase
    .from('restaurant_tables')
    .update(payload)
    .eq('id', id)
    .select(TABLE_SELECT)
    .single()

  if (error) throw error

  return data
}

export async function setTableActive(id, isActive) {
  return updateTable(id, {
    is_active: isActive,
  })
}
