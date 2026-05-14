import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Contratos · Admin' }

const MODALITY_LABEL: Record<string, string> = {
  hourly: 'Hora avulsa',
  half_day: 'Meio período',
  day_shift: 'Plantão diurno',
  night_shift: 'Plantão noturno',
  overnight: 'Pernoite',
  full_24h: '24 horas',
  monthly: 'Mensalista',
}

const STATUS_BADGE: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-primary/10 text-primary border-primary/20',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-muted text-muted-foreground border-border',
  disputed: 'bg-rose-100 text-rose-700 border-rose-200',
}

const STATUS_LABEL: Record<string, string> = {
  requested: 'Solicitado',
  confirmed: 'Confirmado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  disputed: 'Em disputa',
}

function brl(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export default async function AdminBookingsPage() {
  const supabase = createClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, modality, start_at, end_at, hours, rate, total_cents, platform_fee_cents, status, created_at,
      family:profiles!bookings_family_id_fkey(full_name),
      caregiver:profiles!bookings_caregiver_id_fkey(full_name)
    `)
    .order('start_at', { ascending: false })
    .limit(100)

  const items = bookings || []
  const totalGmv = items.reduce((s, b) => s + ((b as { total_cents?: number }).total_cents || 0), 0)
  const totalFee = items.reduce((s, b) => s + ((b as { platform_fee_cents?: number }).platform_fee_cents || 0), 0)

  return (
    <div className="p-8 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-display-md">Contratos</h1>
        <p className="text-muted-foreground mt-1">Histórico de bookings (escrow) intermediados pela plataforma</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">GMV total</div>
          <div className="text-3xl font-bold mt-2 gradient-text">{brl(totalGmv)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{items.length} contratos</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Receita Cuide+</div>
          <div className="text-3xl font-bold mt-2 text-secondary">{brl(totalFee)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">15% take rate</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ticket médio</div>
          <div className="text-3xl font-bold mt-2">{items.length > 0 ? brl(totalGmv / items.length) : 'R$ 0'}</div>
          <div className="text-xs text-muted-foreground mt-0.5">por contrato</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/40 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Família</th>
              <th className="text-left px-5 py-3">Cuidador</th>
              <th className="text-left px-5 py-3">Modalidade</th>
              <th className="text-left px-5 py-3">Início</th>
              <th className="text-right px-5 py-3">Horas</th>
              <th className="text-right px-5 py-3">Total</th>
              <th className="text-right px-5 py-3">Taxa</th>
              <th className="text-center px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((b) => {
              const fam = Array.isArray(b.family) ? b.family[0] : b.family
              const cg = Array.isArray(b.caregiver) ? b.caregiver[0] : b.caregiver
              return (
                <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium">{fam?.full_name || '—'}</td>
                  <td className="px-5 py-3 text-sm">{cg?.full_name || '—'}</td>
                  <td className="px-5 py-3 text-sm">{MODALITY_LABEL[b.modality] || b.modality}</td>
                  <td className="px-5 py-3 text-sm">{new Date(b.start_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-5 py-3 text-sm text-right">{b.hours}</td>
                  <td className="px-5 py-3 text-sm text-right font-semibold">{brl(b.total_cents)}</td>
                  <td className="px-5 py-3 text-sm text-right text-secondary font-semibold">{brl(b.platform_fee_cents)}</td>
                  <td className="px-5 py-3 text-center">
                    <Badge variant="outline" className={`text-xs ${STATUS_BADGE[b.status] || ''}`}>
                      {STATUS_LABEL[b.status] || b.status}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Sem contratos ainda. Quando famílias contratarem, aparecem aqui.</div>
        )}
      </div>
    </div>
  )
}
