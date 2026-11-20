import { timingSafeEqual } from 'node:crypto'
import type {
  PaymentProvider, ChargeInput, ChargeResult, NormalizedWebhookEvent,
} from '@/server/domain/payments/payment-provider.port'

/**
 * Adaptador Asaas — implementado sem conta criada ainda (o usuário ainda não
 * tem credenciais). Montado 1:1 com a documentação pública da Asaas; só foi
 * possível validar a FORMA das respostas, não o comportamento real da API.
 * Antes de ativar em produção, teste o ciclo completo no sandbox.
 *
 * Variáveis de ambiente:
 *   PAYMENT_PROVIDER=asaas
 *   ASAAS_API_KEY=<chave da conta, cabeçalho access_token>
 *   ASAAS_API_BASE=https://api-sandbox.asaas.com/v3   (produção: api.asaas.com/v3)
 *   ASAAS_WEBHOOK_TOKEN=<token definido ao cadastrar o webhook no painel Asaas>
 *
 * No painel Asaas, cadastre o webhook apontando para
 * <SEU_DOMINIO>/api/webhooks/payments/asaas, com o MESMO token acima, e
 * habilite pelo menos os eventos PAYMENT_CONFIRMED, PAYMENT_RECEIVED e
 * PAYMENT_OVERDUE — são os únicos que este adaptador interpreta.
 */

const API_BASE = process.env.ASAAS_API_BASE || 'https://api-sandbox.asaas.com/v3'
const API_KEY = process.env.ASAAS_API_KEY
const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN

type AsaasCustomer = { id: string }
type AsaasPayment = { id: string; invoiceUrl?: string | null }
type AsaasPixQrCode = { encodedImage?: string | null; payload?: string | null; expirationDate?: string | null }
type AsaasErrorBody = { errors?: { description?: string }[] }

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada — defina no .env antes de usar PAYMENT_PROVIDER=asaas.')
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'access_token': API_KEY,
      'user-agent': 'CuidePlusMarketplace/1.0',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const detail = (body as AsaasErrorBody | null)?.errors?.[0]?.description
    throw new Error(detail || `Asaas respondeu ${res.status} em ${path}`)
  }

  return body as T
}

/**
 * Procura o cliente pelo externalReference (nosso profiles.id) antes de criar
 * um novo — a API da Asaas aceita duplicar clientes, então sem esta busca
 * cada cobrança criaria um cliente novo.
 */
async function getOrCreateCustomer(input: ChargeInput): Promise<string> {
  const found = await asaasFetch<{ data: AsaasCustomer[] }>(
    `/customers?externalReference=${encodeURIComponent(input.customer.id)}`
  )
  if (found.data?.[0]?.id) return found.data[0].id

  if (!input.customer.document) {
    // Não deveria chegar aqui: payments.service já bloqueia antes de chamar
    // o provedor quando requiresDocument=true e falta o documento. Fica como
    // segunda trava, não a primeira.
    throw new Error('CPF/CNPJ necessário para pagar com Asaas. Atualize em "Minha conta".')
  }

  const created = await asaasFetch<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: input.customer.name,
      email: input.customer.email || undefined,
      cpfCnpj: input.customer.document,
      externalReference: input.customer.id,
    }),
  })
  return created.id
}

export const asaasProvider: PaymentProvider = {
  name: 'asaas',
  supports: ['card', 'pix'],
  requiresDocument: true,

  async createCharge(input: ChargeInput): Promise<ChargeResult> {
    const customerId = await getOrCreateCustomer(input)

    // dueDate é obrigatório na API mesmo para cobrança imediata; hoje é o
    // valor correto tanto para Pix (QR expira sozinho, ver PIX_TTL abaixo)
    // quanto para cartão (cobrança à vista, não parcelada).
    const dueDate = new Date().toISOString().slice(0, 10)

    const payment = await asaasFetch<AsaasPayment>('/payments', {
      method: 'POST',
      body: JSON.stringify({
        customer: customerId,
        billingType: input.method === 'pix' ? 'PIX' : 'CREDIT_CARD',
        value: input.amountCents / 100,
        dueDate,
        description: input.description,
        // Eco deste campo no webhook é como casamos o evento com payments.id
        // sem depender de guardar o id Asaas antes de ele existir.
        externalReference: input.paymentId,
      }),
    })

    if (input.method === 'pix') {
      const qr = await asaasFetch<AsaasPixQrCode>(`/payments/${payment.id}/pixQrCode`)
      return {
        providerPaymentId: payment.id,
        pixQrCode: qr.encodedImage ? `data:image/png;base64,${qr.encodedImage}` : null,
        pixCopyPaste: qr.payload ?? null,
        expiresAt: qr.expirationDate ? new Date(qr.expirationDate) : null,
      }
    }

    // Cartão: manda para o checkout hospedado da Asaas — esta plataforma
    // nunca vê número de cartão, fora do escopo de PCI-DSS.
    return {
      providerPaymentId: payment.id,
      checkoutUrl: payment.invoiceUrl ?? null,
    }
  },

  async parseWebhook(rawBody: string, headers: Headers): Promise<NormalizedWebhookEvent> {
    const received = headers.get('asaas-access-token') || ''
    const expected = WEBHOOK_TOKEN || ''

    // Asaas não assina o corpo — o token fixo no header É toda a autenticação.
    // Por isso ele precisa ser longo e não pode vazar em log nenhum.
    const a = Buffer.from(received)
    const b = Buffer.from(expected)
    if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error('Assinatura de webhook inválida (token Asaas)')
    }

    const body = JSON.parse(rawBody) as {
      id?: string
      event?: string
      payment?: {
        id?: string
        externalReference?: string | null
        value?: number
      }
    }

    const eventType = body.event || 'unknown'
    const status: NormalizedWebhookEvent['status'] =
      eventType === 'PAYMENT_CONFIRMED' || eventType === 'PAYMENT_RECEIVED' ? 'paid'
      : eventType === 'PAYMENT_OVERDUE' ? 'failed'
      : 'ignored'

    return {
      externalEventId: body.id || `${eventType}_${body.payment?.id || 'sem-id'}`,
      type: eventType,
      paymentId: body.payment?.externalReference ?? null,
      providerPaymentId: body.payment?.id ?? null,
      status,
      failureReason: status === 'failed' ? 'Cobrança vencida sem pagamento' : null,
      amountCents: body.payment?.value != null ? Math.round(body.payment.value * 100) : null,
    }
  },
}
