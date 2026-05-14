import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Icons, type IconKey } from '@/components/icons'
import { InvitePanel } from './InviteButton'
import {
  CARE_TAGS,
  SCHEDULES,
  SERVICE_MODALITIES,
} from '@/constants/care-tags'

const DAYS_OF_WEEK = [
  { value: 'mon', label: 'Seg' },
  { value: 'tue', label: 'Ter' },
  { value: 'wed', label: 'Qua' },
  { value: 'thu', label: 'Qui' },
  { value: 'fri', label: 'Sex' },
  { value: 'sat', label: 'Sáb' },
  { value: 'sun', label: 'Dom' },
]

function formatBRL(value: number | null | undefined) {
  if (!value) return null
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const LEVEL_LABEL: Record<string, string> = {
  companion: 'Acompanhante',
  basic: 'Cuidador Formação Básica',
  technical: 'Técnico de Enfermagem',
  nurse: 'Enfermeiro(a)',
}

export default async function PublicCaregiverProfile({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // params.id is the user_id from CaregiverList card link
  const { data: caregiver, error } = await supabase
    .from('caregiver_profiles')
    .select(`
      id,
      user_id,
      bio,
      level,
      years_experience,
      specialties,
      certifications,
      coren_number,
      hourly_rate,
      half_day_rate,
      day_shift_rate,
      night_shift_rate,
      overnight_rate,
      full_24h_rate,
      monthly_rate,
      offered_modalities,
      available_days,
      available_shifts,
      service_radius_km,
      city,
      neighborhood,
      state,
      rating_average,
      rating_count,
      jobs_completed,
      verification_status,
      verified_at,
      is_pro,
      is_featured,
      profiles:user_id (full_name, avatar_url, is_active, phone)
    `)
    .eq('user_id', params.id)
    .single()

  if (error || !caregiver) notFound()

  // Supabase relation can come as object or array depending on FK config
  const profile = Array.isArray(caregiver.profiles) ? caregiver.profiles[0] : caregiver.profiles
  if (!profile?.is_active) notFound()

  // Reviews recentes
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, reviewer:reviewer_id (full_name, avatar_url)')
    .eq('caregiver_id', caregiver.user_id)
    .order('created_at', { ascending: false })
    .limit(6)

  const firstName = profile.full_name?.split(' ')[0] || 'Cuidador'
  const levelLabel = LEVEL_LABEL[caregiver.level] || 'Cuidador'

  // Pricing tiers (only with values)
  const tiers = [
    { key: 'hourly_rate',      label: 'Hora avulsa',          per: '/hora',    val: caregiver.hourly_rate,       icon: 'clock' as IconKey },
    { key: 'half_day_rate',    label: 'Meio período (6h)',    per: '/turno',   val: caregiver.half_day_rate,     icon: 'sun' as IconKey },
    { key: 'day_shift_rate',   label: 'Plantão diurno (12h)', per: '/plantão', val: caregiver.day_shift_rate,    icon: 'sun' as IconKey },
    { key: 'night_shift_rate', label: 'Plantão noturno (12h)',per: '/plantão', val: caregiver.night_shift_rate,  icon: 'moon' as IconKey },
    { key: 'overnight_rate',   label: 'Pernoite',             per: '/noite',   val: caregiver.overnight_rate,    icon: 'moon' as IconKey },
    { key: 'full_24h_rate',    label: '24 horas',             per: '/dia',     val: caregiver.full_24h_rate,     icon: 'shield' as IconKey },
    { key: 'monthly_rate',     label: 'Mensalista 12x36',     per: '/mês',     val: caregiver.monthly_rate,      icon: 'calendar' as IconKey },
  ].filter((t) => t.val && t.val > 0)

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/family/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Icons.arrowRight className="w-4 h-4 rotate-180" /> Voltar à busca
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary text-white">
              <Icons.logo className="w-5 h-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">Cuide<span className="text-primary">+</span></span>
          </Link>
        </div>
      </header>

      {/* Hero header */}
      <div className="relative overflow-hidden gradient-primary text-white">
        <div className="absolute inset-0 opacity-20 bg-grid" />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="container relative pt-12 pb-28">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-2xl border-4 border-white/40 shadow-2xl overflow-hidden flex-shrink-0 bg-white/10">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-5xl font-bold text-white/70">
                  {firstName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-4xl font-bold tracking-tight">{profile.full_name}</h1>
                {caregiver.verification_status === 'approved' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-bold">
                    <Icons.verified className="w-3.5 h-3.5" /> Verificado
                  </span>
                )}
                {caregiver.is_pro && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-highlight text-foreground text-xs font-bold">
                    <Icons.sparkles className="w-3.5 h-3.5" /> Pro
                  </span>
                )}
              </div>
              <div className="mt-2 text-white/90 font-medium">
                {levelLabel}
                {caregiver.coren_number && <span className="opacity-80"> · COREN {caregiver.coren_number}</span>}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-white/90">
                <span className="inline-flex items-center gap-1"><Icons.pin className="w-4 h-4" /> {caregiver.neighborhood}, {caregiver.city}{caregiver.state ? `/${caregiver.state}` : ''}</span>
                <span className="inline-flex items-center gap-1">
                  <Icons.star className="w-4 h-4 fill-highlight text-highlight" />
                  {caregiver.rating_count > 0 ? `${caregiver.rating_average} (${caregiver.rating_count})` : 'Novo na plataforma'}
                </span>
                {caregiver.years_experience > 0 && (
                  <span>{caregiver.years_experience}+ anos de experiência</span>
                )}
                {caregiver.jobs_completed > 0 && (
                  <span>{caregiver.jobs_completed} trabalhos concluídos</span>
                )}
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end">
              <InvitePanel caregiverUserId={caregiver.user_id} caregiverName={profile.full_name} />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container -mt-20 relative pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Card className="border border-border bg-card rounded-2xl shadow-sm">
              <CardContent className="p-7">
                <h2 className="text-xl font-bold mb-4">Sobre {firstName}</h2>
                <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {caregiver.bio || 'Este profissional ainda não escreveu uma descrição.'}
                </p>
              </CardContent>
            </Card>

            {/* Pricing tiers */}
            {tiers.length > 0 && (
              <Card className="border border-border bg-card rounded-2xl shadow-sm">
                <CardContent className="p-7">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold">Modalidades e valores</h2>
                    <span className="text-xs text-muted-foreground">Pagamento intermediado pela plataforma</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {tiers.map((t) => {
                      const Icon = Icons[t.icon]
                      return (
                        <div key={t.key} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-muted/30 hover:border-primary/40 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 grid place-items-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate">{t.label}</div>
                              <div className="text-xs text-muted-foreground">a partir de</div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg font-bold tracking-tight">{formatBRL(t.val)}</div>
                            <div className="text-[11px] text-muted-foreground">{t.per}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Specialties */}
            {caregiver.specialties && caregiver.specialties.length > 0 && (
              <Card className="border border-border bg-card rounded-2xl shadow-sm">
                <CardContent className="p-7">
                  <h2 className="text-xl font-bold mb-4">Especialidades</h2>
                  <div className="flex flex-wrap gap-2">
                    {caregiver.specialties.map((s: string) => {
                      const tag = CARE_TAGS.find((t) => t.value === s)
                      return (
                        <Badge key={s} variant="secondary" className="px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary border-transparent">
                          {tag?.label || s}
                        </Badge>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {caregiver.certifications && caregiver.certifications.length > 0 && (
              <Card className="border border-border bg-card rounded-2xl shadow-sm">
                <CardContent className="p-7">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Icons.graduation className="w-5 h-5 text-secondary" /> Formação e certificações
                  </h2>
                  <ul className="space-y-2.5">
                    {caregiver.certifications.map((c: string) => (
                      <li key={c} className="flex items-start gap-3 text-sm">
                        <Icons.check className="w-4 h-4 mt-0.5 text-secondary flex-shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card className="border border-border bg-card rounded-2xl shadow-sm">
              <CardContent className="p-7">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold">Avaliações ({caregiver.rating_count || 0})</h2>
                  {caregiver.rating_average > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Icons.star className="w-5 h-5 fill-highlight text-highlight" />
                      <span className="text-2xl font-bold">{caregiver.rating_average}</span>
                      <span className="text-sm text-muted-foreground">/5</span>
                    </div>
                  )}
                </div>
                {(!reviews || reviews.length === 0) ? (
                  <div className="p-8 text-center bg-muted/30 rounded-xl border border-dashed">
                    <Icons.star className="w-10 h-10 text-muted-foreground mx-auto opacity-30 mb-3" />
                    <p className="text-muted-foreground">Este profissional ainda não tem avaliações.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r) => {
                      const reviewer = Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer
                      return (
                        <div key={r.id} className="border border-border rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex-shrink-0">
                              {reviewer?.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full grid place-items-center text-sm font-bold text-muted-foreground">
                                  {reviewer?.full_name?.charAt(0).toUpperCase() || '?'}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold truncate">{reviewer?.full_name || 'Família'}</div>
                              <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('pt-BR')}</div>
                            </div>
                            <div className="flex gap-0.5 text-highlight flex-shrink-0">
                              {Array.from({ length: r.rating }).map((_, i) => (
                                <Icons.star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                          </div>
                          {r.comment && (
                            <p className="mt-3 text-sm text-foreground/80 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="md:hidden">
              <InvitePanel caregiverUserId={caregiver.user_id} caregiverName={profile.full_name} />
            </div>

            {/* Availability */}
            <Card className="border border-border bg-card rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Icons.calendar className="w-4 h-4 text-primary" /> Disponibilidade
                </h3>
                {caregiver.available_days && caregiver.available_days.length > 0 && (
                  <div className="mb-5">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Dias da semana</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAYS_OF_WEEK.map((d) => {
                        const active = caregiver.available_days.includes(d.value)
                        return (
                          <span key={d.value} className={`w-9 h-9 grid place-items-center rounded-lg text-xs font-bold ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground/50'}`}>
                            {d.label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
                {caregiver.available_shifts && caregiver.available_shifts.length > 0 && (
                  <div className="mb-5">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Turnos</div>
                    <div className="flex flex-wrap gap-1.5">
                      {caregiver.available_shifts.map((s: string) => (
                        <Badge key={s} variant="secondary" className="text-xs bg-secondary/10 text-secondary border-transparent">
                          {SCHEDULES.find((sch) => sch.value === s)?.label || s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {caregiver.offered_modalities && caregiver.offered_modalities.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Modalidades aceitas</div>
                    <div className="flex flex-wrap gap-1.5">
                      {caregiver.offered_modalities.map((m: string) => (
                        <Badge key={m} variant="outline" className="text-xs">
                          {SERVICE_MODALITIES.find((mod) => mod.value === m)?.label || m}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trust */}
            <Card className="border border-secondary/30 bg-secondary/5 rounded-2xl">
              <CardContent className="p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-secondary">
                  <Icons.shield className="w-4 h-4" /> Confiança Cuide+
                </h3>
                <ul className="space-y-2 text-sm">
                  {[
                    { ok: caregiver.verification_status === 'approved', label: 'Identidade verificada' },
                    { ok: !!caregiver.coren_number, label: caregiver.coren_number ? `COREN ativo (${caregiver.coren_number})` : 'COREN' },
                    { ok: !!caregiver.years_experience && caregiver.years_experience >= 3, label: `${caregiver.years_experience}+ anos comprovados` },
                    { ok: caregiver.is_pro, label: 'Plano Pro ativo' },
                  ].filter((b) => !b.label.startsWith('COREN') || b.ok).map((b, i) => (
                    <li key={i} className={`flex items-center gap-2 ${b.ok ? '' : 'opacity-40'}`}>
                      {b.ok ? <Icons.check className="w-4 h-4 text-secondary" /> : <Icons.close className="w-4 h-4" />}
                      {b.label}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Service area */}
            <Card className="border border-border bg-card rounded-2xl">
              <CardContent className="p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Icons.pin className="w-4 h-4 text-accent" /> Área de atendimento
                </h3>
                <p className="text-sm text-muted-foreground">
                  Atende em <strong className="text-foreground">{caregiver.neighborhood}</strong> e bairros num raio de até <strong className="text-foreground">{caregiver.service_radius_km} km</strong> em {caregiver.city}.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}

