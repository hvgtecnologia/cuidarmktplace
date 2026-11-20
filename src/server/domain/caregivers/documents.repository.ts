import { createClient } from '@/server/db/server-client'

/**
 * Documentos de verificação: certificado e RG.
 *
 * REGRA CENTRAL: estes arquivos vivem UMA SEMANA. O banco guarda o caminho e
 * a data de expiração; o binário fica no bucket privado verification-docs.
 * O que sobrevive ao prazo é só o RESULTADO da conferência, gravado em
 * caregiver_profiles.verification_method — nunca a imagem do documento.
 *
 * O bucket NÃO é público. Nada aqui devolve URL permanente: a leitura é por
 * URL assinada, de validade curta, gerada no servidor.
 */

export const DOCUMENT_BUCKET = 'verification-docs'
export const RETENTION_DAYS = 7

export type DocumentKind = 'rg' | 'certificate'

export type CaregiverDocument = {
  id: string
  kind: DocumentKind
  storage_path: string
  uploaded_at: string
  expires_at: string
}

/** Documentos do cuidador logado, inclusive expirados — a tela avisa quais venceram. */
export async function findOwn(caregiverId: string): Promise<CaregiverDocument[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caregiver_documents')
    .select('id, kind, storage_path, uploaded_at, expires_at')
    .eq('caregiver_id', caregiverId)
    .order('uploaded_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as CaregiverDocument[]
}

/**
 * Documentos de um cuidador para o admin conferir.
 *
 * A policy caregiver_documents_select_admin já exclui os vencidos — passado o
 * prazo, nem o admin alcança, mesmo que a faxina ainda não tenha rodado.
 */
export async function findForReview(caregiverId: string): Promise<CaregiverDocument[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('caregiver_documents')
    .select('id, kind, storage_path, uploaded_at, expires_at')
    .eq('caregiver_id', caregiverId)
    .order('uploaded_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as CaregiverDocument[]
}

/** Envia o arquivo ao bucket privado e registra o caminho + prazo. */
export async function upload(caregiverId: string, kind: DocumentKind, file: File) {
  const supabase = createClient()

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
  // <user_id>/ é o primeiro segmento: é o que as policies do bucket comparam
  // com auth.uid() para impedir escrita na pasta de outra pessoa.
  const path = `${caregiverId}/${kind}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) throw uploadError

  // expires_at NÃO é enviado: o DEFAULT do banco (now() + 7 dias) é a fonte
  // do prazo. Mandar daqui deixaria o cliente influenciar a retenção.
  const { error } = await supabase
    .from('caregiver_documents')
    .insert({ caregiver_id: caregiverId, kind, storage_path: path })

  if (error) {
    // Registro falhou: tira o arquivo para não deixar documento órfão no
    // bucket, fora de qualquer controle de prazo.
    await supabase.storage.from(DOCUMENT_BUCKET).remove([path]).catch(() => {})
    throw error
  }

  return path
}

/** URL temporária para visualizar. Curta de propósito — não é link de compartilhar. */
export async function signedUrl(path: string, expiresInSeconds = 60) {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(path, expiresInSeconds)

  if (error) throw error
  return data.signedUrl
}

/** Remoção antecipada pelo dono. Apaga arquivo e registro. */
export async function removeOwn(caregiverId: string, documentId: string) {
  const supabase = createClient()

  const { data: doc, error: findError } = await supabase
    .from('caregiver_documents')
    .select('storage_path')
    .eq('id', documentId)
    .eq('caregiver_id', caregiverId)
    .maybeSingle()

  if (findError) throw findError
  if (!doc) return false

  await supabase.storage.from(DOCUMENT_BUCKET).remove([doc.storage_path])

  const { error } = await supabase
    .from('caregiver_documents')
    .delete()
    .eq('id', documentId)

  if (error) throw error
  return true
}
