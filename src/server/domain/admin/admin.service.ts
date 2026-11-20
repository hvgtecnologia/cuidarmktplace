import { createClient } from '@/server/db/server-client'

/**
 * Métricas da visão geral do admin.
 *
 * Todos estes números vêm do banco. Antes, GMV / take rate / receita / ticket
 * médio e "disputas abertas" eram literais fixos no JSX — e contradiziam a
 * tela /admin/bookings, que já consultava de verdade.
 *
 * Nada aqui usa service role: a leitura é liberada pelas policies
 * *_select_admin, que conferem is_admin() no Postgres.
 */
export type AdminMetrics = {
  totalCaregivers: number
  pendingVerifications: number
  totalFamilies: number
  totalMatches: number
  activeBookings: number
  openDisputes: number
  gmvCents: number
  feeCents: number
  bookingCount: number
  takeRatePct: number
  avgTicketCents: number
}

export const EMPTY_METRICS: AdminMetrics = {
  totalCaregivers: 0, pendingVerifications: 0, totalFamilies: 0, totalMatches: 0,
  activeBookings: 0, openDisputes: 0, gmvCents: 0, feeCents: 0, bookingCount: 0,
  takeRatePct: 0, avgTicketCents: 0,
}

export async function getMetrics(): Promise<AdminMetrics> {
  const supabase = createClient()

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [
    { count: totalCaregivers },
    { count: pendingVerifications },
    { count: totalFamilies },
    { count: totalMatches },
    { count: activeBookings },
    { count: openDisputes },
    { data: monthBookings },
  ] = await Promise.all([
    supabase.from('caregiver_profiles').select('*', { count: 'exact', head: true }),
    // Mesmo filtro da fila em /admin/verification, que inclui 'in_review'.
    supabase.from('caregiver_profiles').select('*', { count: 'exact', head: true })
      .in('verification_status', ['pending', 'in_review']),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'family'),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'in_progress']),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'disputed'),
    supabase.from('bookings').select('total_cents, platform_fee_cents')
      .gte('start_at', monthStart.toISOString())
      .in('status', ['confirmed', 'in_progress', 'completed']),
  ])

  const rows = monthBookings ?? []
  const gmvCents = rows.reduce((sum, b) => sum + (b.total_cents ?? 0), 0)
  const feeCents = rows.reduce((sum, b) => sum + (b.platform_fee_cents ?? 0), 0)

  return {
    totalCaregivers: totalCaregivers ?? 0,
    pendingVerifications: pendingVerifications ?? 0,
    totalFamilies: totalFamilies ?? 0,
    totalMatches: totalMatches ?? 0,
    activeBookings: activeBookings ?? 0,
    openDisputes: openDisputes ?? 0,
    gmvCents,
    feeCents,
    bookingCount: rows.length,
    // Take rate real, não o 15% que estava escrito na mão nas duas telas.
    takeRatePct: gmvCents > 0 ? Math.round((feeCents / gmvCents) * 100) : 0,
    avgTicketCents: rows.length > 0 ? Math.round(gmvCents / rows.length) : 0,
  }
}
