import { NextResponse } from 'next/server'
import { createAdminClient } from '@/server/db/admin-client'
import { DOCUMENT_BUCKET } from '@/server/domain/caregivers/documents.repository'

/**
 * Faxina dos documentos vencidos (certificado e RG, retenção de 7 dias).
 *
 * Por que uma rota e não só SQL: apagar a linha de storage.objects não garante
 * que o binário saia do bucket. Quem remove o arquivo de verdade é a API de
 * Storage, e ela precisa da service role — não há usuário logado num job.
 *
 * A ordem importa: a função SQL apaga os REGISTROS e devolve os caminhos; só
 * depois os arquivos são removidos. Se o segundo passo falhar, sobram bytes
 * órfãos, mas eles já estão inacessíveis — as policies de leitura exigem um
 * caregiver_documents dentro do prazo, e esse registro acabou de sumir.
 * O inverso (apagar arquivo antes do registro) deixaria registro apontando
 * para o nada, o que é pior de diagnosticar.
 *
 * Agendamento: chame uma vez por dia. Em Vercel, vercel.json:
 *   { "crons": [{ "path": "/api/cron/purge-documents", "schedule": "0 4 * * *" }] }
 * Em qualquer outro lugar, um cron batendo com o header abaixo.
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET

  // Sem segredo configurado a rota fica FECHADA. O padrão inseguro seria
  // deixá-la aberta "até configurarem" — e aí qualquer um dispara a faxina.
  if (!secret) {
    console.error('purge-documents: CRON_SECRET não configurado')
    return NextResponse.json({ error: 'cron não configurado' }, { status: 503 })
  }

  const header = request.headers.get('authorization')
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'não autorizado' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()

    const { data, error } = await admin.rpc('purge_expired_caregiver_documents')
    if (error) throw error

    const paths = (data ?? []).map((r: { storage_path: string }) => r.storage_path)
    if (paths.length === 0) {
      return NextResponse.json({ purged: 0 })
    }

    const { error: removeError } = await admin.storage.from(DOCUMENT_BUCKET).remove(paths)
    if (removeError) {
      // Registros já foram apagados, então o acesso já acabou. Avisa alto
      // para alguém limpar os bytes, mas não devolve 500: repetir a rota não
      // recupera esses caminhos (eles não existem mais na tabela).
      console.error('purge-documents: registros apagados, arquivos ficaram:', paths, removeError)
      return NextResponse.json({ purged: paths.length, filesRemoved: false }, { status: 207 })
    }

    return NextResponse.json({ purged: paths.length, filesRemoved: true })
  } catch (e) {
    console.error('purge-documents:', e)
    return NextResponse.json({ error: 'falha na faxina' }, { status: 500 })
  }
}

/** GET para checar se está no ar, sem revelar nada nem apagar coisa alguma. */
export async function GET() {
  return NextResponse.json({ ok: true, configured: Boolean(process.env.CRON_SECRET) })
}
