'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { respondInviteAction } from '@/app/actions/match'

export function MatchActions({ matchId }: { matchId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleResponse = async (status: 'accepted' | 'rejected') => {
    setIsLoading(true)
    const toastId = toast.loading(status === 'accepted' ? 'Aceitando...' : 'Recusando...')
    
    const result = await respondInviteAction({ matchId, status })
    
    if (result.success) {
      toast.success(status === 'accepted' ? 'Convite aceito! Contato liberado.' : 'Convite recusado.', { id: toastId })
      router.refresh()
    } else {
      if ((result as any).code === 'SUBSCRIPTION_REQUIRED') {
        toast.error((result as any).error || 'Assinatura necessária.', { id: toastId })
        // Roteia para o painel de assinatura caso não tenha o plano premium
        router.push('/caregiver/dashboard/plans')
      } else {
        toast.error(result.error || 'Erro ao processar convite.', { id: toastId })
        setIsLoading(false)
      }
    }
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
