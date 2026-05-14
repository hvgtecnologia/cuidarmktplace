import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, MapPin, Clock, CalendarDays, Star, Info } from 'lucide-react'
import { CARE_TAGS, SCHEDULES } from '@/constants/care-tags'
import { DAYS_OF_WEEK } from '@/components/forms/caregiver/CaregiverProfileForm'

export default async function PublicCaregiverProfile({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  // Security checks: Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get Caregiver Base Profile and Auth Profile combination (full_name from auth profiles)
  // RLS will automatically reject if it's not verified (unless it's the caregiver reading their own profile)
  // See "Família vê perfis verificados e ativos" policy
  
  const { data: caregiver, error } = await supabase
    .from('caregiver_profiles')
    .select(`
      *,
      profiles:id (full_name, avatar_url, is_active)
    `)
    .eq('id', params.id)
    .single()

  if (error || !caregiver || !caregiver.profiles?.is_active) {
    notFound()
  }

  // Format array fields for display
  const renderTags = (tags: string[], mapFunc: (v: string) => string | undefined) => {
    if (!tags || tags.length === 0) return <span className="text-muted-foreground italic">Não informado</span>
    return tags.map(t => {
      const label = mapFunc(t)
      return label ? (
        <Badge key={t} variant="secondary" className="px-3 py-1 font-medium bg-secondary/15 text-secondary border-none">
          {label}
        </Badge>
      ) : null
    })
  }

  const getTagLabel = (val: string) => CARE_TAGS.find(t => t.value === val)?.label
  const getScheduleLabel = (val: string) => SCHEDULES.find(s => s.value === val)?.label
  const getDayLabel = (val: string) => DAYS_OF_WEEK.find(d => d.value === val)?.label

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary pt-12 pb-24 shadow-sm relative overflow-hidden">
        {/* Abstract background shape for visual appeal */}
        <div className="absolute top-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        <div className="container max-w-5xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="h-32 w-32 md:h-40 md:w-40 bg-zinc-200 rounded-full border-4 border-background shadow-lg overflow-hidden flex-shrink-0">
            {/* When avatar uploads are ready, insert image here */}
            {caregiver.profiles?.avatar_url ? (
              <img src={caregiver.profiles.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                 Sem Foto
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left text-primary-foreground">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h1 className="text-3xl tracking-tight font-bold">{caregiver.profiles?.full_name}</h1>
              {caregiver.verification_status === 'approved' && (
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none fit-content mx-auto md:mx-0 shadow-sm gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verificado
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-primary-foreground/90 font-medium">
               <div className="flex items-center gap-1">
                 <MapPin className="w-4 h-4" /> {caregiver.neighborhood}, {caregiver.city}
               </div>
               <div className="flex items-center gap-1">
                 <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 
                 {caregiver.rating_count > 0 ? (
                   <span>{caregiver.rating_average} ({caregiver.rating_count} avaliações)</span>
                 ) : (
                   <span>Novo por aqui</span>
                 )}
               </div>
            </div>
          </div>

          <div className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm self-stretch md:self-auto flex items-center justify-center">
             <div className="text-center text-white">
                <p className="text-sm font-medium opacity-80 uppercase tracking-widest">Valor/Hora</p>
                <div className="text-2xl font-bold flex items-baseline gap-1">
                  <span className="text-lg">R$</span> {caregiver.hourly_rate}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 -mt-8 relative z-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-md border-none ring-1 ring-black/5">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">Sobre mim</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-lg">
                  {caregiver.bio || "Este profissional ainda não adicionou uma descrição."}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md border-none ring-1 ring-black/5">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                   Habilidades e Especialidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="flex flex-wrap gap-2">
                   {renderTags(caregiver.specialties, getTagLabel)}
                 </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-none ring-1 ring-black/5">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                   Avaliações ({caregiver.rating_count})
                </CardTitle>
              </CardHeader>
              <CardContent>
                 {caregiver.rating_count === 0 ? (
                   <div className="p-8 text-center bg-muted/30 rounded-lg border border-dashed">
                      <p className="text-muted-foreground">Em breve... O profissional não possui avaliações ainda.</p>
                   </div>
                 ) : (
                   <p className="text-muted-foreground">Avaliações detalhadas serão exibidas aqui.</p>
                 )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-md border-none ring-1 ring-black/5 bg-accent/5 overflow-hidden">
               <div className="h-1.5 w-full bg-accent"></div>
               <CardHeader>
                  <CardTitle className="text-xl tracking-tight text-foreground">Disponibilidade</CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                 <div>
                   <div className="flex items-center gap-2 font-semibold mb-3 text-secondary-foreground">
                      <CalendarDays className="h-4 w-4" /> Dias
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {renderTags(caregiver.available_days, getDayLabel)}
                   </div>
                 </div>
                 
                 <div className="h-px w-full bg-border"></div>

                 <div>
                    <div className="flex items-center gap-2 font-semibold mb-3 text-secondary-foreground">
                      <Clock className="h-4 w-4" /> Turnos
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {renderTags(caregiver.available_shifts, getScheduleLabel)}
                    </div>
                 </div>
               </CardContent>
            </Card>

            <Card className="shadow-sm border border-muted bg-muted/20">
               <CardContent className="p-4 flex gap-3 text-sm text-muted-foreground">
                 <Info className="w-6 h-6 flex-shrink-0 text-primary" />
                 Para combinar um serviço com {caregiver.profiles?.full_name?.split(' ')[0]}, encontre o perfil dele através do motor de Swipe na Plataforma da Família e clique em <b>&quot;Like&quot;</b>.
               </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}
