'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Icons, type IconKey } from '@/components/icons'
import { MATCH_STATUS_META, type MatchStatus } from '@/lib/match-status'

export type ContactItem = {
  id: string
  status: MatchStatus
  fullName: string
  avatarUrl: string | null
  /** Linha secundária — cidade/valor do lado família, data de recebimento do lado cuidador. */
  subtitle: string | null
}

/**
 * Compartilhado entre /family/dashboard/matches e /caregiver/dashboard/matches
 * — só muda o que populate `subtitle` e o `basePath` dos links.
 *
 * Client component só por causa do useParams — é a forma confiável de saber
 * qual item está selecionado, já que o layout fica ACIMA do segmento
 * dinâmico [matchId] e não recebe esse param diretamente.
 */
export function ContactsList({
  items,
  basePath,
  emptyMessage,
  fallbackIcon,
}: {
  items: ContactItem[]
  basePath: string
  emptyMessage: string
  /**
   * Substitui a inicial do nome no avatar vazio. Usado no lado do cuidador,
   * onde todo item se chama "Atendimento em …" e a inicial seria sempre "A".
   */
  fallbackIcon?: IconKey
}) {
  const params = useParams<{ matchId?: string }>()
  const selectedId = params?.matchId
  const FallbackIcon = fallbackIcon ? Icons[fallbackIcon] : null

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {items.map((item) => {
        const meta = MATCH_STATUS_META[item.status]
        const StatusIcon = Icons[meta.icon]
        const isSelected = item.id === selectedId
        return (
          <Link
            key={item.id}
            href={`${basePath}/${item.id}`}
            className={`flex items-center gap-3 px-4 py-3 border-b border-border/40 transition-colors ${
              isSelected ? 'bg-primary/5' : 'hover:bg-muted/60'
            }`}
          >
            <div className="h-11 w-11 rounded-full bg-muted overflow-hidden flex-shrink-0">
              {item.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.avatarUrl} alt={item.fullName} className="w-full h-full object-cover" />
              ) : FallbackIcon ? (
                <div className="w-full h-full grid place-items-center text-muted-foreground">
                  <FallbackIcon className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-full h-full grid place-items-center font-bold text-muted-foreground text-sm">
                  {item.fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{item.fullName}</div>
              <div className="text-xs text-muted-foreground truncate">{item.subtitle || '—'}</div>
            </div>
            <span className={`inline-flex items-center gap-1 flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.badge}`}>
              <StatusIcon className="w-3 h-3" /> {meta.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
