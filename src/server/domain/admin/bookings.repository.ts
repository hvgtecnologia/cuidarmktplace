import { createClient } from '@/server/db/server-client'

/** Histórico de contratos para o admin (policy bookings_select_admin). */
export async function findAllForAdmin(limit = 100) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id, modality, start_at, end_at, hours, rate, total_cents,
      platform_fee_cents, status, created_at,
      family:profiles!bookings_family_id_fkey(full_name),
      caregiver:profiles!bookings_caregiver_id_fkey(full_name)
    `)
    .order('start_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/** Contratos do cuidador logado nos últimos 30 dias (receita do período). */
export async function findRecentByCaregiver(caregiverId: string) {
  const supabase = createClient()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('bookings')
    .select('id, modality, start_at, total_cents, status')
    .eq('caregiver_id', caregiverId)
    .gte('start_at', since)
    .order('start_at', { ascending: false })

  if (error) throw error
  return data
}
