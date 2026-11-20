import { createClient } from '@/server/db/server-client'
import type { CaregiverSearchFilters } from '@/server/validations/search'

/**
 * Acesso a dados de caregiver_profiles.
 *
 * ATENÇÃO à diferença entre as duas chaves desta tabela:
 *   - `id`      é a PK própria (uuid gerado pela tabela)
 *   - `user_id` é o vínculo com auth.users e o que as policies de RLS usam
 * Buscar por `id` quando se quer o perfil do usuário logado não acha nada.
 * Esse engano já custou o cadastro de cuidador inteiro uma vez.
 */

const LIST_COLUMNS = `
  id, user_id, bio, level, years_experience, specialties, certifications,
  coren_number, hourly_rate, half_day_rate, day_shift_rate, night_shift_rate,
  overnight_rate, full_24h_rate, monthly_rate, offered_modalities,
  services, vehicle_model, vehicle_year, vehicle_accessible,
  driver_license_category, trip_rate, service_radius_km,
  city, neighborhood, state, available_days, available_shifts,
  rating_average, rating_count, jobs_completed, is_pro, is_featured,
  verification_status,
  profiles:user_id (full_name, avatar_url)
`

/** Perfil completo do cuidador logado (ou null se ainda não preencheu). */
export async function findByUserId(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caregiver_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

/** Dados que o cuidador logado vê no próprio dashboard. */
export async function findDashboardStats(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caregiver_profiles')
    .select('rating_average, rating_count, jobs_completed, hourly_rate, is_pro, verification_status')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

/** Perfil público, para a família abrir antes de convidar. */
export async function findPublicProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caregiver_profiles')
    .select(LIST_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

/** Cria ou atualiza o perfil. Upsert por user_id: sem corrida select-then-insert. */
export async function upsertProfile(userId: string, fields: Record<string, unknown>) {
  const supabase = createClient()
  const { error } = await supabase
    .from('caregiver_profiles')
    .upsert({ user_id: userId, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

  if (error) throw error
}

/** Busca pública. Só perfis aprovados — o RLS também garante isso. */
const SEARCH_COLUMNS = `
  id, user_id, bio, level, years_experience, specialties, certifications,
  coren_number, hourly_rate, half_day_rate, day_shift_rate, night_shift_rate,
  overnight_rate, full_24h_rate, monthly_rate, offered_modalities,
  services, vehicle_model, vehicle_year, vehicle_accessible,
  driver_license_category, trip_rate, service_radius_km,
  city, neighborhood, state, available_days, available_shifts,
  rating_average, rating_count, jobs_completed, is_featured,
  verification_status, verification_method, is_paid, rank_tier,
  full_name, avatar_url
`

export async function search(filters: CaregiverSearchFilters) {
  const supabase = createClient()

  // Lê a VIEW caregiver_search, não a tabela: é ela que calcula is_paid na
  // hora e deriva rank_tier. O filtro de aprovado/ativo já está dentro dela.
  let query = supabase
    .from('caregiver_search')
    .select(SEARCH_COLUMNS)

  // Função desejada (cuidados / transporte). Usa o índice GIN em services.
  if (filters.service) query = query.contains('services', [filters.service])
  // Veículo adaptado para cadeirante — só faz sentido junto com transporte.
  if (filters.accessibleVehicle) query = query.eq('vehicle_accessible', true)
  if (filters.specialty) query = query.contains('specialties', [filters.specialty])
  if (filters.shift) query = query.contains('available_shifts', [filters.shift])
  if (filters.modality) query = query.contains('offered_modalities', [filters.modality])
  if (filters.level) query = query.eq('level', filters.level)
  if (filters.city) query = query.ilike('city', `%${filters.city}%`)
  if (filters.maxPrice && filters.maxPrice > 0) query = query.lte('hourly_rate', filters.maxPrice)

  // rank_tier vem SEMPRE primeiro, inclusive quando a família ordena por
  // preço: a ordem de exibição é regra de negócio, não preferência de quem
  // busca. Dentro da mesma faixa é que o critério escolhido manda.
  query = query.order('rank_tier', { ascending: true })

  switch (filters.sortBy) {
    case 'price_asc':
      query = query.order('hourly_rate', { ascending: true })
      break
    case 'price_desc':
      query = query.order('hourly_rate', { ascending: false })
      break
    case 'rating_desc':
    default:
      query = query
        .order('is_featured', { ascending: false })
        .order('rating_average', { ascending: false })
      break
  }

  const { data, error } = await query.limit(50)
  if (error) throw error

  // A view é plana; a UI espera profiles aninhado (como vinha do embed).
  // Adaptar aqui evita mexer em CaregiverList e no card.
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>
    return {
      ...r,
      profiles: { full_name: r.full_name, avatar_url: r.avatar_url },
    }
  })
}

/** Fila de verificação do admin. Liberada pela policy caregiver_select_admin. */
export async function findPendingVerification() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caregiver_profiles')
    .select(`
      id, user_id, level, coren_number, years_experience, certifications,
      created_at, verification_status,
      profiles:user_id (full_name, avatar_url, phone)
    `)
    .in('verification_status', ['pending', 'in_review'])
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) throw error
  return data
}

/** Decisão de verificação. Devolve quantas linhas mudaram (0 = sem permissão). */
export type VerificationMethod = 'online' | 'in_person'

/**
 * Aprova ou recusa, por RPC.
 *
 * Não é UPDATE direto porque caregiver_profiles tem GRANT por coluna: o role
 * `authenticated` não alcança verification_status — e o admin também é
 * `authenticated`. A função roda como DONA e confere is_admin() lá dentro.
 *
 * Esse GRANT existe porque, sem ele, o próprio cuidador fazia PATCH na linha
 * dele e saía aprovado, verificado presencialmente, em destaque e com nota 5.
 */
export async function setVerificationStatus(
  caregiverUserId: string,
  decision: 'approved' | 'rejected',
  notes?: string,
  method?: VerificationMethod | null
): Promise<boolean> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('review_caregiver_verification', {
    p_caregiver: caregiverUserId,
    p_decision: decision,
    p_notes: notes || null,
    p_method: decision === 'approved' ? (method ?? null) : null,
  })

  if (error) throw error
  return data === true
}

