'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { sendMessageAction } from '@/server/actions/message.actions'
import type { Message } from '@/lib/types/message'

type ActionResult = { success: true; data?: unknown } | { success: false; error?: string }

const POLL_MS = 4000

export function ChatPanel({
  matchId,
  currentUserId,
  initialMessages,
}: {
  matchId: string
  currentUserId: string
  initialMessages: Message[]
}) {
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [initialMessages.length])

  // Sem realtime por enquanto: refetch periódico via Server Component.
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), POLL_MS)
    return () => clearInterval(timer)
  }, [router])

  function handleSend() {
    const text = body.trim()
    if (!text) return
    setBody('')

    startTransition(async () => {
      const result = (await sendMessageAction({ matchId, body: text })) as ActionResult
      if (!result.success) {
        toast.error(result.error || 'Não foi possível enviar a mensagem.')
        setBody(text)
        return
      }
      router.refresh()
    })
  }

  return (
    <main className="w-full max-w-2xl mx-auto flex-1 flex flex-col py-6 px-4 sm:px-6 min-h-0">
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pb-4">
        {initialMessages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground mt-10">
            Nenhuma mensagem ainda. Diga olá para começar a conversa.
          </p>
        ) : (
          initialMessages.map((m) => {
            const mine = m.sender_id === currentUserId
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
                    mine
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-card border border-border rounded-bl-sm'
                  }`}
                >
                  {m.body}
                  <div className={`text-[10px] mt-1 ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 bg-muted/30 pt-2 flex gap-2 items-end">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Escreva uma mensagem…"
          className="min-h-11 max-h-32 bg-background"
          disabled={isPending}
        />
        <Button onClick={handleSend} disabled={isPending || !body.trim()} size="icon" className="flex-shrink-0">
          <Icons.send className="w-4 h-4" />
        </Button>
      </div>
    </main>
  )
}
