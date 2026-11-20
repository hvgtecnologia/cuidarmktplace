'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Icons } from '@/components/icons'
import { reviewCaregiverVerification } from '@/server/actions/admin.actions'

type Method = 'online' | 'in_person'

export function VerificationActions({
  caregiverUserId,
  caregiverName,
}: {
  caregiverUserId: string
  caregiverName: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rejecting, setRejecting] = useState(false)
  const [notes, setNotes] = useState('')
  // Como a conferência foi feita. Decide a posição do cuidador na vitrine:
  // presencial > online > nenhuma. Por isso é escolha explícita do admin, e
  // não um padrão silencioso.
  const [method, setMethod] = useState<Method>('online')

  const submit = (decision: 'approved' | 'rejected') => {
    const toastId = toast.loading(decision === 'approved' ? 'Aprovando…' : 'Recusando…')

    startTransition(async () => {
      const res = await reviewCaregiverVerification({
        caregiverUserId,
        decision,
        notes: decision === 'rejected' ? notes : undefined,
        method: decision === 'approved' ? method : undefined,
      })

      if (res.success) {
        toast.success(
          decision === 'approved'
            ? `${caregiverName} aprovado(a) — verificação ${method === 'in_person' ? 'presencial' : 'online'}.`
            : `${caregiverName} recusado(a).`,
          { id: toastId }
        )
        setRejecting(false)
        setNotes('')
        router.refresh()
      } else {
        toast.error(res.error || 'Não foi possível concluir.', { id: toastId })
      }
    })
  }

  if (rejecting) {
    return (
      <div className="w-full md:w-auto md:min-w-[220px] space-y-2">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Motivo da recusa (o cuidador pode reenviar após 48h)"
          className="text-sm min-h-20"
          maxLength={500}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
            disabled={isPending || notes.trim().length < 3}
            onClick={() => submit('rejected')}
          >
            Confirmar recusa
          </Button>
          <Button variant="ghost" disabled={isPending} onClick={() => setRejecting(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full md:w-auto md:min-w-[200px]">
      <div>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
          Conferência
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {([
            ['online', 'Online'],
            ['in_person', 'Presencial'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={method === value}
              onClick={() => setMethod(value)}
              className={`rounded-lg border-2 px-2 py-1.5 text-xs font-semibold transition-all ${
                method === value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <Button
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        disabled={isPending}
        onClick={() => submit('approved')}
      >
        <Icons.check className="w-4 h-4 mr-1.5" /> Aprovar
      </Button>
      <Button
        variant="outline"
        className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
        disabled={isPending}
        onClick={() => setRejecting(true)}
      >
        Recusar
      </Button>
    </div>
  )
}
