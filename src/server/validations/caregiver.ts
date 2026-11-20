import * as z from 'zod'

const baseCaregiverSchema = z.object({
  // Pelo menos uma função: cuidar, dirigir, ou ambas.
  services: z
    .array(z.enum(['care', 'driving']))
    .min(1, { message: 'Selecione pelo menos uma função.' }),
  bio: z.string().max(500, { message: 'Bio não pode ultrapassar 500 caracteres' }).optional(),
  // Idem: especialidades só fazem sentido para quem presta cuidados.
  specialties: z.array(z.string()),
  // Opcional no schema base: quem só dirige não cobra por hora de cuidado.
  // A obrigatoriedade condicional está no superRefine abaixo.
  hourly_rate: z
    .number({ message: 'Informe um valor numérico.' })
    .min(0)
    .optional(),
  city: z.string().min(2, { message: 'Informe a cidade de atuação.' }),
  neighborhood: z.string().min(2, { message: 'Informe o bairro ou região inicial.' }),
  // shadcn slider sempre devolve number[]
  service_radius_km: z.array(z.number()).optional(),
  available_days: z.array(z.string()).min(1, { message: 'Selecione os dias em que está disponível.' }),
  available_shifts: z.array(z.string()).min(1, { message: 'Selecione os turnos em que está disponível.' }),

  // ---- Campos de motorista (só exigidos quando 'driving' está marcado) ----
  vehicle_model: z.string().max(80).optional().or(z.literal('')),
  vehicle_year: z.number().int().min(1950).max(new Date().getFullYear() + 1).optional(),
  vehicle_accessible: z.boolean().optional(),
  driver_license_category: z.string().max(5).optional().or(z.literal('')),
  trip_rate: z.number().min(0).optional(),
})

/**
 * Validação cruzada: o que é obrigatório depende das funções escolhidas.
 *
 * Sem isto, um motorista seria obrigado a informar especialidades de cuidado e
 * valor/hora, e um cuidador seria obrigado a informar modelo de veículo.
 */
export const caregiverProfileSchema = baseCaregiverSchema.superRefine((data, ctx) => {
  const offersCare = data.services.includes('care')
  const offersDriving = data.services.includes('driving')

  if (offersCare) {
    if (!data.specialties || data.specialties.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['specialties'],
        message: 'Selecione pelo menos uma especialidade.',
      })
    }
    if (!data.hourly_rate || data.hourly_rate <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['hourly_rate'],
        message: 'Informe o valor por hora de cuidado.',
      })
    }
  }

  if (offersDriving) {
    if (!data.vehicle_model || data.vehicle_model.trim().length < 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['vehicle_model'],
        message: 'Informe o modelo do veículo.',
      })
    }
    if (!data.driver_license_category) {
      ctx.addIssue({
        code: 'custom',
        path: ['driver_license_category'],
        message: 'Informe a categoria da sua CNH.',
      })
    }
    if (!data.trip_rate || data.trip_rate <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['trip_rate'],
        message: 'Informe o valor por trajeto.',
      })
    }
  }
})

// IMPORTANTE: usamos z.input (não z.infer) porque o react-hook-form trabalha
// com a forma de ENTRADA do schema (antes de defaults/coerce serem aplicados).
// z.infer = z.output (depois do parse). z.input = antes do parse.
// @hookform/resolvers v5 + zod v4 são estritos quanto a isso.
export type CaregiverProfileFormValues = z.input<typeof baseCaregiverSchema>
export type CaregiverProfileParsed = z.output<typeof caregiverProfileSchema>
