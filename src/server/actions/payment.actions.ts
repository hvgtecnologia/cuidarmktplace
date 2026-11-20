'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/server/http/guards'
import * as payments from '@/server/domain/payments/payments.service'
import type { PaymentMethod } from '@/server/domain/payments/payment-provider.port'

const METHODS: PaymentMethod[] = ['card', 'pix']

/**
 * Abre uma cobrança e devolve à tela o que ela precisa para cobrar.
 *
 * Recebe o CÓDIGO do produto, nunca o valor — o preço sai de payment_products
 * dentro do banco.
 */
export async function startCheckoutAction(input: { productCode: string; method: string }) {
  const user = await requireUser()

  if (!METHODS.includes(input.method as PaymentMethod)) {
    return { success: false as const, error: 'Forma de pagamento inválida.' }
  }

  try {
    const result = await payments.startCheckout(
      input.productCode,
      input.method as PaymentMethod,
      { id: user.id, name: user.full_name || 'Cliente', email: user.email, document: user.document },
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    )

    revalidatePath('/caregiver/dashboard/plans')
    return { success: true as const, data: result }
  } catch (e) {
    console.error('startCheckout:', e)
    return {
      success: false as const,
      error: e instanceof Error ? e.message : 'Não foi possível iniciar o pagamento.',
    }
  }
}

/** Consulta de status — a tela do Pix faz polling disto enquanto espera. */
export async function getPaymentStatusAction(paymentId: string) {
  await requireUser()

  try {
    // RLS garante que só o dono lê a própria cobrança.
    const payment = await payments.getOwnPayment(paymentId)
    if (!payment) return { success: false as const, error: 'Pagamento não encontrado.' }

    return { success: true as const, status: payment.status, paidAt: payment.paid_at }
  } catch (e) {
    console.error('getPaymentStatus:', e)
    return { success: false as const, error: 'Não foi possível consultar o pagamento.' }
  }
}

/**
 * Dispara o webhook do provedor FALSO, no lugar dele.
 *
 * Só existe quando PAYMENT_PROVIDER=fake. O caminho é idêntico ao de produção:
 * monta o corpo, assina com HMAC e chama a própria rota /api/webhooks. Nada de
 * atalho para "marcar como pago" — se houvesse, o código que importa (validação
 * de assinatura, idempotência, confirm_payment) nunca seria testado.
 */
export async function simulateProviderCallbackAction(input: {
  paymentId: string
  outcome: 'paid' | 'failed'
}) {
  await requireUser()

  if ((process.env.PAYMENT_PROVIDER || 'fake') !== 'fake') {
    return { success: false as const, error: 'Disponível apenas com o provedor de teste.' }
  }

  // Confere a posse antes de disparar: a rota de webhook roda com service role
  // e não checaria de quem é a cobrança.
  const payment = await payments.getOwnPayment(input.paymentId)
  if (!payment) return { success: false as const, error: 'Pagamento não encontrado.' }

  const { signFakeWebhook } = await import('@/server/domain/payments/providers/fake.provider')

  const body = JSON.stringify({
    eventId: `evt_${input.paymentId}_${input.outcome}`,
    type: `payment.${input.outcome}`,
    paymentId: input.paymentId,
    providerPaymentId: `fake_${input.paymentId}`,
    status: input.outcome,
    amountCents: payment.amount_cents,
    failureReason: input.outcome === 'failed' ? 'Recusado pelo emissor (simulado)' : undefined,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const res = await fetch(`${appUrl}/api/webhooks/payments/fake`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-fake-signature': signFakeWebhook(body),
      },
      body,
      cache: 'no-store',
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error('simulateProviderCallback: webhook respondeu', res.status, detail)
      return { success: false as const, error: `Webhook falhou (${res.status}).` }
    }

    revalidatePath('/caregiver/dashboard/plans')
    return { success: true as const }
  } catch (e) {
    console.error('simulateProviderCallback:', e)
    return { success: false as const, error: 'Não foi possível chamar o webhook.' }
  }
}
