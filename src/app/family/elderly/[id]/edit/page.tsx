import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ElderlyProfileForm } from '@/components/forms/elderly/ElderlyProfileForm'
import type { ElderlyProfileFormValues } from '@/lib/validations/elderly'

export const metadata = {
  title: 'Editar Perfil de Idoso | Cuide+',
  description: 'Edite o perfil de um idoso.',
}

export default async function EditElderlyPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  // Security Checks
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Load elderly profile. RLS prevents fetching profiles that don't belong to the user
  const { data: profile, error } = await supabase
    .from('elderly_profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !profile) {
    // Return unauthorized / not found gracefully
    redirect('/family/dashboard')
  }

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
