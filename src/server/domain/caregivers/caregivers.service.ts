import * as caregivers from '@/server/domain/caregivers/caregivers.repository'
import * as matchesRepo from '@/server/domain/matches/matches.repository'
import * as bookings from '@/server/domain/admin/bookings.repository'
import * as subscriptions from '@/server/domain/subscriptions/subscriptions.repository'
import * as profiles from '@/server/domain/profiles/profiles.repository'

/**
 * Tudo que o dashboard do cuidador precisa, numa chamada.
 *
 * As 5 consultas rodam em paralelo (Promise.all) como antes; a diferença é que
 * a página não precisa mais saber que são 5, nem de quais tabelas.
 *
 * Os convites vêm da view ANONIMIZADA: o dashboard só usa contagens, e a
 * identidade da família não deve sequer trafegar até aqui.
 */
export async function getDashboard(userId: string) {
  const [profile, stats, requests, recentBookings, subscription] = await Promise.all([
    profiles.findById(userId),
    caregivers.findDashboardStats(userId),
    matchesRepo.findRequestsForCaregiver(),
    bookings.findRecentByCaregiver(userId),
    subscriptions.findByUser(userId),
  ])

  return {
    firstName: profile?.full_name?.split(' ')[0] || 'Cuidador',
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    stats,
    pendingCount: requests.filter((m) => m.status === 'pending').length,
    acceptedCount: requests.filter((m) => m.status === 'accepted').length,
    monthEarningsCents: (recentBookings ?? []).reduce((sum, b) => sum + (b.total_cents ?? 0), 0),
    bookingCount: (recentBookings ?? []).length,
    isPro: subscription?.plan === 'pro' && subscription?.status === 'active',
  }
}
