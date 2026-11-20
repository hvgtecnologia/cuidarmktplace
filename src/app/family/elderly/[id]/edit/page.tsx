import { requireRole } from '@/server/http/guards'
import * as elderly from '@/server/domain/elderly/elderly.repository'
import { redirect } from 'next/navigation'
import { ElderlyProfileForm } from '@/components/forms/elderly/ElderlyProfileForm'
import type { ElderlyProfileFormValues } from '@/server/validations/elderly'

export const metadata = {
  title: 'Editar Perfil de Idoso | Cuide+',
  description: 'Edite o perfil de um idoso.',
}

export default async function EditElderlyPage({ params }: { params: { id: string } }) {
  // O layout de /family já garantiu sessão + role 'family'.
  const user = await requireRole(['family'])

  // findOwnedById filtra por family_id além do RLS: a intenção fica explícita
  // no código, não só na policy.
  const profile = await elderly.findOwnedById(params.id, user.id)
  if (!profile) redirect('/family/dashboard')

  // Prepare initial data mapping precisely to the form schema types
  const initialData: Partial<ElderlyProfileFormValues> = {
    name: profile.name,
    age: profile.age,
    sex: profile.sex as ElderlyProfileFormValues['sex'],
    city: profile.city,
    neighborhood: profile.neighborhood,
    care_needs: profile.care_needs || [],
    preferred_schedule: profile.preferred_schedule || [],
    photo_url: profile.photo_url || '',
    observations: profile.observations || '',
    has_stairs: profile.has_stairs,
    has_ramp: profile.has_ramp,
    has_adapted_bathroom: profile.has_adapted_bathroom,
    has_caregiver_room: profile.has_caregiver_room,
    has_pets: profile.has_pets,
    residence_notes: profile.residence_notes || '',
  }

  return (
    <div className="container max-w-4xl py-10 px-4 md:px-8 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Editar Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Atualize as informações do perfil do idoso.
        </p>
      </div>
      
      <ElderlyProfileForm initialData={initialData} elderlyId={params.id} />
    </div>
  )
}
