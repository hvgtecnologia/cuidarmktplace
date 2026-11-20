'use server'

import { revalidatePath } from 'next/cache'
import { createSafeAction } from '@/server/actions/safe-action'
import { reviewSchema } from '@/server/validations/review'
import * as reviews from '@/server/domain/reviews/reviews.repository'

/**
 * Avalia um atendimento.
 *
 * Uma avaliação por atendimento — é o UNIQUE em reviews.match_id que garante.
 * Se já existe, atualiza em vez de estourar erro de chave duplicada: para quem
 * usa, é só "mudar de ideia sobre a nota".
 */
export const submitReviewAction = createSafeAction(
  reviewSchema,
  async ({ matchId, caregiverId, rating, comment }, userId) => {
    const text = comment?.trim() || null
    const existing = await reviews.findOwnByMatch(matchId)

    if (existing) {
      await reviews.updateOwn(matchId, rating, text)
    } else {
      await reviews.create({
        matchId,
        reviewerId: userId,
        caregiverId,
        rating,
        comment: text,
      })
    }

    revalidatePath(`/family/dashboard/matches/${matchId}`)
    // A média do cuidador muda (trigger refresh_caregiver_rating) e aparece
    // tanto no perfil público quanto na busca.
    revalidatePath(`/caregiver/${caregiverId}`)
    revalidatePath('/family/dashboard')

    return { success: true, updated: Boolean(existing) }
  }
)
