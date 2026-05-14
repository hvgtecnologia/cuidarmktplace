import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { UserMenu } from '@/components/site/user-menu'

export const metadata = {
  title: 'Meus convites · Família',
  description: 'Acompanhe seus convites enviados aos cuidadores.',
}

type CaregiverRel = { id: string; user_id: string; hourly_rate: number; city: string; profiles: { full_name: string; avatar_url: string | null } | { full_name: string; avatar_url: string | null }[] | null }

type MatchRow = {
  id: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
  created_at: string
  caregiver_id: string
  caregiver: CaregiverRel | CaregiverRel[] | null
}

const STATUS_META = {
  pending:   { label: 'Pendente',  badge: 'bg-amber-100 text-amber-800 border-amber-200', icon: 'clock' as const },
  accepted:  { label: 'Aceito',    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: 'check' as const },
  rejected:  { label: 'Recusado',  badge: 'bg-rose-100 text-rose-700 border-rose-200', icon: 'close' as const },
  cancelled: { label: 'Cancelado', badge: 'bg-muted text-muted-foreground border-border', icon: 'close' as const },
  completed: { label: 'Concluído', badge: 'bg-primary/10 text-primary border-primary/20', icon: 'check' as const },
}

export default async function FamilyMatchesPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, status, created_at, caregiver_id,
      caregiver:caregiver_profiles!matches_caregiver_id_fkey(
        id, user_id, hourly_rate, city,
        profiles:user_id (full_name, avatar_url)
      )
    `)
    .eq('family_id', user.id)
    .order('created_at', { ascending: false })

  const items = (matches as MatchRow[] | null) ?? []
  const counts = {
    total: items.length,
    pending: items.filter((m) => m.status === 'pending').length,
    accepted: items.filter((m) => m.status === 'accepted').length,
  }

  function getCg(rel: MatchRow['caregiver']) {
    if (!rel) return null
    return Array.isArray(rel) ? rel[0] : rel
  }
  function getProfile(rel: CaregiverRel['profiles']) {
    if (!rel) return null
    return Array.isArray(rel) ? rel[0] : rel
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
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

      <main className="container py-8 lg:py-10">
        <div className="mb-8">
          <h1 className="text-display-md text-balance">Meus convites e contatos</h1>
          <p className="mt-2 text-muted-foreground text-lg">Acompanhe o status dos cuidadores que você convidou.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl">
          <Card className="bg-card border border-border rounded-2xl">
            <CardContent className="p-5">
              <div className="text-3xl font-bold tracking-tight">{counts.total}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">Total enviados</div>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border rounded-2xl">
            <CardContent className="p-5">
              <div className="text-3xl font-bold tracking-tight text-amber-600">{counts.pending}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">Aguardando</div>
            </CardContent>
          </Card>
          <Card className="bg-card border border-border rounded-2xl">
            <CardContent className="p-5">
              <div className="text-3xl font-bold tracking-tight text-emerald-600">{counts.accepted}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">Aceitos</div>
            </CardContent>
          </Card>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
              <Icons.heart className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Você ainda não enviou convites</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Volte à busca, escolha um cuidador que combine com sua família e mande um convite. Eles respondem em até 24h.
            </p>
            <Link href="/family/dashboard">
              <Button size="lg" className="shadow-soft">Buscar cuidadores</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {items.map((m) => {
              const cg = getCg(m.caregiver)
              const prof = cg ? getProfile(cg.profiles) : null
              const meta = STATUS_META[m.status]
              const StatusIcon = Icons[meta.icon]
              const firstName = prof?.full_name?.split(' ')[0] || 'Cuidador'
              return (
                <Card key={m.id} className="border border-border rounded-2xl bg-card hover:shadow-soft transition-shadow overflow-hidden">
                  <CardContent className="p-5 flex gap-4">
                    <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden flex-shrink-0 ring-2 ring-border">
                      {prof?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={prof.avatar_url} alt={prof.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center font-bold text-muted-foreground">
                          {firstName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <Link href={`/caregiver/${cg?.user_id}`} className="font-bold text-lg hover:text-primary truncate">
                          {prof?.full_name}
                        </Link>
                        <Badge variant="outline" className={`gap-1 py-1 px-2 text-xs font-semibold flex-shrink-0 ${meta.badge}`}>
                          <StatusIcon className="w-3 h-3" /> {meta.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5 truncate">
                        {cg?.city} · R$ {cg?.hourly_rate}/h
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Enviado em {new Date(m.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>

                      {m.status === 'accepted' && (
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                            <Icons.chat className="w-4 h-4 mr-1.5" /> Conversar
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Icons.calendar className="w-4 h-4 mr-1.5" /> Agendar
                          </Button>
                        </div>
                      )}
                      {m.status === 'pending' && (
                        <div className="mt-3 text-xs text-muted-foreground bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                          Aguardando resposta. Você será notificado assim que houver atualização.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
