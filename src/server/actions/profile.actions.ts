'use server'

import { revalidatePath } from 'next/cache'
import { createSafeAction } from '@/server/actions/safe-action'
import { profileSchema } from '@/server/validations/profile'
import { documentSchema } from '@/server/validations/document'
import * as profiles from '@/server/domain/profiles/profiles.repository'
import { requireUser } from '@/server/http/guards'

export const updateOwnProfile = createSafeAction(
  profileSchema,
  async (data, userId) => {
    // Campo vazio vira NULL em vez de string vazia.
    // avatar_url fica de fora: é gerenciado pelo uploader, não por este form.
    const updated = await profiles.updateOwn(userId, {
      full_name: data.full_name.trim(),
      phone: data.phone?.trim() || null,
      bio_short: data.bio_short?.trim() || null,
    })

    if (updated === 0) {
      throw new Error('Nada foi atualizado — verifique suas permissões.')
    }

    // O nome e a foto aparecem no UserMenu de todo layout.
    revalidatePath('/', 'layout')
    return { success: true }
  }
)

export const updateDocumentAction = createSafeAction(
  documentSchema,
  async ({ document }, userId) => {
    const updated = await profiles.updateDocument(userId, document)
    if (updated === 0) {
      throw new Error('Nada foi atualizado — verifique suas permissões.')
    }

    revalidatePath('/profile')
    return { success: true }
  }
)

const MAX_AVATAR_BYTES = 4 * 1024 * 1024 // 4 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Upload da foto de perfil.
 *
 * Recebe FormData em vez de passar pelo createSafeAction: zod não valida File,
 * e a checagem aqui é de tipo/tamanho do arquivo. A autenticação é feita na
 * mão pelo mesmo motivo.
 *
 * O arquivo não chega ao cliente do Supabase sem passar por estas validações —
 * mas elas são conveniência, não segurança: o que de fato impede alguém de
 * escrever na pasta de outro é a policy avatars_insert_own.
 */
export async function uploadAvatarAction(formData: FormData) {
  const user = await requireUser()
  const file = formData.get('avatar')

  if (!(file instanceof File) || file.size === 0) {
    return { success: false as const, error: 'Nenhum arquivo recebido.' }
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false as const, error: 'Use uma imagem JPG, PNG ou WebP.' }
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { success: false as const, error: 'A imagem precisa ter no máximo 4 MB.' }
  }

  try {
    const publicUrl = await profiles.uploadAvatar(user.id, file)
    await profiles.setAvatarUrl(user.id, publicUrl)
    // Melhor esforço: falhar a limpeza não deve derrubar o upload.
    await profiles.cleanupOldAvatars(user.id, publicUrl).catch(() => {})

    revalidatePath('/', 'layout')
    return { success: true as const, url: publicUrl }
  } catch (e) {
    console.error('uploadAvatar:', e)
    return { success: false as const, error: 'Não foi possível enviar a imagem.' }
  }
}

/** Remove a foto atual e limpa os arquivos do usuário no bucket. */
export async function removeAvatarAction() {
  const user = await requireUser()

  try {
    await profiles.setAvatarUrl(user.id, null)
    await profiles.cleanupOldAvatars(user.id, null).catch(() => {})

    revalidatePath('/', 'layout')
    return { success: true as const }
  } catch (e) {
    console.error('removeAvatar:', e)
    return { success: false as const, error: 'Não foi possível remover a imagem.' }
  }
}
