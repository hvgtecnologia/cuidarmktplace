'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { getDocumentUrlAction } from '@/server/actions/document.actions'
import type { DocumentItem } from '@/components/forms/caregiver/DocumentUploader'

const KIND_LABEL: Record<DocumentItem['kind'], string> = {
  rg: 'RG / CNH',
  certificate: 'Certificado',
}

/**
 * Documentos de um cuidador na fila de verificação.
 *
 * A lista que chega aqui já vem filtrada pelo banco: a policy
 * caregiver_documents_select_admin exclui vencidos, então um documento com
 * mais de 7 dias simplesmente não aparece — nem é preciso checar data aqui.
 *
 * A URL é assinada na hora e vale 60s; nada de link permanente.
 */
export function DocumentReviewList({ documents }: { documents: DocumentItem[] }) {
  const [isPending, startTransition] = useTransition()

  function open(path: string) {
    startTransition(async () => {
      const res = await getDocumentUrlAction(path)
      if (res.success) {
        window.open(res.url, '_blank', 'noopener,noreferrer')
      } else {
        toast.error(res.error)
      }
    })
  }

  if (documents.length === 0) {
    return (
      <p className="text-xs text-muted-foreground mt-3">
        Nenhum documento válido — não enviado ainda, ou já passou dos 7 dias de guarda.
      </p>
    )
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {documents.map((d) => (
        <Button
          key={d.id}
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => open(d.storage_path)}
        >
          <Icons.shield className="w-3.5 h-3.5 mr-1.5" />
          {KIND_LABEL[d.kind]}
        </Button>
      ))}
    </div>
  )
}
