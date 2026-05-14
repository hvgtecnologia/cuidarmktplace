import * as z from 'zod'

export const elderlyProfileSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres.' }),
  age: z
    .number({ message: 'Informe a idade.' })
    .min(1, { message: 'Idade inválida.' })
    .max(130, { message: 'Idade inválida.' }),
  sex: z.enum(['M', 'F', 'outro'], { message: 'Selecione o sexo.' }),
  photo_url: z.string().url({ message: 'URL da foto inválida.' }).optional().or(z.literal('')),

  city: z.string().min(2, { message: 'Informe a cidade.' }),
  neighborhood: z.string().min(2, { message: 'Informe o bairro.' }),

  care_needs: z.array(z.string()).min(1, { message: 'Selecione pelo menos uma necessidade.' }),
  preferred_schedule: z.array(z.string()).min(1, { message: 'Selecione pelo menos uma preferência de horário.' }),

  observations: z.string().max(1000, { message: 'Máximo de 1000 caracteres.' }).optional(),

  // Sem .default() para evitar drift entre z.input e z.output —
  // o form fornece false via defaultValues.
  has_stairs: z.boolean(),
  has_ramp: z.boolean(),
  has_adapted_bathroom: z.boolean(),
  has_caregiver_room: z.boolean(),
  has_pets: z.boolean(),
  residence_notes: z.string().max(500, { message: 'Máximo de 500 caracteres.' }).optional(),
})

// IMPORTANTE: usamos z.input (não z.infer) porque o react-hook-form trabalha
// com a forma de ENTRADA do schema (antes de defaults/coerce serem aplicados).
// @hookform/resolvers v5 + zod v4 são estritos quanto a isso.
export type ElderlyProfileFormValues = z.input<typeof elderlyProfileSchema>
export type ElderlyProfileParsed = z.output<typeof elderlyProfileSchema>
