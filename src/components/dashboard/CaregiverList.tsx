'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import Link from 'next/link'
import { searchCaregiversAction } from '@/app/family/dashboard/actions'
import {
  CARE_TAGS,
  SCHEDULES,
  CAREGIVER_LEVELS,
  SERVICE_MODALITIES,
} from '@/constants/care-tags'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { CaregiverSearchFilters } from '@/lib/validations/search'

type CaregiverResult = {
  id: string
  user_id: string
  bio: string
  level: 'companion' | 'basic' | 'technical' | 'nurse'
  years_experience: number
  specialties: string[]
  certifications?: string[]
  coren_number?: string | null
  hourly_rate: number
  half_day_rate?: number | null
  day_shift_rate?: number | null
  night_shift_rate?: number | null
  overnight_rate?: number | null
  full_24h_rate?: number | null
  monthly_rate?: number | null
  offered_modalities?: string[]
  city: string
  neighborhood: string
  available_shifts: string[]
  rating_average: number
  rating_count: number
  jobs_completed?: number
  is_pro?: boolean
  is_featured?: boolean
  verification_status?: string
  profiles: { full_name: string; avatar_url: string | null } | null
}

const DEFAULT_FILTERS: CaregiverSearchFilters = {
  specialty: '',
  shift: '',
  level: '',
  modality: '',
  city: '',
  maxPrice: undefined,
  sortBy: 'rating_desc',
}

const LEVEL_LABEL: Record<string, string> = {
  companion: 'Acompanhante',
  basic: 'Cuidador Básico',
  technical: 'Téc. Enfermagem',
  nurse: 'Enfermeiro(a)',
}

const LEVEL_COLOR: Record<string, string> = {
  companion: 'bg-slate-100 text-slate-700',
  basic: 'bg-primary/10 text-primary',
  technical: 'bg-secondary/10 text-secondary',
  nurse: 'bg-accent/10 text-accent',
}

