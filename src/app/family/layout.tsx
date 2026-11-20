import { requireRole } from '@/server/http/guards'

/**
 * Guard de todas as rotas /family/*. Antes, /family/dashboard só verificava
 * sessão — qualquer cuidador logado abria a busca de cuidadores (e via o botão
 * "Convidar"). /family/elderly/new não checava nem sessão.
 *
 * Isto é defesa em profundidade na UI; o RLS no Postgres é a trava real.
 */
export default async function FamilyLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['family'])
  return <>{children}</>
}
