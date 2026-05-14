import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, Phone, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Meus Contatos | Cuide+',
  description: 'Acompanhe seus convites e converse com cuidadores.',
}

export default async function FamilyMatchesPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch matches requested by this family
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      status,
      created_at,
      caregiver_id,
      caregiver:caregiver_profiles!matches_caregiver_id_fkey(
         id,
         hourly_rate,
         city,
         profiles:id (full_name, avatar_url)
      )
    `)
    .eq('family_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch match err:', error);
  }

  return (
    <div className="container max-w-5xl py-10 px-4 md:px-8 mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
          Meus Convites e Contatos
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Acompanhe o status dos convites enviados aos cuidadores.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {matches && matches.length > 0 ? (
          matches.map((m) => {
            const isAccepted = m.status === 'accepted';
            const isPending = m.status === 'pending';
            const cg = m.caregiver;
            
            return (
              <Card key={m.id} className={`overflow-hidden border-2 ${isAccepted ? 'border-primary/50 bg-primary/5' : 'border-muted'}`}>
                <CardContent className="p-0">
                  <div className="p-5 flex gap-4">
                    <div className="h-16 w-16 bg-muted rounded-full overflow-hidden flex-shrink-0">
                      {cg?.profiles?.avatar_url ? (
                         <img src={cg.profiles.avatar_url} className="h-full w-full object-cover" alt="Profile" />
                       ) : (
                         <div className="h-full w-full bg-slate-200"></div>
                       )}
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex justify-between items-start">
                        <Link href={`/caregiver/${cg.id}`} className="font-bold text-lg hover:underline text-foreground">
                          {cg?.profiles?.full_name}
                        </Link>
                        {isAccepted ? (
                          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 border-none gap-1 py-1">
                            <CheckCircle2 className="w-3 h-3" /> Aceito
                          </Badge>
                        ) : isPending ? (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-none gap-1 py-1">
                            <Clock className="w-3 h-3" /> Pendente
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="opacity-50">Recusado</Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground mt-1">
                        {cg.city} • R$ {cg.hourly_rate}/h
                      </div>

                      {isAccepted && (
                        <div className="mt-4 flex gap-2">
                           <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
                              <MessageCircle className="w-4 h-4" /> WhatsApp
                           </Button>
                           <Button variant="outline" className="flex-1 gap-2 border-primary text-primary hover:bg-primary/5">
                              <Phone className="w-4 h-4" /> Ligar
                           </Button>
                        </div>
                      )}
                      
                      {isPending && (
                        <div className="mt-4 text-xs text-muted-foreground bg-background p-2 rounded border border-dashed">
                          Aguardando a resposta do cuidador. Voltaremos a notificar assim que houver atualização.
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-1 md:col-span-2 text-center py-20 bg-accent/5 rounded-xl border border-dashed border-accent/20">
             <h3 className="text-xl font-semibold mb-2">Você ainda não enviou convites</h3>
             <p className="text-muted-foreground mb-6">
               Volte ao Dashboard de Descoberta para visualizar os perfis dos cuidadores e enviar um convite de contato.
             </p>
             <Link href="/family/dashboard">
               <Button size="lg">Ir para Descoberta</Button>
             </Link>
          </div>
        )}
      </div>
    </div>
  )
}
