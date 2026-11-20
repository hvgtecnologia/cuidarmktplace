'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { simulateProviderCallbackAction } from '@/server/actions/payment.actions'

/**
 * Dispara o webhook assinado no lugar do provedor.
 *
 * Note que não existe um "marcar como pago" direto: o caminho é o mesmo do
 * provedor real — webhook assinado → validação → confirm_payment. Assim o
 * código de produção é exercitado, não contornado.
 */
export function SimulateCheckoutButtons({ paymentId }: { paymentId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function fire(outcome: 'paid' | 'failed') {
    const toastId = toast.loading('Enviando webhook…')

    startTransition(async () => {
      const res = await simulateProviderCallbackAction({ paymentId, outcome })

      if (res.success) {
        toast.success(
          outcome === 'paid' ? 'Webhook processado: pago.' : 'Webhook processado: recusado.',
          { id: toastId }
        )
        router.push('/caregiver/dashboard/plans')
        router.refresh()
      } else {
        toast.error(res.error, { id: toastId })
      }
    })
  }

  return (
    <div className="mt-6 space-y-2">
      <Button className="w-full" disabled={isPending} onClick={() => fire('paid')}>
        Simular pagamento aprovado
      </Button>
      <Button
        variant="outline"
        className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
        disabled={isPending}
        onClick={() => fire('failed')}
      >
        Simular recusa
      </Button>
    </div>
  )
}
