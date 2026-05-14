'use server'

import { createSafeAction } from '@/lib/safe-action'
import { createClient } from '@/lib/supabase/server'
import * as z from 'zod'

const checkoutSchema = z.object({
  planCode: z.string(),
})

export const simulateCheckoutAction = createSafeAction(
  checkoutSchema,
  async ({ planCode }, userId) => {
    const supabase = createClient()
    
    // Fake the payment success by directly writing to subscriptions
    // since Asaas is not properly linked in this mock step.
    
    // Clean up past fake plans
    await supabase.from('subscriptions').delete().eq('user_id', userId);
    
    const oneMonthFromNow = new Date()
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)
    
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: planCode,
        status: 'active',
        current_period_end: oneMonthFromNow.toISOString(),
      })

    if (error) throw error;
    return { success: true };
  }
)
