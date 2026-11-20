'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { startCheckoutAction, getPaymentStatusAction } from '@/server/actions/payment.actions'

type Product = { code: string; label: string; amount_cents: number }

type PixCharge = {
  paymentId: string
  pixQrCode: string | null
  pixCopyPaste: string | null
  expiresAt: string | null
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const POLL_MS = 4000

export function CheckoutPanel({ products }: { products: Product[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [method, setMethod] = useState<'card' | 'pix'>('pix')
  const [pix, setPix] = useState<PixCharge | null>(null)

  /**
   * Enquanto o Pix está aberto, pergunta o status de tempos em tempos.
   *
   * Quem confirma de verdade é o webhook; isto só observa o resultado — por
   * isso consulta o NOSSO banco, nunca o provedor.
   */
  useEffect(() => {
    if (!pix) return

    const timer = setInterval(async () => {
      const res = await getPaymentStatusAction(pix.paymentId)
      if (res.success && res.status === 'paid') {
        clearInterval(timer)
        toast.success('Pagamento confirmado! Plano liberado.')
        setPix(null)
        router.refresh()
      }
    }, POLL_MS)

    return () => clearInterval(timer)
  }, [pix, router])

  function checkout(productCode: string) {
    const toastId = toast.loading('Gerando cobrança…')

    startTransition(async () => {
      const res = await startCheckoutAction({ productCode, method })

      if (!res.success) {
        toast.error(res.error, { id: toastId })
        return
      }

      toast.dismiss(toastId)

      if (res.data.method === 'pix') {
        setPix({
          paymentId: res.data.paymentId,
          pixQrCode: res.data.pixQrCode ?? null,
          pixCopyPaste: res.data.pixCopyPaste ?? null,
          expiresAt: res.data.expiresAt ?? null,
        })
        return
      }

      if (res.data.checkoutUrl) {
        router.push(res.data.checkoutUrl)
      } else {
        toast.error('O provedor não devolveu uma URL de checkout.')
      }
    })
  }

  async function copyPixCode() {
    if (!pix?.pixCopyPaste) return
    try {
      await navigator.clipboard.writeText(pix.pixCopyPaste)
      toast.success('Código copiado.')
    } catch {
      toast.error('Não foi possível copiar. Selecione o código manualmente.')
    }
  }

  if (pix) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 max-w-md mx-auto text-center">
        <h3 className="text-lg font-bold">Pague com Pix</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Abra o app do banco, escaneie o código e aguarde a confirmação.
        </p>

        {pix.pixQrCode && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pix.pixQrCode}
            alt="QR Code do Pix"
            className="mx-auto my-5 w-52 h-52 rounded-xl border border-border"
          />
        )}

        {pix.pixCopyPaste && (
          <>
            <div className="text-xs font-mono bg-muted rounded-lg p-3 break-all text-left">
              {pix.pixCopyPaste}
            </div>
            <Button variant="outline" className="w-full mt-3" onClick={copyPixCode}>
              Copiar código
            </Button>
          </>
        )}

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Icons.spinner className="w-4 h-4 animate-spin" />
          Aguardando pagamento…
        </div>

        {pix.expiresAt && (
          <p className="text-xs text-muted-foreground mt-2">
            Expira às {new Date(pix.expiresAt).toLocaleTimeString('pt-BR')}
          </p>
        )}

        <Button variant="ghost" className="mt-4" onClick={() => setPix(null)}>
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-5 max-w-md mx-auto">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Forma de pagamento
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            aria-pressed={method === 'pix'}
            onClick={() => setMethod('pix')}
            className={`rounded-xl border-2 p-3 text-sm font-semibold transition-all ${
              method === 'pix' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40'
            }`}
          >
            Pix
            <span className="block text-xs font-normal text-muted-foreground mt-0.5">
              Confirmação na hora
            </span>
          </button>
          <button
            type="button"
            aria-pressed={method === 'card'}
            onClick={() => setMethod('card')}
            className={`rounded-xl border-2 p-3 text-sm font-semibold transition-all ${
              method === 'card' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40'
            }`}
          >
            Cartão
            <span className="block text-xs font-normal text-muted-foreground mt-0.5">
              Crédito
            </span>
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {products.map((product) => (
          <div key={product.code} className="bg-card border border-border rounded-2xl p-5 flex flex-col">
            <div className="font-bold">{product.label}</div>
            <div className="text-3xl font-extrabold mt-2 gradient-text">
              {BRL.format(product.amount_cents / 100)}
            </div>
            <Button
              className="w-full mt-4"
              disabled={isPending}
              onClick={() => checkout(product.code)}
            >
              {isPending ? 'Aguarde…' : `Pagar com ${method === 'pix' ? 'Pix' : 'cartão'}`}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
