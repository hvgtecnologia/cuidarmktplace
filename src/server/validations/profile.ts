import * as z from 'zod'

/**
 * Dados de conta que o próprio usuário edita, independente do role.
 *
 * Note o que NÃO está aqui: role, is_active, onboarded. Além de ausentes do
 * schema, o banco nega a escrita nessas colunas via GRANT por coluna — então
 * nem um bug nesta camada promoveria alguém a admin.
 */
export const profileSchema = z.object({
  full_name: z
    .string()
    .min(3, { message: 'Informe seu nome completo.' })
    .max(120, { message: 'Nome muito longo.' }),
  phone: z
    .string()
    .max(20, { message: 'Telefone muito longo.' })
    .optional()
    .or(z.literal('')),
  bio_short: z
    .string()
    .max(280, { message: 'Máximo de 280 caracteres.' })
    .optional()
    .or(z.literal('')),
})

export type ProfileFormValues = z.input<typeof profileSchema>
