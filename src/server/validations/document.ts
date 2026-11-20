import * as z from 'zod'

/**
 * Só confere quantidade de dígitos (11 = CPF, 14 = CNPJ), não o dígito
 * verificador. Quem valida o CPF/CNPJ de fato é o Asaas, na hora de criar o
 * cliente — isto aqui é só para pegar erro de digitação óbvio antes de gastar
 * uma chamada à API.
 */
export const documentSchema = z.object({
  document: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v.length === 11 || v.length === 14, {
      message: 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.',
    }),
})

export type DocumentFormValues = z.input<typeof documentSchema>
