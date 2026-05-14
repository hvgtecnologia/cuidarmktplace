import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'

export const metadata = { title: 'Famílias · Admin' }

export default async function AdminFamiliesPage() {
  const supabase = createClient()

  const { data: families } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, phone, is_active, created_at')
    .eq('role', 'family')
    .order('created_at', { ascending: false })
    .limit(100)

  const items = families || []

  // Counts of elderly profiles per family
  const { data: elderly } = await supabase
    .from('elderly_profiles')
    .select('family_id')

  const elderlyByFamily = new Map<string, number>()
  for (const row of (elderly || [])) {
    elderlyByFamily.set(row.family_id, (elderlyByFamily.get(row.family_id) || 0) + 1)
  }

  return (
    <div className="p-8 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-display-md">Famílias</h1>
        <p className="text-muted-foreground mt-1">{items.length} famílias cadastradas</p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/40 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3">Família</th>
              <th className="text-left px-5 py-3">Contato</th>
              <th className="text-center px-5 py-3">Idosos cadastrados</th>
              <th className="text-left px-5 py-3">Cadastrada em</th>
              <th className="text-center px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((f) => (
              <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex-shrink-0">
                      {f.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.avatar_url} alt={f.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-xs font-bold text-muted-foreground">
                          {f.full_name?.charAt(0).toUpperCase() || 'F'}
                        </div>
                      )}
                    </div>
                    <div className="font-semibold">{f.full_name}</div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{f.phone || '—'}</td>
                <td className="px-5 py-4 text-sm text-center">
                  <span className="inline-flex items-center gap-1.5">
                    <Icons.handHeart className="w-4 h-4 text-accent" />
                    {elderlyByFamily.get(f.id) || 0}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm">{new Date(f.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="px-5 py-4 text-center">
                  <Badge variant="outline" className={f.is_active ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-muted text-muted-foreground'}>
                    {f.is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Nenhuma família cadastrada ainda.</div>
        )}
      </div>
    </div>
  )
}
