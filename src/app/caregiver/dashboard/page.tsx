import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { MatchActions } from './MatchActions'

export const metadata = {
  title: 'Minhas oportunidades · Cuidador',
  description: 'Convites de famílias e suas estatísticas.',
}

type FamilyRel = { id: string; full_name: string; avatar_url: string | null }
type MatchRow = {
  id: string
  status: string
  created_at: string
  family: FamilyRel | FamilyRel[] | null
}

function getFamily(rel: MatchRow['family']): FamilyRel | null {
  if (!rel) return null
  return Array.isArray(rel) ? rel[0] : rel
}

export default async function CaregiverDashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: caregiver }, { data: matches }, { data: bookings }, { data: subscription }] = await Promise.all([
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
    supabase.from('caregiver_profiles').select('rating_average, rating_count, jobs_completed, hourly_rate, is_pro, verification_status').eq('user_id', user.id).single(),
    supabase
      .from('matches')
      .select('id, status, created_at, family:profiles!matches_family_id_fkey(id, full_name, avatar_url)')
      .eq('caregiver_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('bookings')
      .select('id, modality, start_at, total_cents, status')
      .eq('caregiver_id', user.id)
      .gte('start_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('start_at', { ascending: false }),
    supabase.from('subscriptions').select('plan, status').eq('user_id', user.id).single(),
  ])

  const items = (matches as MatchRow[] | null) ?? []
  const pendingItems = items.filter((m) => m.status === 'pending')
  const acceptedItems = items.filter((m) => m.status === 'accepted')

  const monthEarnings = (bookings || []).reduce((sum, b) => sum + ((b as { total_cents?: number }).total_cents || 0), 0)
  const firstName = profile?.full_name?.split(' ')[0] || 'Cuidador'
  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active'

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary text-white">
              <Icons.logo className="w-5 h-5" />
            </span>
            <span className="text-lg font-bold">Cuide<span className="text-primary">+</span></span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Link href="/caregiver/dashboard"><Button variant="ghost" size="sm">Convites</Button></Link>
            <Link href="/caregiver/profile"><Button variant="ghost" size="sm">Meu perfil</Button></Link>
            <Link href="/caregiver/dashboard/plans"><Button variant="ghost" size="sm">Plano</Button></Link>
          </nav>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="Notificações">
              <Icons.bell className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-full gradient-primary text-white grid place-items-center text-sm font-bold">
              {firstName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 lg:py-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-display-md text-balance">
              Oi, <span className="gradient-text">{firstName}</span> 👋
            </h1>
            <p className="mt-1 text-muted-foreground text-lg">
              {pendingItems.length > 0
                ? `Você tem ${pendingItems.length} ${pendingItems.length === 1 ? 'novo convite' : 'novos convites'} esperando resposta.`
                : 'Nenhum convite novo no momento. Mantenha seu perfil atualizado!'}
            </p>
          </div>
          {!isPro && (
            <Link href="/caregiver/dashboard/plans">
              <Button className="shadow-soft gradient-primary hover:opacity-90">
                <Icons.sparkles className="mr-1.5 w-4 h-4" /> Virar Pro
              </Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border border-border bg-card rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <Icons.star className="w-3.5 h-3.5 text-highlight" /> Avaliação
              </div>
              <div className="text-3xl font-bold tracking-tight">
                {caregiver?.rating_average ? caregiver.rating_average.toFixed(1) : '—'}
                <span className="text-base text-muted-foreground font-medium ml-1">/5</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{caregiver?.rating_count || 0} avaliações</div>
            </CardContent>
          </Card>
          <Card className="border border-border bg-card rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <Icons.check className="w-3.5 h-3.5 text-secondary" /> Trabalhos
              </div>
              <div className="text-3xl font-bold tracking-tight">{caregiver?.jobs_completed || 0}</div>
              <div className="text-xs text-muted-foreground mt-0.5">no total</div>
            </CardContent>
          </Card>
          <Card className="border border-border bg-card rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <Icons.handHeart className="w-3.5 h-3.5 text-primary" /> Convites
              </div>
              <div className="text-3xl font-bold tracking-tight text-primary">{pendingItems.length}</div>
              <div className="text-xs text-muted-foreground mt-0.5">aguardando resposta</div>
            </CardContent>
          </Card>
          <Card className="border border-border bg-card rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                <Icons.card className="w-3.5 h-3.5 text-accent" /> Receita 30d
              </div>
              <div className="text-2xl font-bold tracking-tight gradient-text">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(monthEarnings / 100)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{(bookings || []).length} contratos</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending invites */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Convites pendentes</h2>
            <span className="text-sm text-muted-foreground">{pendingItems.length} aguardando</span>
          </div>
          {pendingItems.length === 0 ? (
            <Card className="border border-dashed border-border bg-card rounded-2xl">
              <CardContent className="p-10 text-center">
                <Icons.bell className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Sem convites novos. Verifique se seu perfil está 100% completo para aparecer melhor nas buscas.</p>
                <Link href="/caregiver/profile" className="inline-block mt-4">
                  <Button variant="outline">Editar perfil</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingItems.map((m) => {
                const fam = getFamily(m.family)
                return (
                  <Card key={m.id} className="border border-border bg-card rounded-2xl">
                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                          {fam?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={fam.avatar_url} alt={fam.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full grid place-items-center font-bold text-muted-foreground">
                              {fam?.full_name?.charAt(0).toUpperCase() || 'F'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold">{fam?.full_name || 'Família'}</h3>
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                              <Icons.clock className="w-3 h-3 mr-1" /> Novo
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Recebido em {new Date(m.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <MatchActions matchId={m.id} />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        {/* Active relationships */}
        {acceptedItems.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">Famílias ativas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {acceptedItems.map((m) => {
                const fam = getFamily(m.family)
                return (
                  <Card key={m.id} className="border border-emerald-200 bg-emerald-50/40 rounded-2xl">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white overflow-hidden flex-shrink-0">
                        {fam?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={fam.avatar_url} alt={fam.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center font-bold text-muted-foreground">
                            {fam?.full_name?.charAt(0).toUpperCase() || 'F'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate">{fam?.full_name}</h3>
                        <p className="text-xs text-emerald-700 font-medium mt-0.5">Conexão ativa</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-emerald-300">
                        <Icons.chat className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
