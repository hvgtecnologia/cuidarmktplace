import * as z from 'zod';

export const caregiverProfileSchema = z.object({
  bio: z.string().max(500, { message: 'Bio não pode ultrapassar 500 caracteres' }).optional(),
  specialties: z.array(z.string()).min(1, { message: 'Selecione pelo menos uma especialidade.' }),
  hourly_rate: z.coerce.number().min(1, { message: 'O valor cobrado por hora deve ser maior que 0.' }),
  city: z.string().min(2, { message: 'Informe a cidade de atuação.' }),
  neighborhood: z.string().min(2, { message: 'Informe o bairro ou região inicial.' }),
  service_radius_km: z.record(z.array(z.number())).optional().or(z.array(z.number())), // shadcn slider uses number[]
  available_days: z.array(z.string()).min(1, { message: 'Selecione os dias em que está disponível.' }),
  available_shifts: z.array(z.string()).min(1, { message: 'Selecione os turnos em que está disponível.' }),
});

export type CaregiverProfileFormValues = z.infer<typeof caregiverProfileSchema>;
