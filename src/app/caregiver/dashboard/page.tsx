import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MatchActions } from './MatchActions'
import { Bell } from 'lucide-react'

type MatchRow = {
  id: string
  created_at: string
  family: { id: string; full_name: string } | { id: string; full_name: string }[] | null
}

function getFamilyName(family: MatchRow['family']): string {
  if (!family) return 'Família'
  if (Array.isArray(family)) return family[0]?.full_name || 'Família'
  return family.full_name || 'Família'
}

function MatchItem({ match }: { match: MatchRow }) {
  return (
    <Card className="mb-4 shadow-sm border border-muted bg-white">
      <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg text-primary">{getFamilyName(match.family)}</h3>
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-none">
              Pendente
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            Uma família se interessou pelo seu perfil. Aprove ou recuse este contato para liberar a comunicação.
          </p>
          <div className="flex gap-2 text-xs font-medium text-muted-foreground mt-2">
            <span>Solicitado em: {new Date(match.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
        <MatchActions matchId={match.id} />
      </CardContent>
    </Card>
  )
}

export const metadata = {
  title: 'Minhas Vagas (Convites) | Cuide+',
  description: 'Gerencie convites de famílias.',
}

export default async function CaregiverDashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      created_at,
      family:profiles!matches_family_id_fkey(full_name, id)
    `)
    .eq('caregiver_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch match err:', error)
  }

  const items = (matches as MatchRow[] | null) ?? []

  return (
    <div className="container max-w-4xl py-10 px-4 md:px-8 mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Bell className="w-7 h-7" /> Minhas Oportunidades
        </h1>
        <p className="text-muted-foreground mt-2">
          Veja as famílias que enviaram convites com base no seu perfil.
        </p>
      </div>

      <div className="space-y-4">
        {items.length > 0 ? (
          items.map((m) => <MatchItem key={m.id} match={m} />)
        ) : (
          <div className="text-center py-20 bg-accent/5 rounded-xl border border-dashed border-accent/20">
            <h3 className="text-xl font-semibold mb-2">Sem novos convites</h3>
            <p className="text-muted-foreground">
              No momento você não possui solicitações pendentes. Mantenha seu perfil 100% preenchido para receber mais convites.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
