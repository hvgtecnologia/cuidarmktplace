'use server'

import { createSafeAction } from '@/lib/safe-action'
import { caregiverProfileSchema } from '@/lib/validations/caregiver'
import { createClient } from '@/lib/supabase/server'


export const updateCaregiverProfile = createSafeAction(
  caregiverProfileSchema,
  async (data, userId) => {
    const supabase = createClient()
    
    // Normalize data (Slider is an array, we want single number or fallback to 10)
    const radius = Array.isArray(data.service_radius_km) 
      ? data.service_radius_km[0] 
      : 10;
    
    // First, verify if the profile row already exists in caregiver_profiles
    const { data: profile } = await supabase
      .from('caregiver_profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (!profile) {
      // Create if it doesn't exist
      const { error } = await supabase
        .from('caregiver_profiles')
        .insert({
          id: userId,
          bio: data.bio || '',
          specialties: data.specialties,
          hourly_rate: data.hourly_rate,
          city: data.city,
          neighborhood: data.neighborhood,
          service_radius_km: radius,
          available_days: data.available_days,
          available_shifts: data.available_shifts,
        });

      if (error) throw error;
    } else {
      // Update if exists
      // RLS Policy "Cuidador vê e edita próprio perfil" USING (auth.uid() = id) prevents updating others
      const { error } = await supabase
        .from('caregiver_profiles')
        .update({
          bio: data.bio || '',
          specialties: data.specialties,
          hourly_rate: data.hourly_rate,
          city: data.city,
          neighborhood: data.neighborhood,
          service_radius_km: radius,
          available_days: data.available_days,
          available_shifts: data.available_shifts,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        
      if (error) throw error;
    }
    
    return { success: true };
  }
)
