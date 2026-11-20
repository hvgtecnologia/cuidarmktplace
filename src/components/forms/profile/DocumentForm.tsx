'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateDocumentAction } from '@/server/actions/profile.actions'

function formatDocument(digits: string) {
  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  // CNPJ: 00.000.000/0000-00
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function DocumentForm({ initialDocument }: { initialDocument: string | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(initialDocument ?? '')

  const digits = value.replace(/\D/g, '')
  const isDirty = digits !== (initialDocument ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const toastId = toast.loading('Salvando…')

    startTransition(async () => {
      const res = await updateDocumentAction({ document: digits })
      if (res.success) {
        toast.success('CPF/CNPJ salvo.', { id: toastId })
        router.refresh()
      } else {
        toast.error(res.error || 'Não foi possível salvar.', { id: toastId })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
      <div className="flex-1 min-w-[220px]">
        <label className="text-sm font-medium" htmlFor="document">CPF ou CNPJ</label>
        <Input
          id="document"
          value={formatDocument(digits)}
          onChange={(e) => setValue(e.target.value)}
          placeholder="000.000.000-00"
          inputMode="numeric"
          className="mt-1.5 h-11"
          maxLength={18}
        />
      </div>
      <Button type="submit" disabled={isPending || !isDirty || (digits.length !== 11 && digits.length !== 14)}>
        {isPending ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}
