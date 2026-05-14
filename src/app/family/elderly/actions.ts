'use server'

import { createSafeAction } from '@/lib/safe-action'
import { elderlyProfileSchema } from '@/lib/validations/elderly'
import { createClient } from '@/lib/supabase/server'
import * as z from 'zod'

export const createElderlyProfile = createSafeAction(
  elderlyProfileSchema,
  async (data, userId) => {
    const supabase = createClient()
    
    const { data: result, error } = await supabase
      .from('elderly_profiles')
      .insert({
        family_id: userId,
        ...data,
      })
      .select('id')
      .single()
      
    if (error) throw error
    
    return result;
  }
)

const updateSchema = z.object({
  id: z.string().uuid(),
  data: elderlyProfileSchema
})

export const updateElderlyProfile = createSafeAction(
  updateSchema,
  async (payload, userId) => {
    const supabase = createClient()
    
    // RLS: "Família vê e edita próprio perfil do idoso"
    // USING (auth.uid() = family_id)
    const { error } = await supabase
      .from('elderly_profiles')
      .update(payload.data)
      .eq('id', payload.id)
      .eq('family_id', userId) // Extra safety check, though RLS handles it
      
    if (error) throw error
    
    return { success: true };
  }
)
