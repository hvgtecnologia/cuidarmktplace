'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import {
  uploadDocumentAction, removeDocumentAction, getDocumentUrlAction,
} from '@/server/actions/document.actions'

export type DocumentItem = {
  id: string
  kind: 'rg' | 'certificate'
  storage_path: string
  uploaded_at: string
  expires_at: string
}

const KIND_LABEL: Record<DocumentItem['kind'], string> = {
  rg: 'RG ou CNH',
  certificate: 'Certificado do curso',
}

function daysLeft(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now()
  return Math.ceil(ms / 86_400_000)
}

function Row({ doc, onChanged }: { doc: DocumentItem; onChanged: () => void }) {
  const [isPending, startTransition] = useTransition()
  const left = daysLeft(doc.expires_at)
  const expired = left <= 0

  function open() {
    startTransition(async () => {
      const res = await getDocumentUrlAction(doc.storage_path)
      if (res.success) {
        window.open(res.url, '_blank', 'noopener,noreferrer')
      } else {
        toast.error(res.error)
      }
    })
  }

  function remove() {
    startTransition(async () => {
      const res = await removeDocumentAction(doc.id)
      if (res.success) {
        toast.success('Documento removido.')
        onChanged()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      <Icons.shield className={`w-4 h-4 flex-shrink-0 ${expired ? 'text-muted-foreground' : 'text-secondary'}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{KIND_LABEL[doc.kind]}</div>
        <div className="text-xs text-muted-foreground">
          {expired
            ? 'Expirado — envie de novo se a verificação ainda não saiu.'
            : `Apagado automaticamente em ${left} ${left === 1 ? 'dia' : 'dias'}.`}
        </div>
      </div>
      {!expired && (
        <Button variant="ghost" size="sm" onClick={open} disabled={isPending}>
          Ver
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={remove}
        disabled={isPending}
        className="text-destructive hover:bg-destructive/10"
      >
        Remover
      </Button>
    </div>
  )
}

/**
 * Envio de certificado e RG para verificação.
 *
 * O aviso de prazo aparece na tela porque quem manda um documento de
 * identidade precisa saber quanto tempo ele fica guardado — não é detalhe de
 * implementação.
 */
export function DocumentUploader({ documents }: { documents: DocumentItem[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [kind, setKind] = useState<DocumentItem['kind']>('certificate')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const fd = new FormData()
    fd.set('kind', kind)
    fd.set('file', file)

    startTransition(async () => {
      const res = await uploadDocumentAction(fd)
      if (res.success) {
        toast.success('Documento enviado para análise.')
        if (inputRef.current) inputRef.current.value = ''
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-muted/50 border border-border p-3 flex gap-2.5">
        <Icons.clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Certificado e RG ficam guardados por <strong>7 dias</strong> e são apagados
          automaticamente. Só o resultado da verificação continua no seu perfil — a imagem
          do documento, não.
        </p>
      </div>

      <div className="flex gap-2">
        {(['certificate', 'rg'] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all ${
              kind === k ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40'
            }`}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          disabled={isPending}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:opacity-90 file:cursor-pointer"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          JPG, PNG, WebP ou PDF, até 8 MB.
        </p>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icons.spinner className="w-4 h-4 animate-spin" /> Enviando…
        </div>
      )}

      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((d) => (
            <Row key={d.id} doc={d} onChanged={() => router.refresh()} />
          ))}
        </div>
      )}
    </div>
  )
}
