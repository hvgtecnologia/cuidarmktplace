import { requireRole } from '@/server/http/guards'

/**
 * Guard de /caregiver/dashboard/*. Note que NÃO existe layout em
 * /caregiver/[id]: aquele é o perfil público do cuidador, que a família
 * precisa abrir antes de convidar (os dados ali são filtrados por RLS).
 */
export default async function CaregiverDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['caregiver'])
  return <>{children}</>
}
