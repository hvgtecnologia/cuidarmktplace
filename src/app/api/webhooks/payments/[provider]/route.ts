import { NextResponse } from 'next/server'
import { processWebhookEvent } from '@/server/domain/payments/payments.service'

/**
 * Webhook de pagamento — a borda HTTP que o provedor chama.
 *
 * URL: /api/webhooks/payments/<provedor>  (ex: .../payments/asaas)
 *
 * Esta é a ÚNICA fonte confiável de "o dinheiro entrou". O retorno do checkout
 * no navegador não serve: o usuário pode fechar a aba, e a URL de retorno é
 * forjável.
 *
 * O corpo é lido como TEXTO e repassado cru ao adaptador porque a assinatura é
 * calculada sobre os bytes exatos — parsear e re-serializar quebra a validação.
 */
export const dynamic = 'force-dynamic'
// Precisa do runtime Node: a verificação de assinatura usa node:crypto.
export const runtime = 'nodejs'

export async function POST(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const rawBody = await request.text()

  try {
    const result = await processWebhookEvent(params.provider, rawBody, request.headers)

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 })
    }

    // 2xx sempre que o evento foi aceito, inclusive duplicado — senão o
    // provedor reenvia indefinidamente.
    return NextResponse.json({ received: true, outcome: result.reason })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'erro'

    // Assinatura inválida é 401: não é falha nossa e não deve ser reenviada.
    if (message.includes('ssinatura')) {
      console.error(`webhook ${params.provider}: assinatura inválida`)
      return NextResponse.json({ error: 'assinatura inválida' }, { status: 401 })
    }

    // Erro nosso: 500 para o provedor tentar de novo.
    console.error(`webhook ${params.provider}:`, e)
    return NextResponse.json({ error: 'falha ao processar' }, { status: 500 })
  }
}
