'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'

/** Só o necessário para a família escolher — a ficha completa não vem para cá. */
export type ElderlyOption = {
  id: string
  name: string
  neighborhood: string | null
  city: string | null
}

type ActionResult =
  | { success: true; data?: unknown }
  | { success: false; error?: string; code?: string }

/**
 * Escolha de PARA QUEM é o atendimento, antes de enviar o convite.
 *
 * Existe porque o cuidador só enxerga bairro, serviço e sexo do idoso — esses
 * dados saem da ficha escolhida aqui. Sem ficha, não há convite: o próprio RLS
 * (matches_insert_family) rejeita insert com elderly_id nulo.
 */
export function InviteDialog({
  caregiverUserId,
  caregiverName,
  elderly,
  trigger,
}: {
  caregiverUserId: string
  caregiverName: string
  elderly: ElderlyOption[]
  trigger: (open: () => void) => React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  // Com uma ficha só, ela já vem marcada — não faz sentido pedir escolha.
  const [selected, setSelected] = useState<string | null>(elderly.length === 1 ? elderly[0].id : null)

  async function handleInvite() {
    if (!selected) return
    setLoading(true)
    const toastId = toast.loading('Enviando convite…')

    const { inviteCaregiverAction } = await import('@/server/actions/match.actions')
    const res = (await inviteCaregiverAction({
      caregiverId: caregiverUserId,
      elderlyId: selected,
    })) as ActionResult

    if (res.success) {
      toast.success(`Convite enviado para ${caregiverName.split(' ')[0]}!`, { id: toastId })
      setOpen(false)
      router.push('/family/dashboard/matches')
      return
    }

    if (res.code === 'SUBSCRIPTION_REQUIRED') {
      toast.error('Este cuidador exige Pro para convites.', { id: toastId })
    } else {
      toast.error(res.error || 'Erro ao enviar convite.', { id: toastId })
    }
    setLoading(false)
  }

  return (
    <>
      {trigger(() => setOpen(true))}

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="bg-card rounded-2xl shadow-elevated w-full max-w-md p-6">
            <h2 id="invite-dialog-title" className="text-lg font-bold">
              Para quem é o atendimento?
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              O cuidador verá apenas a região, o tipo de serviço e se é homem ou mulher — nunca o nome
              ou os seus dados de contato.
            </p>

            {elderly.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-border p-5 text-center">
                <p className="text-sm font-medium">Nenhum idoso cadastrado</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Cadastre quem vai receber o cuidado para poder solicitar atendimento.
                </p>
                <Link href="/family/elderly/new">
                  <Button size="sm">Cadastrar idoso</Button>
                </Link>
              </div>
            ) : (
              <div className="mt-5 space-y-2">
                {elderly.map((e) => {
                  const isSelected = e.id === selected
                  const region = [e.neighborhood, e.city].filter(Boolean).join(', ')
                  return (
                    <button
                      key={e.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelected(e.id)}
                      className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <div className="font-semibold text-sm">{e.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{region || 'Sem região informada'}</div>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleInvite}
                disabled={loading || !selected}
              >
                {loading && <Icons.spinner className="mr-1.5 w-4 h-4 animate-spin" />}
                Enviar convite
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
