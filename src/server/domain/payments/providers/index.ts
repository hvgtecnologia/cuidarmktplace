import type { PaymentProvider, ProviderName } from '@/server/domain/payments/payment-provider.port'
import { fakeProvider } from '@/server/domain/payments/providers/fake.provider'
import { asaasProvider } from '@/server/domain/payments/providers/asaas.provider'

/**
 * Registro de provedores.
 *
 * Para plugar um provedor real:
 *   1. criar `<nome>.provider.ts` implementando PaymentProvider
 *   2. registrar aqui
 *   3. PAYMENT_PROVIDER=<nome> no .env
 *
 * Nada mais muda — nem tela, nem action, nem rota de webhook.
 *
 * Asaas (src/server/domain/payments/providers/asaas.provider.ts) já está
 * implementado, mas NUNCA foi testado contra uma conta real — o usuário ainda
 * não tinha credenciais quando foi escrito. Ver os comentários no topo do
 * arquivo para as variáveis de ambiente necessárias e o checklist do painel
 * Asaas (webhook + eventos a habilitar).
 *
 * Notas de quem integrar os demais (levantadas, não implementadas):
 *  - Stripe: Pix no Brasil exige habilitação na conta. Assina com
 *    `stripe-signature` (HMAC do corpo cru + timestamp, com janela de tolerância).
 *  - Mercado Pago: Pix forte, webhook manda só o id; é preciso buscar o
 *    pagamento na API para saber o status — nunca confiar no corpo.
 */
const PROVIDERS: Partial<Record<ProviderName, PaymentProvider>> = {
  fake: fakeProvider,
  asaas: asaasProvider,
}

export function getPaymentProvider(): PaymentProvider {
  const name = (process.env.PAYMENT_PROVIDER || 'fake') as ProviderName
  const provider = PROVIDERS[name]

  if (!provider) {
    const disponiveis = Object.keys(PROVIDERS).join(', ')
    throw new Error(
      `PAYMENT_PROVIDER="${name}" não tem adaptador. Disponíveis: ${disponiveis}.`
    )
  }

  return provider
}

export function getProviderByName(name: string): PaymentProvider | null {
  return PROVIDERS[name as ProviderName] ?? null
}
