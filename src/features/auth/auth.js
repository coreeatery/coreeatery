import { supabase } from '../../lib/supabase/client'

export async function signIn(email, password) {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi.')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

export async function signOut() {
  if (!supabase) return

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

export async function getSession() {
  if (!supabase) return null

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}
