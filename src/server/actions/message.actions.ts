'use server'

import { revalidatePath } from 'next/cache'
import * as z from 'zod'
import { createSafeAction } from '@/server/actions/safe-action'
import * as messages from '@/server/domain/messages/messages.repository'

const sendSchema = z.object({
  matchId: z.string().uuid(),
  body: z.string().trim().min(1, 'Escreva algo antes de enviar.').max(2000),
})

export const sendMessageAction = createSafeAction(
  sendSchema,
  async ({ matchId, body }, userId) => {
    await messages.send(matchId, userId, body)
    revalidatePath(`/family/dashboard/matches/${matchId}`)
    revalidatePath(`/caregiver/dashboard/matches/${matchId}`)
    return { success: true }
  }
)
