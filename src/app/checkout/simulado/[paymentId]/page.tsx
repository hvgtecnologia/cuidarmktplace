import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireUser } from '@/server/http/guards'
import { getOwnPayment } from '@/server/domain/payments/payments.service'
import { Button } from '@/components/ui/button'
import { SimulateCheckoutButtons } from './SimulateCheckoutButtons'

export const metadata = { title: 'Checkout simulado · Cuide+' }

/**
 * Faz o papel do checkout hospedado do provedor, para o adaptador `fake`.
 *
 * Em produção esta tela não existe: o usuário vai para o domínio do provedor
 * (Asaas, Stripe...) e volta pela returnUrl. Ela está aqui para o fluxo de
 * cartão ser testável de ponta a ponta sem conta em lugar nenhum.
 *
 * Importante: esta tela NÃO confirma o pagamento. Ela dispara um webhook
 * assinado, exatamente como o provedor faria — a confirmação acontece lá.
 */
export default async function SimulatedCheckoutPage({
  params,
}: {
  params: { paymentId: string }
}) {
  await requireUser()

  if ((process.env.PAYMENT_PROVIDER || 'fake') !== 'fake') {
    redirect('/caregiver/dashboard/plans')
  }

  // RLS garante que só o dono enxerga a própria cobrança.
  const payment = await getOwnPayment(params.paymentId)
  if (!payment) redirect('/caregiver/dashboard/plans')

  const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="min-h-screen grid place-items-center bg-muted/30 px-4">
      <div className="bg-card border border-border rounded-2xl p-7 max-w-md w-full">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Checkout simulado
        </div>
        <h1 className="text-2xl font-bold mt-1">{BRL.format(payment.amount_cents / 100)}</h1>
        <p className="text-sm text-muted-foreground mt-1">{payment.product_code}</p>

        <div className="mt-5 rounded-xl bg-muted/60 border border-border p-4 text-sm">
          <p className="font-semibold mb-1">Por que não há campo de cartão aqui</p>
          <p className="text-muted-foreground">
            Número de cartão nunca deve passar pelo nosso servidor — é o provedor
            que coleta, na página dele. Os botões abaixo simulam o resultado que
            ele devolveria por webhook.
          </p>
        </div>

        {payment.status === 'paid' ? (
          <div className="mt-6 text-center">
            <p className="font-semibold text-secondary">Pagamento já confirmado.</p>
            <Link href="/caregiver/dashboard/plans">
              <Button className="w-full mt-3">Voltar ao plano</Button>
            </Link>
          </div>
        ) : (
          <SimulateCheckoutButtons paymentId={payment.id} />
        )}
      </div>
    </div>
  )
}
