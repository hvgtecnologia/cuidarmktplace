'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/server/http/guards'
import * as documents from '@/server/domain/caregivers/documents.repository'
import type { DocumentKind } from '@/server/domain/caregivers/documents.repository'

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const KINDS: DocumentKind[] = ['rg', 'certificate']

/**
 * Envio de certificado ou RG.
 *
 * FormData em vez de createSafeAction porque zod não valida File. A
 * autenticação é feita na mão pelo mesmo motivo.
 *
 * As checagens abaixo são conveniência (mensagem clara); quem de fato impede
 * escrever na pasta alheia é a policy verification_docs_insert_own, e quem
 * define o prazo é o DEFAULT de expires_at no banco.
 */
export async function uploadDocumentAction(formData: FormData) {
  const user = await requireUser()

  if (user.role !== 'caregiver') {
    return { success: false as const, error: 'Apenas cuidadores enviam documentos.' }
  }

  const kind = formData.get('kind')
  if (typeof kind !== 'string' || !KINDS.includes(kind as DocumentKind)) {
    return { success: false as const, error: 'Tipo de documento inválido.' }
  }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { success: false as const, error: 'Nenhum arquivo recebido.' }
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false as const, error: 'Envie uma imagem (JPG, PNG, WebP) ou PDF.' }
  }
  if (file.size > MAX_BYTES) {
    return { success: false as const, error: 'O arquivo precisa ter no máximo 8 MB.' }
  }

  try {
    await documents.upload(user.id, kind as DocumentKind, file)
    revalidatePath('/caregiver/profile')
    return { success: true as const }
  } catch (e) {
    // Sem repassar a mensagem do Storage: ela pode conter caminho interno.
    console.error('uploadDocument:', e)
    return { success: false as const, error: 'Não foi possível enviar o documento.' }
  }
}

/** Remoção antecipada pelo próprio cuidador. */
export async function removeDocumentAction(documentId: string) {
  const user = await requireUser()

  try {
    const removed = await documents.removeOwn(user.id, documentId)
    if (!removed) return { success: false as const, error: 'Documento não encontrado.' }

    revalidatePath('/caregiver/profile')
    return { success: true as const }
  } catch (e) {
    console.error('removeDocument:', e)
    return { success: false as const, error: 'Não foi possível remover o documento.' }
  }
}

/**
 * URL assinada de validade curta, para abrir o documento.
 *
 * Gerada sob demanda e nunca persistida: quem pode pedir é decidido pela
 * policy de leitura do bucket (dono sempre; admin só dentro do prazo).
 */
export async function getDocumentUrlAction(path: string) {
  await requireUser()

  try {
    const url = await documents.signedUrl(path, 60)
    return { success: true as const, url }
  } catch (e) {
    console.error('getDocumentUrl:', e)
    return { success: false as const, error: 'Não foi possível abrir o documento.' }
  }
}
