'use server'

import { revalidatePath } from 'next/cache'
import * as z from 'zod'
import { createSafeAction } from '@/server/actions/safe-action'
import * as matches from '@/server/domain/matches/matches.repository'
import * as subscriptions from '@/server/domain/subscriptions/subscriptions.repository'

const inviteSchema = z.object({
  caregiverId: z.string().uuid(),
  // Obrigatório: é a ficha do idoso que fornece bairro, serviço e sexo — o
  // único que o cuidador vê do pedido. Sem ela ele decidiria às cegas.
  elderlyId: z.string().uuid({ message: 'Escolha para quem é o atendimento.' }),
})

export const inviteCaregiverAction = createSafeAction(
  inviteSchema,
  async ({ caregiverId, elderlyId }, userId) => {
    // A família não paga nada para convidar (regra de negócio 1).
    // O RLS ainda exige role 'family' E que a ficha seja desta família.
    if (await matches.existsFor(userId, caregiverId, elderlyId)) {
      throw new Error('Você já convidou este cuidador para este idoso.')
    }

    await matches.createInvite(userId, caregiverId, elderlyId)

    revalidatePath('/family/dashboard/matches')
    return { success: true }
  }
)

const respondSchema = z.object({
  matchId: z.string().uuid(),
  // Valores do enum match_status no Postgres.
  status: z.enum(['accepted', 'rejected', 'completed']),
})

export const respondInviteAction = createSafeAction(
  respondSchema,
  async ({ matchId, status }, userId) => {
    if (status === 'accepted' && !(await subscriptions.hasActivePlan(userId))) {
      return {
        _action_business_error: 'SUBSCRIPTION_REQUIRED',
        internalMsg: 'Você precisa de um plano ativo para aceitar.',
      }
    }

    await matches.respondAsCaregiver(matchId, userId, status)

    revalidatePath('/caregiver/dashboard')
    revalidatePath('/caregiver/dashboard/matches')
    return { success: true }
  }
)
