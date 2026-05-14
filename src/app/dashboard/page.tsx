import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Catch-all: rota neutra que decide pra onde mandar o usuário com base no role.
// Útil para links antigos, e-mails marketing, ou qualquer redirecionamento legado.
export default async function DashboardRouter() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  switch (profile?.role) {
    case 'admin':     redirect('/admin')
    case 'caregiver': redirect('/caregiver/dashboard')
    case 'family':
    default:          redirect('/family/dashboard')
  }
}
