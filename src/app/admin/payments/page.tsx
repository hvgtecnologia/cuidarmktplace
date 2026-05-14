import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'

export const metadata = { title: 'Pagamentos · Admin' }

const STATUS_BADGE: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  failed: 'bg-rose-100 text-rose-700 border-rose-200',
  refunded: 'bg-muted text-muted-foreground border-border',
}

function brl(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export default async function AdminPaymentsPage() {
  const supabase = createClient()

  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount_cents, currency, status, description, paid_at, created_at, user:profiles!payments_user_id_fkey(full_name, role)')
    .order('created_at', { ascending: false })
    .limit(100)

  const items = payments || []
  const stats = {
    paid: items.filter((p) => p.status === 'paid').reduce((s, p) => s + (p.amount_cents || 0), 0),
    pending: items.filter((p) => p.status === 'pending').reduce((s, p) => s + (p.amount_cents || 0), 0),
    failed: items.filter((p) => p.status === 'failed').length,
  }

  return (
    <div className="p-8 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-display-md">Pagamentos</h1>
        <p className="text-muted-foreground mt-1">Histórico financeiro da operação</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            <Icons.check className="w-3.5 h-3.5" /> Recebidos
          </div>
          <div className="text-3xl font-bold mt-2 text-emerald-600">{brl(stats.paid)}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider">
            <Icons.clock className="w-3.5 h-3.5" /> Aguardando
          </div>
          <div className="text-3xl font-bold mt-2 text-amber-600">{brl(stats.pending)}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 uppercase tracking-wider">
            <Icons.close className="w-3.5 h-3.5" /> Falhas
          </div>
          <div className="text-3xl font-bold mt-2 text-rose-600">{stats.failed}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/40 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Usuário</th>
              <th className="text-left px-5 py-3">Tipo</th>
              <th className="text-left px-5 py-3">Descrição</th>
              <th className="text-right px-5 py-3">Valor</th>
              <th className="text-left px-5 py-3">Data</th>
              <th className="text-center px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((p) => {
              const user = Array.isArray(p.user) ? p.user[0] : p.user
              return (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3 text-sm font-medium">{user?.full_name || '—'}</td>
                  <td className="px-5 py-3 text-sm">
                    <Badge variant="outline" className="text-xs">{user?.role === 'caregiver' ? 'Cuidador' : 'Família'}</Badge>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{p.description || '—'}</td>
                  <td className="px-5 py-3 text-sm text-right font-semibold">{brl(p.amount_cents)}</td>
                  <td className="px-5 py-3 text-sm">{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="px-5 py-3 text-center">
                    <Badge variant="outline" className={`text-xs ${STATUS_BADGE[p.status] || ''}`}>
                      {p.status}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Nenhum pagamento ainda. Integração Stripe em andamento.</div>
        )}
      </div>
    </div>
  )
}
