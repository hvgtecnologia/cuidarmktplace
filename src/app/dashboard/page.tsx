import { redirect } from 'next/navigation'
import { dashboardForRole, requireUser } from '@/server/http/guards'

// Catch-all: rota neutra que decide pra onde mandar o usuário com base no role.
// Útil para links antigos, e-mails marketing, ou qualquer redirecionamento legado.
export default async function DashboardRouter() {
  const user = await requireUser()
  redirect(dashboardForRole(user.role))
}
