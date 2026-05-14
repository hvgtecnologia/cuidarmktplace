import * as z from 'zod'

export const caregiverSearchSchema = z.object({
  specialty: z.string().optional().or(z.literal('')),
  shift: z.string().optional().or(z.literal('')),
  level: z.string().optional().or(z.literal('')),
  modality: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'rating_desc']).default('rating_desc'),
})

export type CaregiverSearchFilters = z.infer<typeof caregiverSearchSchema>
