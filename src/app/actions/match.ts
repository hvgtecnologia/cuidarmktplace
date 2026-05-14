'use server'

import { createSafeAction } from '@/lib/safe-action'
import { createClient } from '@/lib/supabase/server'
import * as z from 'zod'

const inviteSchema = z.object({
  caregiverId: z.string().uuid(),
})

export const inviteCaregiverAction = createSafeAction(
  inviteSchema,
  async ({ caregiverId }, userId) => {
    const supabase = createClient()
    
    // Family does not need a subscription to send invites.

    // Check if match already exists to prevent duplication
    const { data: existing } = await supabase
      .from('matches')
      .select('id')
      .eq('family_id', userId)
      .eq('caregiver_id', caregiverId)
      .single()

    if (existing) {
      throw new Error('Você já interagiu com este cuidador.');
    }

    const { error } = await supabase
      .from('matches')
      .insert({
        family_id: userId,
        caregiver_id: caregiverId,
        status: 'pending'
      })

    if (error) throw error;
    return { success: true };
  }
)

const respondSchema = z.object({
  matchId: z.string().uuid(),
  status: z.enum(['accepted', 'rejected', 'finished']),
})

export const respondInviteAction = createSafeAction(
  respondSchema,
  async ({ matchId, status }, userId) => {
    const supabase = createClient()
    
    if (status === 'accepted') {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', userId)
        .single()
        
      const isValidSub = sub?.status === 'active' && 
        (sub.current_period_end ? new Date(sub.current_period_end) > new Date() : true);
      
      // If caregiver lacks premium plan, they cannot freely accept a match in MVP without the match fee module.
      // We block and prompt them to upgrade or pay the fee.
      if (!isValidSub) {
        return { _action_business_error: 'SUBSCRIPTION_REQUIRED', internalMsg: 'Você precisa de um Plano Premium Ativo para aceitar.' }
      }
    }
    
    // update status where match matches id and caregiver_id is logged in user
    const { error } = await supabase
      .from('matches')
      .update({ status })
      .eq('id', matchId)
      .eq('caregiver_id', userId)

    if (error) throw error;
    return { success: true };
  }
)
