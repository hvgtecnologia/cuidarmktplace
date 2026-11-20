'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/server/db/server-client'
import { dashboardForRole } from '@/server/http/guards'
import * as profiles from '@/server/domain/profiles/profiles.repository'

export async function login(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  const role = data.user ? await profiles.findRole(data.user.id) : null

  revalidatePath('/', 'layout')
  redirect(dashboardForRole(role))
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  // NUNCA confiar no `role` que vem do formulário: ele vai para
  // raw_user_meta_data e o trigger handle_new_user() o copia para
  // profiles.role. Sem esta lista branca, um POST com role=admin criaria um
  // administrador. O trigger no banco repete a validação (cobre OAuth e
  // chamadas diretas na API). Admin só é concedido manualmente no banco.
  const requestedRole = formData.get('role')
  const role: 'family' | 'caregiver' = requestedRole === 'caregiver' ? 'caregiver' : 'family'

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  })

  if (error) return { error: error.message }

  if (role === 'caregiver') redirect('/caregiver/onboarding')
  redirect('/family/onboarding')
}

export async function signInWithGoogle() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  })
  if (error) return { error: error.message }
  if (data.url) redirect(data.url)
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Envia o e-mail de recuperação de senha.
 *
 * Roda no servidor para que nenhuma tela precise falar com o Supabase direto.
 * O redirectTo NÃO fixa mais `next=/family/dashboard`: sem o parâmetro, o
 * /auth/callback resolve o destino pelo role, então um cuidador deixa de cair
 * no dashboard de família depois de redefinir a senha.
 */
export async function requestPasswordReset(email: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  })
  if (error) return { error: error.message }
  return { success: true }
}
