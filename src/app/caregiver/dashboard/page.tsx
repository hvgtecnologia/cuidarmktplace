import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { UserMenu } from '@/components/site/user-menu'
import { requireRole } from '@/server/http/guards'
import { getDashboard } from '@/server/domain/caregivers/caregivers.service'

export const metadata = {
  title: 'Visão geral · Cuidador',
  description: 'Seus números na plataforma.',
}

export default async function CaregiverDashboardPage() {
  // O layout já garantiu sessão + role 'caregiver'.
  const user = await requireRole(['caregiver'])
  const dash = await getDashboard(user.id)

  const {
    firstName, stats: caregiver, pendingCount,
    monthEarningsCents: monthEarnings, bookingCount, isPro,
  } = dash

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
          <nav className="flex items-center gap-1">
            <Link href="/caregiver/dashboard/matches">
              <Button variant="ghost" size="sm" className="gap-1.5 px-2 sm:px-3">
                <Icons.chat className="w-4 h-4" />
                <span className="hidden sm:inline">Convites</span>
              </Button>
            </Link>
            <Link href="/caregiver/profile">
              <Button variant="ghost" size="sm" className="gap-1.5 px-2 sm:px-3">
                <Icons.stethoscope className="w-4 h-4" />
                <span className="hidden sm:inline">Meu perfil</span>
              </Button>
            </Link>
            <Link href="/caregiver/dashboard/plans">
              <Button variant="ghost" size="sm" className="gap-1.5 px-2 sm:px-3">
                <Icons.sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Plano</span>
              </Button>
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="Notificações">
              <Icons.bell className="w-4 h-4" />
            </button>
            <UserMenu
              fullName={dash.fullName || 'Cuidador'}
              avatarUrl={dash.avatarUrl}
              email={user.email}
              role="caregiver"
            />
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
              {pendingCount > 0
                ? `Você tem ${pendingCount} ${pendingCount === 1 ? 'novo convite' : 'novos convites'} esperando resposta.`
                : 'Nenhum convite novo no momento. Mantenha seu perfil atualizado!'}
            </p>
          </div>
          <div className="flex gap-3">
            {pendingCount > 0 && (
              <Link href="/caregiver/dashboard/matches">
                <Button variant="outline">
                  <Icons.chat className="mr-1.5 w-4 h-4" /> Ver convites
                </Button>
              </Link>
            )}
            {!isPro && (
              <Link href="/caregiver/dashboard/plans">
                <Button className="shadow-soft gradient-primary hover:opacity-90">
                  <Icons.sparkles className="mr-1.5 w-4 h-4" /> Virar Pro
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="text-3xl font-bold tracking-tight text-primary">{pendingCount}</div>
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
              <div className="text-xs text-muted-foreground mt-0.5">{bookingCount} contratos</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
