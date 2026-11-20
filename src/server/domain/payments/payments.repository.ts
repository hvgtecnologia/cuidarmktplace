import { createClient } from '@/server/db/server-client'

/** Histórico de pagamentos para o admin (policy payments_select_admin). */
export async function findAllForAdmin(limit = 100) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('id, amount_cents, currency, status, description, paid_at, created_at, user:profiles!payments_user_id_fkey(full_name, role)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
