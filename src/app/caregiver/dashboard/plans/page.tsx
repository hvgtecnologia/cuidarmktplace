import Link from 'next/link'
import { listProducts, paymentProviderRequiresDocument } from '@/server/domain/payments/payments.service'
import { findByUser } from '@/server/domain/subscriptions/subscriptions.repository'
import { requireRole } from '@/server/http/guards'
import { CheckoutPanel } from '@/components/payments/CheckoutPanel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'

export const metadata = {
  title: 'Meu plano · Cuidador',
  description: 'Assine para aceitar convites de famílias.',
}

export default async function PlansPage() {
  const user = await requireRole(['caregiver'])

  const [products, subscription] = await Promise.all([
    // Preços vêm do catálogo no banco — a tela não sabe valor nenhum.
    listProducts().catch(() => []),
    findByUser(user.id),
  ])

  const isActive =
    subscription?.status === 'active' &&
    (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())

  // Taxa por match é cobrança avulsa, não assinatura: fora desta tela.
  const plans = (products ?? []).filter((p) => p.grants_plan !== null)
  const needsDocument = paymentProviderRequiresDocument() && !user.document

  return (
    <div className="container max-w-5xl py-14 px-4 mx-auto min-h-screen">
      <div className="text-center mb-10">
        <h1 className="text-display-md">Meu plano</h1>
        <p className="text-muted-foreground text-lg mt-2 max-w-xl mx-auto">
          Com plano ativo você aceita convites de famílias e libera o contato direto.
        </p>
      </div>

      {isActive && (
        <div className="mb-10 max-w-md mx-auto bg-secondary/10 border border-secondary/30 rounded-2xl p-5 text-center">
          <Badge className="bg-secondary text-secondary-foreground mb-2">
            <Icons.verified className="w-3 h-3 mr-1" /> Plano ativo
          </Badge>
          <p className="text-sm">
            Seu plano <strong>{subscription?.plan}</strong> vale até{' '}
            {subscription?.current_period_end
              ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR')
              : '—'}
            .
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Pagar de novo soma ao tempo que ainda resta.
          </p>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="max-w-md mx-auto bg-card border border-dashed border-border rounded-2xl p-8 text-center">
          <p className="font-semibold">Nenhum plano disponível.</p>
          <p className="text-sm text-muted-foreground mt-1">
            O catálogo <code>payment_products</code> está vazio ou o SQL ainda não foi aplicado.
          </p>
        </div>
      ) : needsDocument ? (
        <div className="max-w-md mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="font-semibold">Falta seu CPF/CNPJ</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            O provedor de pagamento exige isso para gerar a cobrança.
          </p>
          <Link href="/profile">
            <Button variant="outline">Preencher em Minha conta</Button>
          </Link>
        </div>
      ) : (
        <CheckoutPanel products={plans} />
      )}
    </div>
  )
}
