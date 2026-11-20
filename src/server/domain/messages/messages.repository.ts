import { createClient } from '@/server/db/server-client'
import type { Message } from '@/lib/types/message'

export type { Message }

export async function findByMatch(matchId: string): Promise<Message[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('id, match_id, sender_id, body, created_at')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

/**
 * O RLS (messages_insert_match_member) é quem decide se isto é permitido:
 * sender_id = auth.uid() e o match precisa estar 'accepted'. Se a política
 * barrar, o insert falha com erro 42501 — não há checagem duplicada aqui.
 */
export async function send(matchId: string, senderId: string, body: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('messages')
    .insert({ match_id: matchId, sender_id: senderId, body })

  if (error) throw error
}
