import { createClient } from '@/server/db/server-client'

export type UserRole = 'family' | 'caregiver' | 'admin'

export async function findById(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, avatar_url, phone, bio_short, document')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function findRole(userId: string): Promise<UserRole | null> {
  const profile = await findById(userId)
  return (profile?.role as UserRole) ?? null
}

/** Listagem de famílias no admin, com a contagem de idosos de cada uma. */
export async function findFamiliesForAdmin() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, avatar_url, is_active, created_at')
    .eq('role', 'family')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data
}

/**
 * Atualiza os dados de conta do próprio usuário.
 *
 * O .eq('id', userId) é redundante com a policy profiles_update_own, mas deixa
 * a intenção explícita. A proteção contra escalar para admin não está aqui e
 * sim no banco: o GRANT por coluna em profiles não inclui `role`.
 */
export async function updateOwn(userId: string, fields: {
  full_name: string
  phone?: string | null
  bio_short?: string | null
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', userId)
    .select('id')

  if (error) throw error
  return data?.length ?? 0
}

/**
 * Grava só o CPF/CNPJ — exigido pelo Asaas para criar cliente/cobrança.
 * Guardado só com dígitos; a máscara é cosmética, da tela.
 */
export async function updateDocument(userId: string, document: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update({ document })
    .eq('id', userId)
    .select('id')

  if (error) throw error
  return data?.length ?? 0
}

/** Grava só o avatar — sem tocar em nome/telefone/bio. */
export async function setAvatarUrl(userId: string, url: string | null) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', userId)
    .select('id')

  if (error) throw error
  return data?.length ?? 0
}

const AVATAR_BUCKET = 'avatars'

/**
 * Envia a foto e devolve a URL pública.
 *
 * O caminho é sempre <user_id>/<arquivo>: as policies do bucket comparam o
 * primeiro segmento da pasta com auth.uid(), então essa convenção é o que
 * impede alguém de sobrescrever a foto de outra pessoa.
 */
export async function uploadAvatar(userId: string, file: File) {
  const supabase = createClient()

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  // Timestamp no nome evita cache velho do CDN depois da troca.
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** Remove da pasta do usuário os arquivos que não são mais o avatar atual. */
export async function cleanupOldAvatars(userId: string, keepUrl: string | null) {
  const supabase = createClient()
  const { data: files } = await supabase.storage.from(AVATAR_BUCKET).list(userId)
  if (!files?.length) return

  const stale = files
    .map((f) => `${userId}/${f.name}`)
    .filter((p) => !keepUrl || !keepUrl.includes(p))

  if (stale.length) await supabase.storage.from(AVATAR_BUCKET).remove(stale)
}
