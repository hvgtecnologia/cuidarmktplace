import { redirect } from 'next/navigation'
import { createClient } from '@/server/db/server-client'

export type UserRole = 'family' | 'caregiver' | 'admin'

/**
 * Dashboard de destino de cada role. Fonte única — antes isto estava
 * duplicado em actions.ts, auth/callback/route.ts e dashboard/page.tsx.
 */
export function dashboardForRole(role?: string | null): string {
  switch (role) {
    case 'admin':     return '/admin'
    case 'caregiver': return '/caregiver/dashboard'
    case 'family':    return '/family/dashboard'
    default:          return '/family/dashboard'
  }
}

type SessionProfile = {
  id: string
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  email: string | undefined
  /** CPF/CNPJ — só dígitos. Usado no checkout (Asaas exige para criar cliente). */
  document: string | null
}

/**
 * Exige sessão válida. Redireciona para /login se não houver.
 */
export async function requireUser(): Promise<SessionProfile> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, avatar_url, document')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    role: (profile?.role as UserRole) ?? 'family',
    full_name: profile?.full_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
    email: user.email,
    document: profile?.document ?? null,
  }
}

/**
 * Exige sessão E um dos roles informados. Quem não tem o role é mandado para
 * o PRÓPRIO dashboard — não para o de família, como acontecia antes.
 *
 * Isto é defesa em profundidade na camada de UI; o que realmente protege os
 * dados são as policies de RLS no Postgres.
 */
export async function requireRole(allowed: UserRole[]): Promise<SessionProfile> {
  const session = await requireUser()
  if (!allowed.includes(session.role)) {
    redirect(dashboardForRole(session.role))
  }
  return session
}
