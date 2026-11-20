export type CaregiverLevel = 'companion' | 'basic' | 'technical' | 'nurse'
export type VerificationStatus = 'pending' | 'in_review' | 'approved' | 'rejected'

/** Colunas devolvidas na listagem/busca pública de cuidadores. */
export type CaregiverListItem = {
  id: string
  user_id: string
  bio: string
  level: CaregiverLevel
  years_experience: number
  specialties: string[]
  certifications?: string[]
  coren_number?: string | null
  hourly_rate: number
  half_day_rate?: number | null
  day_shift_rate?: number | null
  night_shift_rate?: number | null
  overnight_rate?: number | null
  full_24h_rate?: number | null
  monthly_rate?: number | null
  offered_modalities?: string[]
  city: string
  neighborhood: string
  available_shifts: string[]
  rating_average: number
  rating_count: number
  jobs_completed?: number
  is_pro?: boolean
  is_featured?: boolean
  verification_status?: VerificationStatus
  profiles: { full_name: string; avatar_url: string | null } | null
}
