'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { uploadAvatarAction, removeAvatarAction } from '@/server/actions/profile.actions'

const MAX_BYTES = 4 * 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,image/webp'

export function AvatarUploader({
  currentUrl,
  fullName,
}: {
  currentUrl: string | null
  fullName: string
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  // Preview local enquanto o upload acontece — o usuário vê o resultado na hora.
  const [preview, setPreview] = useState<string | null>(null)

  const shown = preview ?? currentUrl
  const initial = fullName.trim().charAt(0).toUpperCase() || '?'

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Valida antes de subir, para dar erro imediato em vez de round-trip.
    if (file.size > MAX_BYTES) {
      toast.error('A imagem precisa ter no máximo 4 MB.')
      e.target.value = ''
      return
    }

    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    const formData = new FormData()
    formData.append('avatar', file)

    const toastId = toast.loading('Enviando foto…')
    startTransition(async () => {
      const res = await uploadAvatarAction(formData)
      URL.revokeObjectURL(localUrl)

      if (res.success) {
        setPreview(null)
        toast.success('Foto atualizada.', { id: toastId })
        router.refresh()
      } else {
        setPreview(null)
        toast.error(res.error, { id: toastId })
      }
      if (inputRef.current) inputRef.current.value = ''
    })
  }

  function onRemove() {
    const toastId = toast.loading('Removendo…')
    startTransition(async () => {
      const res = await removeAvatarAction()
      if (res.success) {
        toast.success('Foto removida.', { id: toastId })
        router.refresh()
      } else {
        toast.error(res.error, { id: toastId })
      }
    })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
      <span className="w-20 h-20 rounded-full overflow-hidden gradient-primary text-white grid place-items-center text-2xl font-bold flex-shrink-0 shadow-soft">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt={fullName} className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Icons.sparkles className="w-4 h-4 mr-1.5" />
            {shown ? 'Trocar foto' : 'Enviar foto'}
          </Button>

          {shown && (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              disabled={isPending}
              onClick={onRemove}
            >
              Remover
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          JPG, PNG ou WebP, até 4 MB. A imagem aparece para famílias e cuidadores.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={onPick}
          className="sr-only"
          aria-label="Escolher foto de perfil"
        />
      </div>
    </div>
  )
}
