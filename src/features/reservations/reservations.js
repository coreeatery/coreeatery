import { supabase } from '../../lib/supabase/client'

const RESERVATION_SELECT = `
  id,
  reservation_code,
  customer_name,
  customer_phone,
  customer_email,
  reservation_date,
  reservation_time,
  guest_count,
  table_id,
  occasion,
  notes,
  status,
  created_by,
  created_at,
  updated_at,
  restaurant_tables (
    id,
    table_number,
    capacity
  )
`

export async function getReservations({
  status = '',
  date = '',
  search = '',
} = {}) {
  if (!supabase) return []

  let query = supabase
    .from('reservations')
    .select(RESERVATION_SELECT)
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  if (date) {
    query = query.eq('reservation_date', date)
  }

  if (search.trim()) {
    const term = search.trim()

    query = query.or(
      `reservation_code.ilike.%${term}%,customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%`,
    )
  }

  const { data, error } = await query

  if (error) throw error

  return data ?? []
}

export async function getReservationById(id) {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi.')
  }

  const { data, error } = await supabase
    .from('reservations')
    .select(RESERVATION_SELECT)
    .eq('id', id)
    .single()

  if (error) throw error

  return data
}

export async function createReservation(payload) {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi.')
  }

  const { data, error } = await supabase
    .from('reservations')
    .insert(payload)
    .select(RESERVATION_SELECT)
    .single()

  if (error) throw error

  return data
}

export async function updateReservation(id, payload) {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi.')
  }

  const { data, error } = await supabase
    .from('reservations')
    .update(payload)
    .eq('id', id)
    .select(RESERVATION_SELECT)
    .single()

  if (error) throw error

  return data
}

export async function updateReservationStatus(id, status) {
  return updateReservation(id, { status })
}

export async function deleteReservation(id) {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi.')
  }

  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getReservationSummary(date = '') {
  if (!supabase) {
    return {
      total: 0,
      pending: 0,
      confirmed: 0,
      seated: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
    }
  }

  let query = supabase
    .from('reservations')
    .select('status')

  if (date) {
    query = query.eq('reservation_date', date)
  }

  const { data, error } = await query

  if (error) throw error

  const rows = data ?? []

  return {
    total: rows.length,
    pending: rows.filter((row) => row.status === 'pending').length,
    confirmed: rows.filter((row) => row.status === 'confirmed').length,
    seated: rows.filter((row) => row.status === 'seated').length,
    completed: rows.filter((row) => row.status === 'completed').length,
    cancelled: rows.filter((row) => row.status === 'cancelled').length,
    noShow: rows.filter((row) => row.status === 'no_show').length,
  }
}
