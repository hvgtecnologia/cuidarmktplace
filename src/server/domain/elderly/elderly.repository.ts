import { createClient } from '@/server/db/server-client'

export async function findByFamily(familyId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('elderly_profiles')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function findOwnedById(elderlyId: string, familyId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('elderly_profiles')
    .select('*')
    .eq('id', elderlyId)
    .eq('family_id', familyId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function create(familyId: string, fields: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('elderly_profiles')
    .insert({ family_id: familyId, ...fields })
    .select('id')
    .single()

  if (error) throw error
  return data
}

export async function update(elderlyId: string, familyId: string, fields: Record<string, unknown>) {
  const supabase = createClient()
  // O .eq('family_id') é redundante com o RLS, mas deixa a intenção explícita.
  const { error } = await supabase
    .from('elderly_profiles')
    .update(fields)
    .eq('id', elderlyId)
    .eq('family_id', familyId)

  if (error) throw error
}

export async function countByFamily(familyId: string) {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('elderly_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('family_id', familyId)

  if (error) throw error
  return count ?? 0
}

/** Quantos idosos cada família cadastrou (usado na listagem do admin). */
export async function countsByFamily(): Promise<Map<string, number>> {
  const supabase = createClient()
  const { data, error } = await supabase.from('elderly_profiles').select('family_id')
  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    counts.set(row.family_id, (counts.get(row.family_id) ?? 0) + 1)
  }
  return counts
}
