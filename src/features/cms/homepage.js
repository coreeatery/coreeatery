import { supabase } from '../../lib/supabase/client'

const TABLE = 'homepage_settings'

export async function getHomepageSettings() {
  if (!supabase) {
    throw new Error('Supabase belum terhubung.')
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error

  return data
}

export async function saveHomepageSettings(payload) {
  if (!supabase) {
    throw new Error('Supabase belum terhubung.')
  }

  const { data: existing, error: existingError } = await supabase
    .from(TABLE)
    .select('id')
    .eq('is_active', true)
    .maybeSingle()

  if (existingError) throw existingError

  if (existing?.id) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error

    return data
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      ...payload,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error

  return data
}
