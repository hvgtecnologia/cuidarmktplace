import type { IconKey } from '@/components/icons'

export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'

export const MATCH_STATUS_META: Record<MatchStatus, { label: string; badge: string; icon: IconKey }> = {
  pending:   { label: 'Pendente',  badge: 'bg-amber-100 text-amber-800 border-amber-200', icon: 'clock' },
  accepted:  { label: 'Aceito',    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: 'check' },
  rejected:  { label: 'Recusado',  badge: 'bg-rose-100 text-rose-700 border-rose-200', icon: 'close' },
  cancelled: { label: 'Cancelado', badge: 'bg-muted text-muted-foreground border-border', icon: 'close' },
  completed: { label: 'Concluído', badge: 'bg-primary/10 text-primary border-primary/20', icon: 'check' },
}
