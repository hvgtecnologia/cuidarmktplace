'use server'

import { createSafeAction } from '@/lib/safe-action'
import { caregiverSearchSchema } from '@/lib/validations/search'
import { createClient } from '@/lib/supabase/server'

export const searchCaregiversAction = createSafeAction(
  caregiverSearchSchema,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (filters, _userId) => {
    const supabase = createClient()

    let query = supabase
      .from('caregiver_profiles')
      .select(`
        id,
        user_id,
        bio,
        level,
        years_experience,
        specialties,
        certifications,
        coren_number,
        hourly_rate,
        half_day_rate,
        day_shift_rate,
        night_shift_rate,
        overnight_rate,
        full_24h_rate,
        monthly_rate,
        offered_modalities,
        city,
        neighborhood,
        state,
        available_days,
        available_shifts,
        rating_average,
        rating_count,
        jobs_completed,
        is_pro,
        is_featured,
        verification_status,
        profiles:user_id (full_name, avatar_url)
      `)
      .eq('verification_status', 'approved')

    if (filters.specialty) query = query.contains('specialties', [filters.specialty])
    if (filters.shift) query = query.contains('available_shifts', [filters.shift])
    if (filters.modality) query = query.contains('offered_modalities', [filters.modality])
    if (filters.level) query = query.eq('level', filters.level)
    if (filters.city) query = query.ilike('city', `%${filters.city}%`)
    if (filters.maxPrice && filters.maxPrice > 0) {
      query = query.lte('hourly_rate', filters.maxPrice)
    }

    switch (filters.sortBy) {
      case 'price_asc':
        query = query.order('hourly_rate', { ascending: true })
        break
      case 'price_desc':
        query = query.order('hourly_rate', { ascending: false })
        break
      case 'rating_desc':
      default:
        query = query
          .order('is_featured', { ascending: false })
          .order('is_pro', { ascending: false })
          .order('rating_average', { ascending: false })
        break
    }

    const { data: caregivers, error } = await query.limit(50)
    if (error) {
      console.error('Search error:', error)
      throw error
    }
    return caregivers
  }
)
