import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente com SERVICE ROLE — ignora RLS por completo.
 *
 * Existe por um motivo só: webhook não tem sessão de usuário. O provedor de
 * pagamento chama nosso endpoint sem cookie nenhum, e ainda assim é preciso
 * atualizar o pagamento de outra pessoa.
 *
 * Regras:
 *  - só pode ser importado de src/server/ (nunca de componente ou página)
 *  - a chave NUNCA leva prefixo NEXT_PUBLIC_
 *  - prefira o cliente normal sempre que houver sessão; o RLS é a proteção
 *    real e aqui ela some
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY ausente. É necessária para processar webhooks ' +
      'de pagamento (eles chegam sem sessão de usuário). Defina no .env.local.'
    )
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
