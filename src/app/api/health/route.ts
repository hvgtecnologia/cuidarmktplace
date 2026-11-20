import { NextResponse } from 'next/server'

/**
 * Health check — a única rota HTTP que o app expõe hoje.
 *
 * src/app/api/ é a borda para consumidores EXTERNOS: webhook de pagamento,
 * app mobile, integração de terceiro. As telas não passam por aqui: Server
 * Component chama a camada src/server/ direto, sem salto de rede, e mutação
 * de UI vai por server action.
 */
export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ status: 'ok', at: new Date().toISOString() })
}
