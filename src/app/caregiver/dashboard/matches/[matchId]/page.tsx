import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icons } from '@/components/icons'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { MatchActions } from '@/app/caregiver/dashboard/MatchActions'
import { MATCH_STATUS_META, type MatchStatus } from '@/lib/match-status'
import {
  requestTitle, regionLabel, sexLabel, careNeedLabel, scheduleLabel,
} from '@/lib/match-request'
import { requireRole } from '@/server/http/guards'
import * as matchesRepo from '@/server/domain/matches/matches.repository'
import * as messagesRepo from '@/server/domain/messages/messages.repository'

const NON_CHAT_COPY: Record<string, string> = {
  rejected: 'Você recusou este pedido.',
  cancelled: 'Este pedido foi cancelado.',
}

/** Bloco rotulado do resumo do pedido. */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-sm mt-0.5">{children}</div>
    </div>
  )
}

export default async function CaregiverMatchConversationPage({ params }: { params: { matchId: string } }) {
  const user = await requireRole(['caregiver'])

  // View anonimizada — já filtrada por auth.uid() no banco. Null aqui significa
  // "não existe ou não é seu"; os dois casos levam ao mesmo 404.
  const request = await matchesRepo.findRequestById(params.matchId)
  if (!request) notFound()

  const status = request.status as MatchStatus
  const canChat = status === 'accepted' || status === 'completed'
  const messages = canChat ? await messagesRepo.findByMatch(request.match_id) : []

  const region = regionLabel(request.neighborhood, request.city)
  const sexo = sexLabel(request.sex)
  const needs = request.care_needs ?? []
  const schedules = request.preferred_schedule ?? []

  return (
    <>
      <div className="border-b border-border/60 bg-background flex-shrink-0">
        <div className="flex items-center gap-3 h-16 px-4">
          <Link href="/caregiver/dashboard/matches" className="md:hidden text-muted-foreground hover:text-foreground">
            <Icons.arrowRight className="w-5 h-5 rotate-180" />
          </Link>
          {/* Sem foto: o cuidador não sabe quem é a família. */}
          <div className="h-10 w-10 rounded-full bg-muted grid place-items-center flex-shrink-0 ring-2 ring-border text-muted-foreground">
            <Icons.pin className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold truncate">{requestTitle(request.neighborhood, request.city)}</div>
            <div className="text-xs text-muted-foreground">{MATCH_STATUS_META[status].label}</div>
          </div>
          {status === 'pending' && <MatchActions matchId={request.match_id} compact />}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Resumo do pedido — tudo que se pode saber sem identificar ninguém. */}
        <div className="border-b border-border/60 bg-muted/30 px-4 py-4 flex-shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl">
            <Fact label="Região">{region ?? 'Não informado'}</Fact>
            <Fact label="Quem recebe">
              {[sexo, request.age_range].filter(Boolean).join(' · ') || 'Não informado'}
            </Fact>
            <Fact label="Horários">
              {schedules.length ? schedules.map(scheduleLabel).join(', ') : 'A combinar'}
            </Fact>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Tipo de serviço
            </div>
            {needs.length ? (
              <div className="flex flex-wrap gap-1.5">
                {needs.map((n) => (
                  <span
                    key={n}
                    className="inline-flex rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium"
                  >
                    {careNeedLabel(n)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Não informado.</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
            <Icons.shield className="w-3.5 h-3.5 flex-shrink-0" />
            Os dados de quem contratou são revelados apenas quando o atendimento é agendado.
          </p>
        </div>

        {status === 'pending' ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-sm text-muted-foreground max-w-xs">
              Aceite ao lado do título para liberar a conversa, ou recuse se não for um bom encaixe.
            </p>
          </div>
        ) : canChat ? (
          <ChatPanel matchId={request.match_id} currentUserId={user.id} initialMessages={messages} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-sm text-muted-foreground max-w-xs">
              {NON_CHAT_COPY[status] ?? 'Conversa indisponível.'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
