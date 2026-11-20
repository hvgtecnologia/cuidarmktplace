import { createClient } from '@/server/db/server-client'

/** Valores do enum match_status no Postgres. 'finished' NÃO existe lá. */
export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'

/** Convites que a família enviou, com o cuidador de cada um. */
export async function findByFamily(familyId: string) {
  const supabase = createClient()
  // matches.caregiver_id aponta para profiles(id), NÃO para caregiver_profiles.
  // Por isso o embed parte de profiles e desce para caregiver_profiles (1:1 via
  // user_id UNIQUE). Tentar embutir caregiver_profiles direto daqui devolve
  // PGRST200 — não existe FK entre as duas tabelas.
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id, status, created_at, caregiver_id,
      caregiver:profiles!matches_caregiver_id_fkey(
        id, full_name, avatar_url,
        caregiver_profiles ( user_id, hourly_rate, city )
      )
    `)
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Um match específico, com nome dos dois lados — usado pela tela de chat
 * para montar o cabeçalho e checar quem é "eu" vs "o outro".
 * Não filtra por participante: quem não pertence ao match simplesmente não
 * acha a linha, porque matches_select_involved do RLS já barra antes.
 *
 * O embed `family` vem NULO para o cuidador enquanto não houver agendamento
 * firmado — é a policy profiles_select_match_counterpart que decide isso, não
 * esta query. O lado do cuidador deve usar findRequestById(), que devolve os
 * dados anônimos; este findById serve ao lado da FAMÍLIA.
 */
export async function findById(matchId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id, status, family_id, caregiver_id,
      family:profiles!matches_family_id_fkey(id, full_name, avatar_url),
      caregiver:profiles!matches_caregiver_id_fkey(id, full_name, avatar_url)
    `)
    .eq('id', matchId)
    .maybeSingle()

  if (error) throw error
  return data
}

/** O que o cuidador pode saber de um convite: região, serviço e sexo — nunca quem. */
export type MatchRequest = {
  match_id: string
  status: MatchStatus
  created_at: string
  city: string | null
  neighborhood: string | null
  state: string | null
  sex: 'M' | 'F' | 'outro' | null
  care_needs: string[] | null
  preferred_schedule: string[] | null
  age_range: string | null
}

const REQUEST_COLUMNS =
  'match_id, status, created_at, city, neighborhood, state, sex, care_needs, preferred_schedule, age_range'

/**
 * Convites recebidos, ANONIMIZADOS.
 *
 * Lê a view caregiver_match_requests, que já filtra por auth.uid() e expõe só
 * as colunas seguras. Antes isto consultava matches com embed em profiles e
 * entregava o nome da família; agora a identidade nem chega ao servidor.
 */
export async function findRequestsForCaregiver(limit = 200): Promise<MatchRequest[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caregiver_match_requests')
    .select(REQUEST_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as unknown as MatchRequest[]
}

/** Um convite anonimizado. A view já restringe ao cuidador logado. */
export async function findRequestById(matchId: string): Promise<MatchRequest | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caregiver_match_requests')
    .select(REQUEST_COLUMNS)
    .eq('match_id', matchId)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as unknown as MatchRequest | null
}

/**
 * Já existe convite deste cuidador PARA ESTE IDOSO?
 *
 * A checagem inclui elderly_id porque é assim que a UNIQUE da tabela funciona
 * — uma família com pai e mãe cadastrados precisa poder convidar o mesmo
 * cuidador para os dois.
 */
export async function existsFor(familyId: string, caregiverId: string, elderlyId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('matches')
    .select('id')
    .eq('family_id', familyId)
    .eq('caregiver_id', caregiverId)
    .eq('elderly_id', elderlyId)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

/**
 * elderly_id é obrigatório: é dele que saem bairro, serviço e sexo mostrados
 * ao cuidador. O RLS (matches_insert_family) rejeita insert sem ele e também
 * confere que a ficha pertence a quem está convidando.
 */
export async function createInvite(familyId: string, caregiverId: string, elderlyId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('matches')
    .insert({
      family_id: familyId,
      caregiver_id: caregiverId,
      elderly_id: elderlyId,
      status: 'pending',
    })

  if (error) throw error
}

/** Só o cuidador destinatário muda o status — o .eq() garante isso junto ao RLS. */
export async function respondAsCaregiver(matchId: string, caregiverId: string, status: MatchStatus) {
  const supabase = createClient()
  const { error } = await supabase
    .from('matches')
    .update({ status })
    .eq('id', matchId)
    .eq('caregiver_id', caregiverId)

  if (error) throw error
}
