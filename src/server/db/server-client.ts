import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente Supabase do SERVIDOR, com a sessão do usuário logado.
 *
 * Usa a chave publishable/anon de propósito: toda consulta passa pelo RLS do
 * Postgres com a identidade de quem está logado. É isso que faz a autorização
 * ser à prova de bug de aplicação — esquecer um `where user_id = ...` aqui não
 * vaza dado de ninguém.
 *
 * Só a camada src/server/ deve importar este módulo. Componentes de UI não
 * falam com o banco (há regra de ESLint impedindo).
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Chamado de dentro de um Server Component: o middleware já cuida
            // de renovar a sessão, então pode ignorar.
          }
        },
      },
    }
  )
}
