import { createClient } from '@/lib/supabase/server'
import { Icons, type IconKey } from '@/components/icons'

export const metadata = { title: 'Visão geral · Admin' }

async function getMetrics() {
  const supabase = createClient()
  const [{ count: totalCaregivers }, { count: pendingVerifications }, { count: totalFamilies }, { count: totalMatches }, { count: activeBookings }] =
    await Promise.all([
      supabase.from('caregiver_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('caregiver_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'family'),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'in_progress']),
    ])
  return {
    totalCaregivers: totalCaregivers ?? 0,
    pendingVerifications: pendingVerifications ?? 0,
    totalFamilies: totalFamilies ?? 0,
    totalMatches: totalMatches ?? 0,
    activeBookings: activeBookings ?? 0,
  }
}

export default async function AdminHome() {
  const metrics = await getMetrics().catch(() => null)
  const safe = metrics || { totalCaregivers: 0, pendingVerifications: 0, totalFamilies: 0, totalMatches: 0, activeBookings: 0 }

  const cards: Array<{ label: string; value: string; sub: string; icon: IconKey; tone: 'primary' | 'secondary' | 'accent' | 'highlight' }> = [
    { label: 'Cuidadores ativos', value: String(safe.totalCaregivers), sub: '+12% vs mês anterior', icon: 'stethoscope', tone: 'primary' },
    { label: 'Verificações pendentes', value: String(safe.pendingVerifications), sub: 'aguardando análise', icon: 'shield', tone: 'highlight' },
    { label: 'Famílias cadastradas', value: String(safe.totalFamilies), sub: '+24% vs mês anterior', icon: 'handHeart', tone: 'secondary' },
    { label: 'Convites enviados', value: String(safe.totalMatches), sub: 'todos os tempos', icon: 'sparkles', tone: 'accent' },
    { label: 'Contratos ativos', value: String(safe.activeBookings), sub: 'em execução agora', icon: 'calendar', tone: 'primary' },
  ]

  return (
    <div className="p-8 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-display-md">Visão geral</h1>
        <p className="text-muted-foreground mt-1">Acompanhamento em tempo real da operação Cuide+.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
        {cards.map((c) => {
          const Icon = Icons[c.icon]
          const toneMap = {
            primary: 'bg-primary/10 text-primary',
            secondary: 'bg-secondary/10 text-secondary',
            accent: 'bg-accent/10 text-accent',
            highlight: 'bg-highlight/15 text-highlight',
          }
          return (
            <div key={c.label} className="bg-card border border-border rounded-2xl p-5 hover:shadow-soft transition-shadow">
              <div className={`w-10 h-10 rounded-xl grid place-items-center mb-3 ${toneMap[c.tone]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-3xl font-bold tracking-tight">{c.value}</div>
              <div className="mt-1 text-sm font-semibold">{c.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.sub}</div>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">GMV mensal</h2>
            <span className="text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-md">+18.4%</span>
          </div>
          <div className="text-4xl font-bold tracking-tight gradient-text">R$ 284.500</div>
          <p className="mt-1 text-sm text-muted-foreground">Volume total de transações no mês</p>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Take rate</div>
              <div className="text-lg font-bold mt-1">15%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Receita</div>
              <div className="text-lg font-bold mt-1">R$ 42.6k</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Ticket médio</div>
              <div className="text-lg font-bold mt-1">R$ 3.2k</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">Próximas ações</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm">
              <span className="w-2 h-2 rounded-full bg-highlight mt-2 flex-shrink-0" />
              <div>
                <div className="font-semibold">{safe.pendingVerifications} verificações pendentes</div>
                <div className="text-xs text-muted-foreground">Análise de documentos e antecedentes</div>
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div>
                <div className="font-semibold">3 disputas abertas</div>
                <div className="text-xs text-muted-foreground">Mediação família-cuidador</div>
              </div>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0" />
              <div>
                <div className="font-semibold">12 saques solicitados</div>
                <div className="text-xs text-muted-foreground">Liberação de pagamentos a cuidadores</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
