import { createClient } from '@/server/db/server-client'
import { createAdminClient } from '@/server/db/admin-client'
import { getProviderByName, getPaymentProvider } from '@/server/domain/payments/providers'
import type { PaymentMethod } from '@/server/domain/payments/payment-provider.port'

export type CheckoutResult = {
  paymentId: string
  method: PaymentMethod
  amountCents: number
  checkoutUrl?: string | null
  pixQrCode?: string | null
  pixCopyPaste?: string | null
  expiresAt?: string | null
}

/** O provedor ativo exige CPF/CNPJ do cliente? A tela usa isto para avisar
 *  antes de deixar a pessoa tentar pagar sem ter preenchido o documento. */
export function paymentProviderRequiresDocument(): boolean {
  return getPaymentProvider().requiresDocument
}

/** Catálogo público, para a tela montar os preços sem chutar valor. */
export async function listProducts() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payment_products')
    .select('code, label, amount_cents, currency, grants_plan, grants_months')
    .eq('is_active', true)
    .order('amount_cents')

  if (error) throw error
  return data
}

/**
 * Abre uma cobrança.
 *
 * Ordem importa: primeiro grava o registro `pending` no NOSSO banco, depois
 * chama o provedor. Se invertesse, uma falha no meio deixaria cobrança no
 * provedor sem rastro aqui — dinheiro cobrado e nada concedido.
 *
 * O valor não é parâmetro: create_payment_intent lê de payment_products.
 */
export async function startCheckout(
  productCode: string,
  method: PaymentMethod,
  customer: { id: string; name: string; email?: string | null; document?: string | null },
  appUrl: string
): Promise<CheckoutResult> {
  const supabase = createClient()
  const provider = getPaymentProvider()

  if (!provider.supports.includes(method)) {
    throw new Error(`O provedor ${provider.name} não aceita ${method}.`)
  }

  if (provider.requiresDocument && !customer.document) {
    throw new Error(`Informe seu CPF/CNPJ em "Minha conta" antes de pagar com ${provider.name}.`)
  }

  const { data: payment, error } = await supabase
    .rpc('create_payment_intent', {
      p_product_code: productCode,
      p_method: method,
      p_provider: provider.name,
    })
    .single<{ id: string; amount_cents: number; currency: string; description: string }>()

  if (error) throw error

  const charge = await provider.createCharge({
    paymentId: payment.id,
    amountCents: payment.amount_cents,
    currency: payment.currency,
    description: payment.description,
    method,
    customer,
    returnUrl: `${appUrl}/caregiver/dashboard/plans`,
  })

  // Guarda o id do provedor e os dados do Pix para a tela e para casar o
  // webhook depois.
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      provider_payment_id: charge.providerPaymentId,
      pix_qr_code: charge.pixQrCode ?? null,
      pix_copy_paste: charge.pixCopyPaste ?? null,
      expires_at: charge.expiresAt?.toISOString() ?? null,
    })
    .eq('id', payment.id)

  // Falhar aqui não cancela a cobrança: o webhook ainda casa pelo
  // provider_payment_id. Loga e segue.
  if (updateError) console.error('startCheckout: update pós-cobrança', updateError)

  return {
    paymentId: payment.id,
    method,
    amountCents: payment.amount_cents,
    checkoutUrl: charge.checkoutUrl ?? null,
    pixQrCode: charge.pixQrCode ?? null,
    pixCopyPaste: charge.pixCopyPaste ?? null,
    expiresAt: charge.expiresAt?.toISOString() ?? null,
  }
}

/** Status de um pagamento do próprio usuário (polling da tela de Pix). */
export async function getOwnPayment(paymentId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('id, status, amount_cents, method, product_code, pix_qr_code, pix_copy_paste, expires_at, paid_at, failure_reason')
    .eq('id', paymentId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Processa um webhook já validado pelo adaptador.
 *
 * Usa SERVICE ROLE porque não há sessão: quem chamou foi o provedor.
 *
 * Idempotência em duas camadas:
 *  1. INSERT em payment_events com UNIQUE (provider, external_event_id) —
 *     reenvio do mesmo evento para aqui.
 *  2. confirm_payment() sai cedo se o pagamento já está 'paid' — protege
 *     contra dois eventos DIFERENTES que afirmam o mesmo pagamento.
 */
export async function processWebhookEvent(providerName: string, rawBody: string, headers: Headers) {
  const provider = getProviderByName(providerName)
  if (!provider) return { ok: false as const, reason: 'provider_desconhecido' }

  // Lança se a assinatura não bater — o caller devolve 401.
  const event = await provider.parseWebhook(rawBody, headers)

  const admin = createAdminClient()

  const { error: insertError } = await admin.from('payment_events').insert({
    provider: provider.name,
    external_event_id: event.externalEventId,
    payment_id: event.paymentId,
    event_type: event.type,
    payload: JSON.parse(rawBody),
  })

  if (insertError) {
    // 23505 = unique_violation: já vimos este evento. Sucesso, não erro — o
    // provedor precisa de 2xx ou fica reenviando para sempre.
    if (insertError.code === '23505') {
      return { ok: true as const, reason: 'evento_duplicado' }
    }
    throw insertError
  }

  if (event.status === 'ignored' || !event.paymentId) {
    return { ok: true as const, reason: 'evento_sem_efeito' }
  }

  // Confere o valor antes de conceder: protege contra uma cobrança criada
  // com valor adulterado por chamada direta à RPC.
  if (event.amountCents != null) {
    const { data: payment } = await admin
      .from('payments')
      .select('amount_cents')
      .eq('id', event.paymentId)
      .maybeSingle()

    if (payment && payment.amount_cents !== event.amountCents) {
      await admin.rpc('confirm_payment', {
        p_payment_id: event.paymentId,
        p_provider_payment_id: event.providerPaymentId,
        p_paid: false,
        p_failure_reason: `Valor divergente: esperado ${payment.amount_cents}, recebido ${event.amountCents}`,
      })
      return { ok: true as const, reason: 'valor_divergente' }
    }
  }

  const { error: confirmError } = await admin.rpc('confirm_payment', {
    p_payment_id: event.paymentId,
    p_provider_payment_id: event.providerPaymentId,
    p_paid: event.status === 'paid',
    p_failure_reason: event.failureReason ?? null,
  })

  if (confirmError) throw confirmError

  await admin
    .from('payment_events')
    .update({ processed_at: new Date().toISOString() })
    .eq('provider', provider.name)
    .eq('external_event_id', event.externalEventId)

  return { ok: true as const, reason: event.status }
}