function formatBRL(value: number | null | undefined) {
  if (!value) return null
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function CaregiverList() {
  const [caregivers, setCaregivers] = useState<CaregiverResult[]>([])
  const [filters, setFilters] = useState<CaregiverSearchFilters>(DEFAULT_FILTERS)
  const [isPending, startTransition] = useTransition()
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const fetchCaregivers = useCallback((currentFilters: CaregiverSearchFilters) => {
    startTransition(async () => {
      const response = await searchCaregiversAction(currentFilters)
      if (response.success) {
        setCaregivers(response.data as unknown as CaregiverResult[])
      } else {
        toast.error('Erro ao buscar cuidadores: ' + response.error)
      }
      setIsInitialLoad(false)
    })
  }, [])

  useEffect(() => {
    fetchCaregivers(filters)
  }, [filters, fetchCaregivers])

  const handle = <K extends keyof CaregiverSearchFilters>(key: K, value: CaregiverSearchFilters[K] | string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' || value === '' ? (key === 'maxPrice' ? undefined : '') : value,
    }))
  }

  const activeFilters = [filters.specialty, filters.shift, filters.level, filters.modality, filters.city, filters.maxPrice]
    .filter((v) => v !== '' && v !== undefined && v !== null).length

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
          <FilterBlock label="Tipo profissional" icon="stethoscope">
            <Select value={filters.level || 'all'} onValueChange={(v) => handle('level', v)}>
              <SelectTrigger className="bg-background h-10"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                {CAREGIVER_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBlock>
          <FilterBlock label="Modalidade" icon="clock">
            <Select value={filters.modality || 'all'} onValueChange={(v) => handle('modality', v)}>
              <SelectTrigger className="bg-background h-10"><SelectValue placeholder="Qualquer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer modalidade</SelectItem>
                {SERVICE_MODALITIES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBlock>
          <FilterBlock label="Especialidade" icon="sparkles">
            <Select value={filters.specialty || 'all'} onValueChange={(v) => handle('specialty', v)}>
              <SelectTrigger className="bg-background h-10"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as especialidades</SelectItem>
                {CARE_TAGS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterBlock>
          <FilterBlock label="Cidade" icon="pin">
            <Input
              value={filters.city || ''}
              onChange={(e) => handle('city', e.target.value)}
              placeholder="Ex: São Paulo"
              className="bg-background h-10"
            />
          </FilterBlock>
          <FilterBlock label="Ordenar por" icon="star">
            <Select value={filters.sortBy} onValueChange={(v) => handle('sortBy', v as CaregiverSearchFilters['sortBy'])}>
              <SelectTrigger className="bg-background h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rating_desc">Melhor avaliados</SelectItem>
                <SelectItem value="price_asc">Menor preço</SelectItem>
                <SelectItem value="price_desc">Maior preço</SelectItem>
              </SelectContent>
            </Select>
          </FilterBlock>
        </div>

        {(activeFilters > 0 || !isInitialLoad) && (
          <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-sm">
            <div className="text-muted-foreground">
              {isPending ? (
                <span className="inline-flex items-center gap-2"><Icons.spinner className="w-4 h-4 animate-spin" /> Buscando…</span>
              ) : (
                <span><strong className="text-foreground">{caregivers.length}</strong> cuidador{caregivers.length === 1 ? '' : 'es'} encontrado{caregivers.length === 1 ? '' : 's'}</span>
              )}
            </div>
            {activeFilters > 0 && (
              <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="text-primary font-medium hover:underline">
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {isInitialLoad ? (
        <SkeletonGrid />
      ) : caregivers.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity', isPending && 'opacity-60')}>
          {caregivers.map((cg) => <CaregiverCard key={cg.id} cg={cg} />)}
        </div>
      )}
    </div>
  )
}

function FilterBlock({ label, icon, children }: { label: string; icon: keyof typeof Icons; children: React.ReactNode }) {
  const Icon = Icons[icon]
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Icon className="w-3 h-3" /> {label}
      </label>
      {children}
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
          <Skeleton className="h-44 w-full rounded-none" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
            <div className="flex gap-2 pt-3">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 flex-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary grid place-items-center mb-4">
        <Icons.search className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Nenhum cuidador encontrado</h3>
      <p className="text-muted-foreground max-w-md mx-auto">
        Ajuste os filtros ou volte mais tarde — novos profissionais entram diariamente na sua região.
      </p>
    </div>
  )
}

function CaregiverCard({ cg }: { cg: CaregiverResult }) {
  const firstName = cg.profiles?.full_name?.split(' ')[0] || 'Cuidador'

  // Build pricing summary - prefer most relevant tier
  const priceTiers = [
    { label: 'hora', value: cg.hourly_rate, modality: 'hourly' },
    { label: '12h dia', value: cg.day_shift_rate, modality: 'day_shift' },
    { label: '12h noite', value: cg.night_shift_rate, modality: 'night_shift' },
    { label: 'pernoite', value: cg.overnight_rate, modality: 'overnight' },
    { label: '24h', value: cg.full_24h_rate, modality: 'full_24h' },
    { label: 'mensal', value: cg.monthly_rate, modality: 'monthly' },
  ].filter((t) => t.value && t.value > 0)

  const primaryPrice = priceTiers[0]
  const secondaryPrices = priceTiers.slice(1, 3)

  async function handleInvite() {
    toast.loading('Enviando convite…', { id: `invite-${cg.id}` })
    const res = await import('@/app/actions/match').then((m) =>
      m.inviteCaregiverAction({ caregiverId: cg.user_id })
    )
    if (res.success) {
      toast.success('Convite enviado! Aguarde o retorno.', { id: `invite-${cg.id}` })
    } else if (res && typeof res === 'object' && 'code' in res && (res as { code?: string }).code === 'SUBSCRIPTION_REQUIRED') {
      toast.error('Este cuidador exige assinatura Pro para convites.', { id: `invite-${cg.id}` })
    } else {
      toast.error(res.error || 'Erro ao enviar convite.', { id: `invite-${cg.id}` })
    }
  }

  return (
    <Card className="overflow-hidden border-border hover:border-primary/40 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 group flex flex-col rounded-2xl bg-card">
      {/* Photo */}
      <div className="relative h-44 bg-muted overflow-hidden">
        {cg.profiles?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cg.profiles.avatar_url} alt={firstName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/15 grid place-items-center">
            <span className="text-4xl font-bold text-white/80">{firstName.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {cg.is_featured && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-highlight text-foreground text-[10px] font-bold uppercase tracking-wider shadow-soft">
            <Icons.sparkles className="w-3 h-3" /> Em destaque
          </span>
        )}
        {cg.is_pro && !cg.is_featured && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider shadow-soft">
            <Icons.sparkles className="w-3 h-3" /> Pro
          </span>
        )}
        {cg.verification_status === 'approved' && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/95 text-secondary text-[10px] font-semibold backdrop-blur shadow-soft">
            <Icons.verified className="w-3 h-3" /> Verificado
          </span>
        )}

        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-bold text-lg leading-tight truncate">{firstName}</h3>
          <div className="flex items-center gap-3 text-xs opacity-95 mt-1 font-medium flex-wrap">
            <span className="inline-flex items-center gap-1"><Icons.pin className="w-3 h-3" /> {cg.city || '—'}</span>
            <span className="inline-flex items-center gap-1">
              <Icons.star className="w-3 h-3 fill-highlight text-highlight" />
              {cg.rating_average > 0 ? cg.rating_average.toFixed(1) : 'Novo'}
              {cg.rating_count > 0 && <span className="opacity-80">({cg.rating_count})</span>}
            </span>
            {cg.years_experience > 0 && (
              <span className="opacity-80">{cg.years_experience}+ anos</span>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-5 flex flex-col flex-1">
        {/* Level badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider', LEVEL_COLOR[cg.level] || LEVEL_COLOR.basic)}>
            {LEVEL_LABEL[cg.level] || 'Cuidador'}
            {cg.coren_number && <span className="opacity-75">· COREN {cg.coren_number}</span>}
          </span>
          {cg.jobs_completed && cg.jobs_completed > 0 && (
            <span className="text-[10px] text-muted-foreground font-medium">
              {cg.jobs_completed} trabalhos
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {cg.bio || 'Este profissional ainda não escreveu uma bio.'}
        </p>

        {/* Specialties */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cg.specialties?.slice(0, 3).map((spec) => (
            <Badge key={spec} variant="secondary" className="text-[10px] font-medium bg-primary/10 text-primary border-transparent hover:bg-primary/15">
              {CARE_TAGS.find((t) => t.value === spec)?.label || spec}
            </Badge>
          ))}
          {cg.specialties && cg.specialties.length > 3 && (
            <Badge variant="outline" className="text-[10px]">+{cg.specialties.length - 3}</Badge>
          )}
        </div>

        {/* Pricing block */}
        {primaryPrice && (
          <div className="mt-4 bg-muted/40 border border-border/60 rounded-xl p-3">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xs text-muted-foreground font-medium">A partir de</div>
                <div className="text-2xl font-bold tracking-tight gradient-text">
                  {formatBRL(primaryPrice.value)}
                  <span className="text-xs text-muted-foreground font-medium ml-1">/{primaryPrice.label}</span>
                </div>
              </div>
              {priceTiers.length > 1 && (
                <span className="text-[10px] text-muted-foreground">+{priceTiers.length - 1} modalidades</span>
              )}
            </div>
            {secondaryPrices.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/40 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                {secondaryPrices.map((p) => (
                  <span key={p.modality}>
                    <span className="font-semibold text-foreground">{formatBRL(p.value)}</span>
                    <span className="ml-0.5">/{p.label}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
          <Link href={`/caregiver/${cg.user_id}`}>
            <Button variant="outline" size="sm" className="w-full">Ver perfil</Button>
          </Link>
          <Button size="sm" onClick={handleInvite} className="shadow-soft">
            <Icons.heart className="mr-1.5 w-3.5 h-3.5" /> Convidar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
