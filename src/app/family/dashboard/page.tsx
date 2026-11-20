import Link from 'next/link'
import { CaregiverList } from '@/components/dashboard/CaregiverList'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/site/user-menu'
import { requireRole } from '@/server/http/guards'
import * as profiles from '@/server/domain/profiles/profiles.repository'
import * as elderlyRepo from '@/server/domain/elderly/elderly.repository'

export const metadata = {
  title: 'Encontre cuidadores',
  description: 'Descubra cuidadores verificados próximos de você.',
}

export default async function FamilyDashboardPage() {
  // O layout de /family já garantiu sessão + role 'family'.
  const user = await requireRole(['family'])
  const [familyObj, elderlyRows] = await Promise.all([
    profiles.findById(user.id),
    elderlyRepo.findByFamily(user.id),
  ])

  // Passadas ao convite: é a ficha escolhida que define bairro, serviço e sexo
  // mostrados ao cuidador. Só os campos da escolha — a ficha completa fica aqui.
  const elderly = (elderlyRows ?? []).map((e) => ({
    id: e.id as string,
    name: e.name as string,
    neighborhood: (e.neighborhood as string) ?? null,
    city: (e.city as string) ?? null,
  }))

  const firstName = familyObj?.full_name?.split(' ')[0] || 'Família'

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top header bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary text-white">
              <Icons.logo className="w-5 h-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              Cuide<span className="text-primary">+</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/family/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5 px-2 sm:px-3">
                <Icons.search className="w-4 h-4" />
                <span className="hidden sm:inline">Buscar</span>
              </Button>
            </Link>
            <Link href="/family/dashboard/matches">
              <Button variant="ghost" size="sm" className="gap-1.5 px-2 sm:px-3">
                <Icons.chat className="w-4 h-4" />
                <span className="hidden sm:inline">Meus convites</span>
              </Button>
            </Link>
            <Link href="/family/elderly/new">
              <Button variant="ghost" size="sm" className="gap-1.5 px-2 sm:px-3">
                <Icons.handHeart className="w-4 h-4" />
                <span className="hidden sm:inline">Cadastrar idoso</span>
              </Button>
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 grid place-items-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Notificações">
              <Icons.bell className="w-4 h-4" />
            </button>
            <UserMenu
              fullName={familyObj?.full_name || 'Família'}
              avatarUrl={familyObj?.avatar_url}
              email={user.email}
              role="family"
            />
          </div>
        </div>
      </header>

      <main className="container py-8 lg:py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-display-md text-balance">
            Olá, <span className="gradient-text">{firstName}</span> 👋
          </h1>
          <p className="mt-2 text-muted-foreground text-lg max-w-2xl">
            Aqui estão os cuidadores verificados que mais combinam com você. Use os filtros para refinar a busca.
          </p>
        </div>

        <CaregiverList elderly={elderly} />
      </main>
    </div>
  )
}
