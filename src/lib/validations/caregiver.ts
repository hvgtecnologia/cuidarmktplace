import * as z from 'zod'

export const caregiverProfileSchema = z.object({
  bio: z.string().max(500, { message: 'Bio não pode ultrapassar 500 caracteres' }).optional(),
  specialties: z.array(z.string()).min(1, { message: 'Selecione pelo menos uma especialidade.' }),
  hourly_rate: z
    .number({ message: 'Informe um valor numérico.' })
    .min(1, { message: 'O valor cobrado por hora deve ser maior que 0.' }),
  city: z.string().min(2, { message: 'Informe a cidade de atuação.' }),
  neighborhood: z.string().min(2, { message: 'Informe o bairro ou região inicial.' }),
  // shadcn slider sempre devolve number[]
  service_radius_km: z.array(z.number()).optional(),
  available_days: z.array(z.string()).min(1, { message: 'Selecione os dias em que está disponível.' }),
  available_shifts: z.array(z.string()).min(1, { message: 'Selecione os turnos em que está disponível.' }),
})

// IMPORTANTE: usamos z.input (não z.infer) porque o react-hook-form trabalha
// com a forma de ENTRADA do schema (antes de defaults/coerce serem aplicados).
// z.infer = z.output (depois do parse). z.input = antes do parse.
// @hookform/resolvers v5 + zod v4 são estritos quanto a isso.
export type CaregiverProfileFormValues = z.input<typeof caregiverProfileSchema>
export type CaregiverProfileParsed = z.output<typeof caregiverProfileSchema>
