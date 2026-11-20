'use server'

import { revalidatePath } from 'next/cache'
import * as z from 'zod'
import { createSafeAction } from '@/server/actions/safe-action'
import * as caregivers from '@/server/domain/caregivers/caregivers.repository'
import * as profiles from '@/server/domain/profiles/profiles.repository'

const reviewSchema = z.object({
  caregiverUserId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  notes: z.string().max(500).optional(),
  // Como a conferência foi feita. Define a posição do cuidador na vitrine:
  // presencial vence online, que vence nenhuma.
  method: z.enum(['online', 'in_person']).optional(),
})

/**
 * Aprova ou recusa a verificação de um cuidador.
 *
 * A autorização real é a policy caregiver_update_admin (USING is_admin()): se
 * quem chamar não for admin, o UPDATE casa com 0 linhas. A checagem de role
 * abaixo existe para devolver mensagem clara em vez de um "0 linhas" mudo.
 */
export const reviewCaregiverVerification = createSafeAction(
  reviewSchema,
  async ({ caregiverUserId, decision, notes, method }, userId) => {
    if ((await profiles.findRole(userId)) !== 'admin') {
      return { _action_business_error: 'FORBIDDEN', internalMsg: 'Ação restrita a administradores.' }
    }

    const ok = await caregivers.setVerificationStatus(caregiverUserId, decision, notes, method)
    if (!ok) {
      throw new Error('Nenhum perfil atualizado — verifique suas permissões.')
    }

    revalidatePath('/admin/verification')
    revalidatePath('/admin')
    revalidatePath('/admin/caregivers')
    return { success: true }
  }
)

const methodSchema = z.object({
  caregiverUserId: z.string().uuid(),
  method: z.enum(['online', 'in_person']),
})

/**
 * Registra como o cuidador foi verificado, sem passar pela fila.
 *
 * A autorização real está dentro de set_verification_method, que levanta
 * exceção se quem chamou não for admin. A checagem abaixo só devolve uma
 * mensagem melhor antes de chegar lá.
 */
export const setCaregiverVerificationMethod = createSafeAction(
  methodSchema,
  async ({ caregiverUserId, method }, userId) => {
    if ((await profiles.findRole(userId)) !== 'admin') {
      return { _action_business_error: 'FORBIDDEN', internalMsg: 'Ação restrita a administradores.' }
    }

    const ok = await caregivers.setVerificationMethodOnly(caregiverUserId, method)
    if (!ok) {
      throw new Error('Só é possível registrar verificação de um perfil já aprovado.')
    }

    revalidatePath('/admin/caregivers')
    revalidatePath('/admin/verification')
    return { success: true }
  }
)
