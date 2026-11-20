import * as z from 'zod'

export const REVIEW_COMMENT_MAX = 600

export const reviewSchema = z.object({
  matchId: z.string().uuid(),
  caregiverId: z.string().uuid(),
  rating: z
    .number({ message: 'Dê uma nota de 1 a 5.' })
    .int()
    .min(1, { message: 'Dê uma nota de 1 a 5.' })
    .max(5, { message: 'Dê uma nota de 1 a 5.' }),
  comment: z
    .string()
    .max(REVIEW_COMMENT_MAX, { message: `Máximo de ${REVIEW_COMMENT_MAX} caracteres.` })
    .optional()
    .or(z.literal('')),
})

export type ReviewFormValues = z.input<typeof reviewSchema>
