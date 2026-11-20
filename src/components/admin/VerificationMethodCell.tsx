'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Icons } from '@/components/icons'
import { setCaregiverVerificationMethod } from '@/server/actions/admin.actions'

type Method = 'online' | 'in_person' | null
type ActionResult = { success: true; data?: unknown } | { success: false; error?: string }

/**
 * Registra como o cuidador foi verificado, direto na listagem.
 *
 * Existe porque a fila de /admin/verification só mostra PENDENTES: depois de
 * aprovado o cuidador sai de lá, e a verificação presencial costuma acontecer
 * justamente depois (alguém visita, ou ele aparece com o documento). Sem este
 * controle não haveria como promovê-lo de online para presencial.
 *
 * Só aparece em perfil aprovado — é o que a função no banco aceita.
 */
export function VerificationMethodCell({
  caregiverUserId,
  status,
  method,
  setAt,
}: {
  caregiverUserId: string
  status: string
  method: Method
  setAt: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (status !== 'approved') {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  function choose(next: 'online' | 'in_person') {
    if (next === method) return
    startTransition(async () => {
      const res = (await setCaregiverVerificationMethod({
        caregiverUserId,
        method: next,
      })) as ActionResult

      if (res.success) {
        toast.success(
          next === 'in_person'
            ? 'Marcado como verificado presencialmente.'
            : 'Marcado como verificado online.'
        )
        router.refresh()
      } else {
        toast.error(res.error || 'Não foi possível registrar.')
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="inline-flex rounded-lg border border-border overflow-hidden">
        {([
          ['online', 'Online'],
          ['in_person', 'Presencial'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            disabled={isPending}
            aria-pressed={method === value}
            onClick={() => choose(value)}
            className={`px-2 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
              method === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted text-muted-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {method && setAt && (
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          <Icons.check className="w-2.5 h-2.5" />
          {new Date(setAt).toLocaleDateString('pt-BR')}
        </span>
      )}
      {!method && (
        <span className="text-[10px] text-muted-foreground">não registrada</span>
      )}
    </div>
  )
}
