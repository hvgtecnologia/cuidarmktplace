import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'

export const metadata = { title: 'Cuidadores · Admin' }

const STATUS_BADGE: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  in_review: 'bg-blue-100 text-blue-800 border-blue-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
}

const STATUS_LABEL: Record<string, string> = {
  approved: 'Aprovado',
  pending: 'Pendente',
  in_review: 'Em análise',
  rejected: 'Recusado',
}

const LEVEL_LABEL: Record<string, string> = {
  companion: 'Acompanhante',
  basic: 'Básico',
  technical: 'Téc. Enf.',
  nurse: 'Enfermeiro(a)',
}

export default async function AdminCaregiversPage() {
  const supabase = createClient()

  const { data: caregivers } = await supabase
    .from('caregiver_profiles')
    .select(`
      id, user_id, level, hourly_rate, city, state, rating_average, rating_count,
      jobs_completed, verification_status, is_pro, is_featured, created_at,
      profiles:user_id (full_name, avatar_url, phone)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const items = caregivers || []
  const byStatus = {
    approved: items.filter((c) => c.verification_status === 'approved').length,
    pending: items.filter((c) => c.verification_status === 'pending').length,
    pro: items.filter((c) => c.is_pro).length,
  }

  return (
    <div className="p-8 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-display-md">Cuidadores</h1>
          <p className="text-muted-foreground mt-1">{items.length} profissionais na plataforma</p>
        </div>
        <Button>
          <Icons.search className="w-4 h-4 mr-1.5" /> Buscar
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aprovados</div>
          <div className="text-3xl font-bold mt-2 text-emerald-600">{byStatus.approved}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pendentes</div>
          <div className="text-3xl font-bold mt-2 text-amber-600">{byStatus.pending}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pro</div>
          <div className="text-3xl font-bold mt-2 text-primary">{byStatus.pro}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/40 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Cuidador</th>
              <th className="text-left px-5 py-3">Nível</th>
              <th className="text-left px-5 py-3">Cidade</th>
              <th className="text-right px-5 py-3">Hora</th>
              <th className="text-center px-5 py-3">Rating</th>
              <th className="text-center px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((c) => {
              const prof = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
              const firstName = prof?.full_name?.split(' ')[0] || 'C'
              return (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex-shrink-0">
                        {prof?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={prof.avatar_url} alt={prof.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-xs font-bold text-muted-foreground">
                            {firstName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/caregiver/${c.user_id}`} className="font-semibold hover:text-primary truncate block">
                          {prof?.full_name}
                          {c.is_pro && <Badge variant="outline" className="ml-1.5 text-[9px] px-1 py-0 bg-primary/10 text-primary border-primary/30">PRO</Badge>}
                          {c.is_featured && <Badge variant="outline" className="ml-1.5 text-[9px] px-1 py-0 bg-highlight/20 text-foreground border-highlight">DESTAQUE</Badge>}
                        </Link>
                        <div className="text-xs text-muted-foreground">{prof?.phone || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm">{LEVEL_LABEL[c.level] || c.level}</td>
                  <td className="px-5 py-4 text-sm">{c.city}{c.state ? `/${c.state}` : ''}</td>
                  <td className="px-5 py-4 text-sm text-right font-semibold">R$ {c.hourly_rate}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold">
                      <Icons.star className="w-3.5 h-3.5 fill-highlight text-highlight" />
                      {c.rating_average?.toFixed(1) || '—'}
                      <span className="text-xs text-muted-foreground font-normal">({c.rating_count})</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Badge variant="outline" className={`text-xs ${STATUS_BADGE[c.verification_status] || ''}`}>
                      {STATUS_LABEL[c.verification_status] || c.verification_status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/caregiver/${c.user_id}`}>
                      <Button size="sm" variant="ghost">Ver</Button>
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
