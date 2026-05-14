import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'

export const metadata = { title: 'Verificação · Admin' }

const LEVEL_LABEL: Record<string, string> = {
  companion: 'Acompanhante',
  basic: 'Cuidador Básico',
  technical: 'Téc. Enfermagem',
  nurse: 'Enfermeiro(a)',
}

export default async function AdminVerificationPage() {
  const supabase = createClient()

  const { data: pending } = await supabase
    .from('caregiver_profiles')
    .select(`
      id, user_id, level, coren_number, years_experience, certifications, created_at, verification_status,
      profiles:user_id (full_name, avatar_url, phone)
    `)
    .in('verification_status', ['pending', 'in_review'])
    .order('created_at', { ascending: true })
    .limit(50)

  const items = pending || []

  return (
    <div className="p-8 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-display-md">Fila de verificação</h1>
          <p className="text-muted-foreground mt-1">{items.length} cuidadores aguardando análise</p>
        </div>
        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1.5">
          SLA: 48h
        </Badge>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
            <Icons.check className="w-12 h-12 mx-auto text-secondary mb-3" />
            <h3 className="text-xl font-semibold mb-1">Tudo em dia! 🎉</h3>
            <p className="text-muted-foreground">Nenhum cuidador aguardando verificação no momento.</p>
          </div>
        ) : (
          items.map((c) => {
            const prof = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
            return (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden flex-shrink-0">
                    {prof?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={prof.avatar_url} alt={prof.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-xl font-bold text-muted-foreground">
                        {prof?.full_name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold">{prof?.full_name}</h3>
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                        {c.verification_status === 'in_review' ? 'Em análise' : 'Pendente'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {LEVEL_LABEL[c.level] || c.level} · {c.years_experience} anos · {prof?.phone || 'sem telefone'}
                    </p>
                    {c.coren_number && (
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md bg-secondary/10 text-secondary">
                        <Icons.verified className="w-3 h-3" /> COREN {c.coren_number}
                      </div>
                    )}
                    {c.certifications && c.certifications.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Certificações declaradas</div>
                        <ul className="space-y-1">
                          {c.certifications.map((cert: string) => (
                            <li key={cert} className="text-sm flex items-center gap-2">
                              <Icons.check className="w-3.5 h-3.5 text-muted-foreground" /> {cert}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-3">
                      Cadastrado em {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-auto md:min-w-[160px]">
                    <Link href={`/caregiver/${c.user_id}`}>
                      <Button variant="outline" className="w-full">Ver perfil</Button>
                    </Link>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      <Icons.check className="w-4 h-4 mr-1.5" /> Aprovar
                    </Button>
                    <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                      Recusar
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
