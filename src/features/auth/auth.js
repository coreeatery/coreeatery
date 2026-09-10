import { supabase } from '../../lib/supabase/client'

export async function signInWithPassword(email, password) {
  if (!supabase) {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  return data
}

export async function signOut() {
  if (!supabase) return

  const { error } = await supabase.auth.signOut()

  if (error) throw error
}
