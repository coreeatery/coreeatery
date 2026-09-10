import { supabase } from '../../lib/supabase/client'

export async function getActivePromotions() {
  if (!supabase) return []

  const today = new Date().toISOString().slice(0, 10)
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
