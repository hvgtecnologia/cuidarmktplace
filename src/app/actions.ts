'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function dashboardForRole(role?: string | null) {
  switch (role) {
    case 'admin':     return '/admin'
    case 'caregiver': return '/caregiver/dashboard'
    case 'family':
    default:          return '/family/dashboard'
  }
}

export async function login(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  // Pega o role para rotear para o dashboard certo
  let role: string | null = null
  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    role = profile?.role ?? null
  }

  revalidatePath('/', 'layout')
  redirect(dashboardForRole(role))
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const role = formData.get('role') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: role },
    },
  })

  if (error) return { error: error.message }

  if (role === 'caregiver') redirect('/caregiver/onboarding')
  if (role === 'admin')     redirect('/admin')
  redirect('/family/onboarding')
}

export async function signInWithGoogle() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })
  if (error) return { error: error.message }
  if (data.url) redirect(data.url)
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