/** Listagem completa de cuidadores para o admin. */
export async function findAllForAdmin(limit = 100) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caregiver_profiles')
    .select(`
      id, user_id, level, hourly_rate, city, state, rating_average, rating_count,
      jobs_completed, verification_status, verification_method,
      verification_method_at, is_pro, is_featured, created_at,
      services, trip_rate,
      profiles:user_id (full_name, avatar_url, phone)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Troca só o MÉTODO de verificação, sem mexer no status.
 *
 * Caso real: o cuidador já foi aprovado online e semanas depois é conferido
 * presencialmente — ele saiu da fila de pendentes, então o fluxo de
 * aprovar/recusar não o alcança mais.
 *
 * Vai por RPC porque a função grava quem fez a alteração a partir de
 * auth.uid(); se fosse UPDATE direto, esse campo viria do cliente.
 */
export async function setVerificationMethodOnly(
  caregiverUserId: string,
  method: VerificationMethod
): Promise<boolean> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('set_verification_method', {
    p_caregiver: caregiverUserId,
    p_method: method,
  })

  if (error) throw error
  return data === true
}

/** Perfil público completo, com todas as faixas de preço e disponibilidade. */
export async function findFullPublicProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caregiver_profiles')
    .select(`
      id, user_id, bio, level, years_experience, specialties, certifications,
      coren_number, hourly_rate, half_day_rate, day_shift_rate, night_shift_rate,
      overnight_rate, full_24h_rate, monthly_rate, offered_modalities,
      services, vehicle_model, vehicle_year, vehicle_accessible,
      driver_license_category, trip_rate,
      available_days, available_shifts, service_radius_km,
      city, neighborhood, state, rating_average, rating_count, jobs_completed,
      verification_status, verified_at, is_pro, is_featured,
      profiles:user_id (full_name, avatar_url, is_active, phone)
    `)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}
