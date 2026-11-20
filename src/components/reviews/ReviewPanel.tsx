'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Icons } from '@/components/icons'
import { submitReviewAction } from '@/server/actions/review.actions'
import { REVIEW_COMMENT_MAX } from '@/server/validations/review'

type ActionResult = { success: true; data?: unknown } | { success: false; error?: string }

export type ExistingReview = { rating: number; comment: string | null } | null

function Stars({
  value,
  onChange,
  hovered,
  onHover,
}: {
  value: number
  onChange?: (n: number) => void
  hovered?: number
  onHover?: (n: number) => void
}) {
  const shown = hovered || value
  return (
    <div className="flex gap-1" onMouseLeave={() => onHover?.(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onHover?.(n)}
          aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
          aria-pressed={value === n}
          className={onChange ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
        >
          <Icons.star
            className={`w-6 h-6 ${n <= shown ? 'text-highlight fill-current' : 'text-muted-foreground/30'}`}
          />
        </button>
      ))}
    </div>
  )
}

/**
 * Avaliação de um atendimento, pela família.
 *
 * O comentário é publicado SEM identificar quem escreveu: a view
 * caregiver_public_reviews não expõe reviewer_id nem match_id. Esse aviso
 * aparece na tela porque quem escreve precisa saber disso antes.
 */
export function ReviewPanel({
  matchId,
  caregiverId,
  existing,
}: {
  matchId: string
  caregiverId: string
  existing: ExistingReview
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState(existing?.comment ?? '')

  function handleSubmit() {
    if (rating < 1) {
      toast.error('Dê uma nota de 1 a 5.')
      return
    }

    startTransition(async () => {
      const res = (await submitReviewAction({
        matchId,
        caregiverId,
        rating,
        comment,
      })) as ActionResult

      if (res.success) {
        toast.success(existing ? 'Avaliação atualizada.' : 'Avaliação publicada. Obrigado!')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(res.error || 'Não foi possível salvar a avaliação.')
      }
    })
  }

  // Estado fechado: ou convida a avaliar, ou mostra o que já foi dito.
  if (!open) {
    return (
      <div className="border-b border-border/60 bg-muted/30 px-4 py-3 flex items-center gap-3 flex-wrap">
        {existing ? (
          <>
            <Stars value={existing.rating} />
            <span className="text-sm text-muted-foreground flex-1 min-w-0 truncate">
              {existing.comment || 'Sem comentário.'}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
              Editar
            </Button>
          </>
        ) : (
          <>
            <span className="text-sm flex-1">Como foi o atendimento?</span>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <Icons.star className="w-4 h-4 mr-1.5" /> Avaliar
            </Button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="border-b border-border/60 bg-muted/30 px-4 py-4">
      <div className="max-w-xl">
        <div className="font-semibold text-sm mb-2">
          {existing ? 'Editar sua avaliação' : 'Avaliar este atendimento'}
        </div>

        <Stars value={rating} onChange={setRating} hovered={hovered} onHover={setHovered} />

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Conte como foi o cuidado (opcional)."
          className="mt-3 min-h-20 bg-background"
          maxLength={REVIEW_COMMENT_MAX}
        />

        <div className="flex items-center justify-between gap-3 mt-1.5">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Icons.shield className="w-3.5 h-3.5 flex-shrink-0" />
            Publicado sem o seu nome no perfil do cuidador.
          </p>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {comment.length}/{REVIEW_COMMENT_MAX}
          </span>
        </div>

        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={handleSubmit} disabled={isPending || rating < 1}>
            {isPending && <Icons.spinner className="w-4 h-4 mr-1.5 animate-spin" />}
            {existing ? 'Salvar' : 'Publicar avaliação'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}
