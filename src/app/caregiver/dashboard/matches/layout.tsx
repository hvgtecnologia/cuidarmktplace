import Link from 'next/link'
import { Icons } from '@/components/icons'
import { UserMenu } from '@/components/site/user-menu'
import { ContactsList, type ContactItem } from '@/components/matches/ContactsList'
import { MatchesSplitView } from '@/components/matches/SplitView'
import { requireRole } from '@/server/http/guards'
import * as profiles from '@/server/domain/profiles/profiles.repository'
import * as matchesRepo from '@/server/domain/matches/matches.repository'
import { requestTitle, requestSummary } from '@/lib/match-request'

export default async function CaregiverMatchesLayout({ children }: { children: React.ReactNode }) {
  // O layout de /caregiver/dashboard já garantiu sessão + role 'caregiver'.
  const user = await requireRole(['caregiver'])

  const [profile, requests] = await Promise.all([
    profiles.findById(user.id),
    // View anonimizada: região, serviço e sexo. Quem é a família não chega aqui.
    matchesRepo.findRequestsForCaregiver(),
  ])

  const counts = {
    total: requests.length,
    pending: requests.filter((m) => m.status === 'pending').length,
    accepted: requests.filter((m) => m.status === 'accepted').length,
  }

  const items: ContactItem[] = requests.map((m) => ({
    id: m.match_id,
    status: m.status,
    // Sem nome e sem foto, por definição: a lista é de PEDIDOS, não de pessoas.
    fullName: requestTitle(m.neighborhood, m.city),
    avatarUrl: null,
    subtitle:
      requestSummary(m.sex, m.care_needs) ??
      `Recebido em ${new Date(m.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`,
  }))

  return (
    <div className="h-screen flex flex-col bg-muted/30">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl flex-shrink-0">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/caregiver/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <Icons.arrowRight className="w-4 h-4 rotate-180" /> Visão geral
          </Link>
          <UserMenu
            fullName={profile?.full_name || 'Cuidador'}
            avatarUrl={profile?.avatar_url}
            email={user.email}
            role="caregiver"
          />
        </div>
      </header>

      <MatchesSplitView
        list={
          <>
            <div className="px-4 py-3 border-b border-border/60 flex-shrink-0">
              <h1 className="font-bold">Convites</h1>
              <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                <span><strong className="text-foreground">{counts.total}</strong> recebidos</span>
                <span><strong className="text-amber-600">{counts.pending}</strong> aguardando</span>
                <span><strong className="text-emerald-600">{counts.accepted}</strong> ativos</span>
              </div>
            </div>
            <ContactsList
              items={items}
              basePath="/caregiver/dashboard/matches"
              emptyMessage="Nenhum convite recebido ainda."
              fallbackIcon="pin"
            />
          </>
        }
      >
        {children}
      </MatchesSplitView>
    </div>
  )
}
