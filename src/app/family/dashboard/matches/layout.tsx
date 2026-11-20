import Link from 'next/link'
import { Icons } from '@/components/icons'
import { UserMenu } from '@/components/site/user-menu'
import { ContactsList, type ContactItem } from '@/components/matches/ContactsList'
import { MatchesSplitView } from '@/components/matches/SplitView'
import { requireRole } from '@/server/http/guards'
import * as profiles from '@/server/domain/profiles/profiles.repository'
import * as matchesRepo from '@/server/domain/matches/matches.repository'
import type { MatchStatus } from '@/lib/match-status'

type CaregiverDetails = { user_id: string; hourly_rate: number; city: string | null }
type CaregiverRel = {
  id: string
  full_name: string | null
  avatar_url: string | null
  caregiver_profiles: CaregiverDetails | CaregiverDetails[] | null
}
type MatchRow = {
  id: string
  status: MatchStatus
  caregiver: CaregiverRel | CaregiverRel[] | null
}

function one<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

export default async function FamilyMatchesLayout({ children }: { children: React.ReactNode }) {
  // O layout de /family já garantiu sessão + role 'family'.
  const user = await requireRole(['family'])

  const [profile, matches] = await Promise.all([
    profiles.findById(user.id),
    matchesRepo.findByFamily(user.id),
  ])

  const rows = (matches ?? []) as unknown as MatchRow[]
  const counts = {
    total: rows.length,
    pending: rows.filter((m) => m.status === 'pending').length,
    accepted: rows.filter((m) => m.status === 'accepted').length,
  }

  const items: ContactItem[] = rows.map((m) => {
    const cg = one(m.caregiver)
    const details = cg ? one(cg.caregiver_profiles) : null
    const subtitle = [details?.city, details?.hourly_rate ? `R$ ${details.hourly_rate}/h` : null]
      .filter(Boolean)
      .join(' · ')
    return {
      id: m.id,
      status: m.status,
      fullName: cg?.full_name || 'Cuidador',
      avatarUrl: cg?.avatar_url ?? null,
      subtitle: subtitle || null,
    }
  })

  return (
    <div className="h-screen flex flex-col bg-muted/30">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl flex-shrink-0">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/family/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <Icons.arrowRight className="w-4 h-4 rotate-180" /> Buscar mais cuidadores
          </Link>
          <UserMenu
            fullName={profile?.full_name || 'Família'}
            avatarUrl={profile?.avatar_url}
            email={user.email}
            role="family"
          />
        </div>
      </header>

      <MatchesSplitView
        list={
          <>
            <div className="px-4 py-3 border-b border-border/60 flex-shrink-0">
              <h1 className="font-bold">Meus convites</h1>
              <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                <span><strong className="text-foreground">{counts.total}</strong> enviados</span>
                <span><strong className="text-amber-600">{counts.pending}</strong> aguardando</span>
                <span><strong className="text-emerald-600">{counts.accepted}</strong> aceitos</span>
              </div>
            </div>
            <ContactsList
              items={items}
              basePath="/family/dashboard/matches"
              emptyMessage="Você ainda não convidou nenhum cuidador."
            />
          </>
        }
      >
        {children}
      </MatchesSplitView>
    </div>
  )
}
