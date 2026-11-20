'use server'

import { revalidatePath } from 'next/cache'
import * as z from 'zod'
import { createSafeAction } from '@/server/actions/safe-action'
import { elderlyProfileSchema } from '@/server/validations/elderly'
import * as elderly from '@/server/domain/elderly/elderly.repository'

export const createElderlyProfile = createSafeAction(
  elderlyProfileSchema,
  async (data, userId) => {
    const result = await elderly.create(userId, data)
    revalidatePath('/family/dashboard')
    return result
  }
)

const updateSchema = z.object({
  id: z.string().uuid(),
  data: elderlyProfileSchema,
})

export const updateElderlyProfile = createSafeAction(
  updateSchema,
  async (payload, userId) => {
    await elderly.update(payload.id, userId, payload.data)
    revalidatePath('/family/dashboard')
    return { success: true }
  }
)
