'use server'

import { revalidatePath } from 'next/cache'
import { createSafeAction } from '@/server/actions/safe-action'
import { caregiverProfileSchema } from '@/server/validations/caregiver'
import { caregiverSearchSchema } from '@/server/validations/search'
import * as caregivers from '@/server/domain/caregivers/caregivers.repository'

export const updateCaregiverProfile = createSafeAction(
  caregiverProfileSchema,
  async (data, userId) => {
    // O Slider do shadcn devolve number[]; o banco espera smallint.
    const radius = Array.isArray(data.service_radius_km) ? data.service_radius_km[0] : 10

    // Campos deliberadamente FORA do payload: verification_status, is_pro,
    // is_featured, rating_*, jobs_completed. São controlados pela plataforma —
    // se entrassem aqui, um cuidador se auto-verificaria.
    const offersCare = data.services.includes('care')
    const offersDriving = data.services.includes('driving')

    await caregivers.upsertProfile(userId, {
      services: data.services,
      bio: data.bio || '',
      city: data.city,
      neighborhood: data.neighborhood,
      // O raio vale para todos os serviços do profissional — não é duplicado
      // por função.
      service_radius_km: radius,
      available_days: data.available_days,
      available_shifts: data.available_shifts,

      // Campos de cuidado: zerados se a pessoa deixar de oferecer cuidados,
      // para não sobrar preço velho aparecendo na busca.
      specialties: offersCare ? data.specialties : [],
      hourly_rate: offersCare ? data.hourly_rate : 0,

      // Idem para os de transporte.
      vehicle_model: offersDriving ? data.vehicle_model || null : null,
      vehicle_year: offersDriving ? data.vehicle_year ?? null : null,
      vehicle_accessible: offersDriving ? Boolean(data.vehicle_accessible) : false,
      driver_license_category: offersDriving ? data.driver_license_category || null : null,
      trip_rate: offersDriving ? data.trip_rate ?? null : null,
    })

    revalidatePath('/caregiver/profile')
    revalidatePath('/caregiver/dashboard')
    return { success: true }
  }
)

export const searchCaregiversAction = createSafeAction(
  caregiverSearchSchema,
  async (filters) => caregivers.search(filters)
)
