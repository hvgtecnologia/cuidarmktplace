import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export function createSafeAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (input: TInput, userId: string) => Promise<TOutput>
) {
  return async (raw: TInput) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: 'Dados inválidos' };
    }

    try {
      const result = await handler(parsed.data, user.id);
      
      // Allow handlers to return a specific business error structure without throwing
      if (result && typeof result === 'object' && '_action_business_error' in result) {
        return { 
          success: false, 
          error: result.internalMsg || 'Operação não permitida.',
          code: result._action_business_error 
        };
      }
      
      return { success: true, data: result };
    } catch (e) {
      console.error('Action error:', e);
      return { success: false, error: e instanceof Error ? e.message : 'Erro interno' };
    }
  };
}
