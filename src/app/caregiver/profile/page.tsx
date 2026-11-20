import { requireRole } from '@/server/http/guards'
import * as caregivers from '@/server/domain/caregivers/caregivers.repository'
import * as documents from '@/server/domain/caregivers/documents.repository'
import { CaregiverProfileForm } from '@/components/forms/caregiver/CaregiverProfileForm'
import { DocumentUploader } from '@/components/forms/caregiver/DocumentUploader'
import type { CaregiverProfileFormValues } from '@/server/validations/caregiver'

export const metadata = {
  title: 'Meu Perfil Profissional | Cuide+',
  description: 'Edite o seu perfil de cuidador.',
}

export default async function CaregiverProfilePage() {
  // Só cuidador acessa esta tela. Família/admin vão para o próprio dashboard.
  const user = await requireRole(['caregiver'])
  const [profile, docs] = await Promise.all([
    caregivers.findByUserId(user.id),
    documents.findOwn(user.id),
  ])

  // Mapeia os dados do perfil (caso exista) para o Schema do formulário
  let initialData: Partial<CaregiverProfileFormValues> = {}
  
  if (profile) {
    initialData = {
      bio: profile.bio || '',
      specialties: profile.specialties || [],
      hourly_rate: profile.hourly_rate ? Number(profile.hourly_rate) : undefined,
      city: profile.city || '',
      neighborhood: profile.neighborhood || '',
      service_radius_km: profile.service_radius_km ? [profile.service_radius_km] : [10],
      services: profile.services?.length ? profile.services : ['care'],
      vehicle_model: profile.vehicle_model || '',
      vehicle_year: profile.vehicle_year || undefined,
      vehicle_accessible: profile.vehicle_accessible || false,
      driver_license_category: profile.driver_license_category || '',
      trip_rate: profile.trip_rate ? Number(profile.trip_rate) : undefined,
      available_days: profile.available_days || [],
      available_shifts: profile.available_shifts || [],
    }
  }

  return (
    <div className="container max-w-4xl py-10 px-4 md:px-8 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Meu Perfil Profissional</h1>
        <p className="text-muted-foreground mt-2">
          Deixe seu perfil completo e atraente. As famílias analisam cada detalhe na hora da contratação.
        </p>
      </div>
      
      <CaregiverProfileForm 
        initialData={initialData} 
        verificationStatus={profile?.verification_status as 'pending' | 'approved' | 'rejected' | 'resubmit' | undefined} 
      />

      <section className="mt-10 bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-bold">Verificação de documentos</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-5">
          Perfis verificados aparecem antes na busca das famílias. A verificação
          presencial tem prioridade sobre a feita online.
        </p>
        <DocumentUploader documents={docs} />
      </section>
    </div>
  )
}
