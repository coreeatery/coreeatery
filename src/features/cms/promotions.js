import { supabase } from '../../lib/supabase/client'

export async function getActivePromotions() {
  if (!supabase) return []

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
  }).format(new Date())
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getPromotions() {
  if (!supabase) throw new Error("Supabase belum terhubung.")
  const { data, error } = await supabase.from("promotions").select("*").order("sort_order", { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createPromotion(payload) {
  if (!supabase) throw new Error("Supabase belum terhubung.")
  const { data, error } = await supabase.from("promotions").insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updatePromotion(id, payload) {
  if (!supabase) throw new Error("Supabase belum terhubung.")
  const { data, error } = await supabase.from("promotions").update(payload).eq("id", id).select().single()
  if (error) throw error
  return data
}

export async function deletePromotion(id) {
  if (!supabase) throw new Error("Supabase belum terhubung.")
  const { error } = await supabase.from("promotions").delete().eq("id", id)
  if (error) throw error
}
