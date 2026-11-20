import { createClient } from '@/server/db/server-client'

export type PublicReview = {
  id: string
  caregiver_id: string
  rating: number
  comment: string | null
  created_at: string
}

/**
 * Avaliações de um cuidador para o perfil público.
 *
 * Lê a VIEW, não a tabela: caregiver_public_reviews não tem reviewer_id nem
 * match_id. Antes isto embutia o nome de quem avaliou — o que, cruzado com o
 * family_id que o cuidador já vê nos próprios matches, identificava o autor.
 */
export async function findPublicByCaregiver(caregiverUserId: string, limit = 6): Promise<PublicReview[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caregiver_public_reviews')
    .select('id, caregiver_id, rating, comment, created_at')
    .eq('caregiver_id', caregiverUserId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as PublicReview[]
}

/** A avaliação que o usuário logado já escreveu para este atendimento, se houver. */
export async function findOwnByMatch(matchId: string) {
  const supabase = createClient()
  // reviews_select_own garante que só o autor enxerga; não há .eq extra por isso.
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at')
    .eq('match_id', matchId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Registra a avaliação.
 *
 * Quem valida de verdade é o RLS (reviews_insert_reviewer): confere que o
 * autor é a família DAQUELE match, que o caregiver_id bate com o do match, e
 * que o atendimento foi ao menos aceito. Aqui não há checagem duplicada.
 */
export async function create(fields: {
  matchId: string
  reviewerId: string
  caregiverId: string
  rating: number
  comment: string | null
}) {
  const supabase = createClient()
  const { error } = await supabase.from('reviews').insert({
    match_id: fields.matchId,
    reviewer_id: fields.reviewerId,
    caregiver_id: fields.caregiverId,
    rating: fields.rating,
    comment: fields.comment,
  })

  if (error) throw error
}

/** Corrige a própria avaliação. O GRANT por coluna só deixa mexer em nota e texto. */
export async function updateOwn(matchId: string, rating: number, comment: string | null) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reviews')
    .update({ rating, comment })
    .eq('match_id', matchId)
    .select('id')

  if (error) throw error
  return data?.length ?? 0
}

/** Todas as avaliações, para moderação no admin. */
export async function findAllForAdmin(limit = 100) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id, rating, comment, created_at,
      reviewer:profiles!reviews_reviewer_id_fkey(full_name),
      caregiver:profiles!reviews_caregiver_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
