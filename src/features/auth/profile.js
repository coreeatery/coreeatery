import { supabase } from '../../lib/supabase/client'

export async function getCurrentProfile() {
  if (!supabase) return null

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, avatar_url, role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error

  return data
}

export async function updateCurrentProfile(payload) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.')

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user?.id) throw new Error('User belum login.')

  const { full_name: fullName, phone } = payload
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, phone })
    .eq('id', user.id)
    .select('id, full_name, phone, avatar_url, role, is_active')
    .single()

  if (error) throw error

  return data
}
