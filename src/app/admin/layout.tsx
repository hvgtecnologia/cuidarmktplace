import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Icons } from '@/components/icons'
import { UserMenu } from '@/components/site/user-menu'

const NAV = [
  { href: '/admin', label: 'Visão geral', icon: 'sparkles' as const },
  { href: '/admin/caregivers', label: 'Cuidadores', icon: 'stethoscope' as const },
  { href: '/admin/families', label: 'Famílias', icon: 'handHeart' as const },
  { href: '/admin/bookings', label: 'Contratos', icon: 'calendar' as const },
  { href: '/admin/payments', label: 'Pagamentos', icon: 'card' as const },
  { href: '/admin/reviews', label: 'Avaliações', icon: 'star' as const },
  { href: '/admin/verification', label: 'Verificação', icon: 'shield' as const },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/family/dashboard')
  }

  return (
    <div className="min-h-screen bg-muted/20 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary text-white">
              <Icons.logo className="w-5 h-5" />
            </span>
            <div>
              <div className="text-sm font-bold leading-tight">Cuide+</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Admin</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((item) => {
            const Icon = Icons[item.icon]
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <UserMenu
            fullName={profile?.full_name || 'Admin'}
            avatarUrl={profile?.avatar_url}
            email={user.email}
            role="admin"
          />
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="lg:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 h-14">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid place-items-center w-8 h-8 rounded-lg gradient-primary text-white">
              <Icons.logo className="w-4 h-4" />
            </span>
            <span className="text-sm font-bold">Cuide+ Admin</span>
          </Link>
          <UserMenu
            fullName={profile?.full_name || 'Admin'}
            avatarUrl={profile?.avatar_url}
            email={user.email}
            role="admin"
          />
        </div>
        {children}
      </main>
    </div>
  )
}
