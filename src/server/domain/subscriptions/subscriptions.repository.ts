import { createClient } from '@/server/db/server-client'

export type PlanTier = 'free' | 'pro' | 'premium'

export async function findByUser(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

/** Assinatura ativa e dentro do período? */
export async function hasActivePlan(userId: string) {
  const sub = await findByUser(userId)
  if (sub?.status !== 'active') return false
  if (!sub.current_period_end) return true
  return new Date(sub.current_period_end) > new Date()
}
