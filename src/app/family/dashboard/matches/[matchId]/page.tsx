import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icons } from '@/components/icons'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { ReviewPanel } from '@/components/reviews/ReviewPanel'
import { MATCH_STATUS_META, type MatchStatus } from '@/lib/match-status'
import { requireRole } from '@/server/http/guards'
import * as matchesRepo from '@/server/domain/matches/matches.repository'
import * as messagesRepo from '@/server/domain/messages/messages.repository'
import * as reviewsRepo from '@/server/domain/reviews/reviews.repository'

type Party = { id: string; full_name: string | null; avatar_url: string | null }

function one<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

const NON_CHAT_COPY: Record<string, string> = {
  pending: 'O convite ainda não foi respondido. A conversa libera assim que o cuidador aceitar.',
  rejected: 'Este cuidador recusou o convite.',
  cancelled: 'Este convite foi cancelado.',
}

export default async function FamilyMatchConversationPage({ params }: { params: { matchId: string } }) {
  const user = await requireRole(['family'])

  const matchRow = await matchesRepo.findById(params.matchId)
  // RLS já barra quem não é desta família — null aqui é "não existe ou não é seu".
  if (!matchRow || matchRow.family_id !== user.id) notFound()

  const caregiver = one<Party>(matchRow.caregiver as Party | Party[] | null)
  const status = matchRow.status as MatchStatus
  const canChat = status === 'accepted' || status === 'completed'

  // Avaliar exige o mesmo que conversar: o cuidador aceitou. É também o que o
  // RLS (reviews_insert_reviewer) exige — a tela não afrouxa a regra.
  const [messages, ownReview] = canChat
    ? await Promise.all([
        messagesRepo.findByMatch(matchRow.id),
        reviewsRepo.findOwnByMatch(matchRow.id),
      ])
    : [[], null]

  return (
    <>
      <div className="border-b border-border/60 bg-background flex-shrink-0">
        <div className="flex items-center gap-3 h-16 px-4">
          <Link href="/family/dashboard/matches" className="md:hidden text-muted-foreground hover:text-foreground">
            <Icons.arrowRight className="w-5 h-5 rotate-180" />
          </Link>
          <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0 ring-2 ring-border">
            {caregiver?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={caregiver.avatar_url} alt={caregiver.full_name ?? ''} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center font-bold text-muted-foreground text-sm">
                {(caregiver?.full_name ?? '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold truncate">{caregiver?.full_name ?? 'Cuidador'}</div>
            <div className="text-xs text-muted-foreground">{MATCH_STATUS_META[status].label}</div>
          </div>
        </div>
      </div>

      {canChat ? (
        <>
          <ReviewPanel
            matchId={matchRow.id}
            caregiverId={matchRow.caregiver_id}
            existing={ownReview ? { rating: ownReview.rating, comment: ownReview.comment } : null}
          />
          <ChatPanel matchId={matchRow.id} currentUserId={user.id} initialMessages={messages} />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-sm text-muted-foreground max-w-xs">
            {NON_CHAT_COPY[status] ?? 'Conversa indisponível.'}
          </p>
        </div>
      )}
    </>
  )
}
