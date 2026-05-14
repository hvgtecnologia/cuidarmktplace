import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CaregiverProfileForm } from '@/components/forms/caregiver/CaregiverProfileForm'
import type { CaregiverProfileFormValues } from '@/lib/validations/caregiver'

export const metadata = {
  title: 'Meu Perfil Profissional | Cuide+',
  description: 'Edite o seu perfil de cuidador.',
}

export default async function CaregiverProfilePage() {
  const supabase = createClient()
  
  // Security check mapping auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // The database will ensure the user can only select this row by RLS "Cuidador vê e edita próprio perfil" USING (auth.uid() = id)
  const { data: profile } = await supabase
    .from('caregiver_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

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
    </div>
  )
}
