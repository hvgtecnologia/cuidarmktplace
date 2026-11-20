'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { respondInviteAction } from '@/server/actions/match.actions'

type ActionResult =
  | { success: true; data?: unknown }
  | { success: false; error?: string; code?: string }

export function MatchActions({ matchId, compact = false }: { matchId: string; compact?: boolean }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleResponse = async (status: 'accepted' | 'rejected') => {
    setIsLoading(true)
    const toastId = toast.loading(status === 'accepted' ? 'Aceitando…' : 'Recusando…')

    const result = (await respondInviteAction({ matchId, status })) as ActionResult

    if (result.success) {
      toast.success(
        status === 'accepted' ? 'Convite aceito! Contato liberado.' : 'Convite recusado.',
        { id: toastId }
      )
      router.refresh()
    } else {
      if (result.code === 'SUBSCRIPTION_REQUIRED') {
        toast.error(result.error || 'Assinatura necessária.', { id: toastId })
        router.push('/caregiver/dashboard/plans')
      } else {
        toast.error(result.error || 'Erro ao processar convite.', { id: toastId })
        setIsLoading(false)
      }
    }
  }

  if (compact) {
    return (
      <div className="flex gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleResponse('rejected')}
          disabled={isLoading}
          aria-label="Recusar convite"
          title="Recusar"
          className="h-9 w-9 text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <X className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          onClick={() => handleResponse('accepted')}
          disabled={isLoading}
          aria-label="Aceitar convite"
          title="Aceitar"
          className="h-9 w-9 bg-emerald-600 hover:bg-emerald-700"
        >
          <Check className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 flex-shrink-0">
      <Button
        variant="outline"
        onClick={() => handleResponse('rejected')}
        disabled={isLoading}
        className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
      >
        <X className="w-4 h-4 mr-2" /> Recusar
      </Button>
      <Button
        variant="default"
        onClick={() => handleResponse('accepted')}
        disabled={isLoading}
        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
      >
        <Check className="w-4 h-4 mr-2" /> Aceitar
      </Button>
    </div>
  )
}
