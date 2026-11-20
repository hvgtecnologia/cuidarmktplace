import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import type {
  PaymentProvider, ChargeInput, ChargeResult, NormalizedWebhookEvent,
} from '@/server/domain/payments/payment-provider.port'

/**
 * Provedor FALSO — desenvolvimento e teste.
 *
 * Existe para o fluxo inteiro (criar cobrança → pagar → webhook → liberar
 * plano) rodar sem conta em provedor nenhum. Substitui a antiga
 * simulate_subscription_checkout, que pulava direto para "plano ativo" e não
 * exercitava webhook, idempotência nem máquina de estados.
 *
 * Assina o webhook com HMAC igual a um provedor de verdade, para que o código
 * de verificação de assinatura seja exercitado desde já em vez de aparecer só
 * no dia da integração real.
 */
const SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'dev-secret-nao-usar-em-producao'
const PIX_TTL_MINUTES = 30

function sign(body: string) {
  return createHmac('sha256', SECRET).update(body).digest('hex')
}

/** QR falso: um SVG com o texto, só para a tela ter o que renderizar. */
function fakeQrDataUri(code: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">
<rect width="220" height="220" fill="#fff"/>
<rect x="10" y="10" width="200" height="200" fill="none" stroke="#111" stroke-width="4"/>
<text x="110" y="100" font-family="monospace" font-size="11" text-anchor="middle" fill="#111">QR SIMULADO</text>
<text x="110" y="120" font-family="monospace" font-size="9" text-anchor="middle" fill="#666">${code.slice(0, 18)}</text>
</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export const fakeProvider: PaymentProvider = {
  name: 'fake',
  supports: ['card', 'pix'],
  requiresDocument: false,

  async createCharge(input: ChargeInput): Promise<ChargeResult> {
    const providerPaymentId = `fake_${randomUUID()}`

    if (input.method === 'pix') {
      const code = `00020126FAKE${input.paymentId.replace(/-/g, '').slice(0, 20)}5204000053039865802BR`
      return {
        providerPaymentId,
        pixQrCode: fakeQrDataUri(code),
        pixCopyPaste: code,
        expiresAt: new Date(Date.now() + PIX_TTL_MINUTES * 60_000),
      }
    }

    // Cartão: em vez de coletar número (o que esta plataforma não deve fazer),
    // manda para uma tela interna que simula o checkout hospedado do provedor.
    return {
      providerPaymentId,
      checkoutUrl: `/checkout/simulado/${input.paymentId}`,
      expiresAt: new Date(Date.now() + 60 * 60_000),
    }
  },

  async parseWebhook(rawBody: string, headers: Headers): Promise<NormalizedWebhookEvent> {
    const received = headers.get('x-fake-signature') || ''
    const expected = sign(rawBody)

    const a = Buffer.from(received)
    const b = Buffer.from(expected)
    // timingSafeEqual exige mesmo tamanho e evita comparação que vaza tempo.
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error('Assinatura de webhook inválida')
    }

    const body = JSON.parse(rawBody) as {
      eventId?: string
      type?: string
      paymentId?: string
      providerPaymentId?: string
      status?: string
      failureReason?: string
      amountCents?: number
    }

    const status =
      body.status === 'paid' ? 'paid'
      : body.status === 'failed' ? 'failed'
      : body.status === 'refunded' ? 'refunded'
      : 'ignored'

    return {
      externalEventId: body.eventId || randomUUID(),
      type: body.type || 'payment.updated',
      paymentId: body.paymentId ?? null,
      providerPaymentId: body.providerPaymentId ?? null,
      status,
      failureReason: body.failureReason ?? null,
      amountCents: body.amountCents ?? null,
    }
  },
}

/** Exportado para a tela de checkout simulado assinar o webhook que dispara. */
export function signFakeWebhook(body: string) {
  return sign(body)
}
