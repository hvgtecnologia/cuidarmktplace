/**
 * PORTA de pagamento: o contrato que o app conhece.
 *
 * Nada em src/app/ e src/components/ importa um provedor concreto. Quando o
 * provedor oficial for escolhido, escreve-se um adaptador novo e troca-se a
 * variável PAYMENT_PROVIDER — nenhuma tela muda.
 *
 * Por que a porta é assim:
 *  - `createCharge` devolve o que a TELA precisa para cobrar (URL de checkout
 *    no cartão, QR + copia-e-cola no Pix). Cada provedor devolve isso de um
 *    jeito; aqui o formato é único.
 *  - a confirmação NUNCA vem do retorno dessa chamada. Vem por webhook, que é
 *    a única fonte confiável de "o dinheiro entrou".
 */

export type PaymentMethod = 'card' | 'pix'
export type ProviderName = 'fake' | 'asaas' | 'stripe' | 'mercadopago' | 'pagarme'

export type ChargeInput = {
  /** Id do nosso registro em `payments` — vai como referência externa. */
  paymentId: string
  amountCents: number
  currency: string
  description: string
  method: PaymentMethod
  customer: {
    id: string
    name: string
    email?: string | null
    /** CPF/CNPJ, só dígitos. Obrigatório para provedores com requiresDocument. */
    document?: string | null
  }
  /** Para onde o provedor devolve o usuário depois do checkout de cartão. */
  returnUrl: string
}

export type ChargeResult = {
  /** Id do pagamento no provedor. Guardado para casar o webhook depois. */
  providerPaymentId: string
  /** Cartão: URL do checkout hospedado. Nulo no Pix. */
  checkoutUrl?: string | null
  /** Pix: imagem do QR em base64 (data URI) e o copia-e-cola. */
  pixQrCode?: string | null
  pixCopyPaste?: string | null
  expiresAt?: Date | null
}

/** Evento de webhook já normalizado — sem formato de provedor. */
export type NormalizedWebhookEvent = {
  /** Id do evento NO PROVEDOR. É a chave de idempotência. */
  externalEventId: string
  type: string
  /** Nosso payments.id, recuperado da referência externa. */
  paymentId: string | null
  providerPaymentId: string | null
  status: 'paid' | 'failed' | 'pending' | 'refunded' | 'ignored'
  failureReason?: string | null
  amountCents?: number | null
}

export interface PaymentProvider {
  readonly name: ProviderName

  /** Métodos que este provedor suporta — a tela esconde o que não dá. */
  readonly supports: readonly PaymentMethod[]

  /** Exige CPF/CNPJ do cliente para criar cobrança (ex.: Asaas). */
  readonly requiresDocument: boolean

  createCharge(input: ChargeInput): Promise<ChargeResult>

  /**
   * Valida a assinatura e traduz o corpo bruto do webhook.
   *
   * Recebe o corpo como TEXTO, não como objeto já parseado: quase todo
   * provedor assina os bytes exatos, e um JSON.parse seguido de stringify
   * muda o conteúdo e invalida a assinatura.
   *
   * Deve lançar se a assinatura não bater — webhook não autenticado é um
   * endpoint público que concede plano de graça.
   */
  parseWebhook(rawBody: string, headers: Headers): Promise<NormalizedWebhookEvent>
}
