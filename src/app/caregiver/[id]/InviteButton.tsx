'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'

export function InvitePanel({ caregiverUserId, caregiverName }: { caregiverUserId: string; caregiverName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleInvite() {
    setLoading(true)
    toast.loading('Enviando convite…', { id: 'invite' })
    try {
      const { inviteCaregiverAction } = await import('@/app/actions/match')
      const res = await inviteCaregiverAction({ caregiverId: caregiverUserId })
      if (res.success) {
        toast.success(`Convite enviado para ${caregiverName.split(' ')[0]}!`, { id: 'invite' })
        router.push('/family/dashboard/matches')
      } else {
        const code = (res as { code?: string })?.code
        if (code === 'SUBSCRIPTION_REQUIRED') {
          toast.error('Este cuidador exige Pro para convites.', { id: 'invite' })
        } else {
          toast.error(res.error || 'Erro ao enviar convite.', { id: 'invite' })
        }
        setLoading(false)
      }
    } catch (e) {
      toast.error('Falha ao enviar convite.', { id: 'invite' })
      setLoading(false)
    }
  }

  return (
    <div className="bg-white text-foreground rounded-2xl shadow-elevated p-5 w-full md:w-72">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Próximo passo</div>
      <div className="mt-1 text-base font-bold leading-snug">Envie um convite para conversar</div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
        O cuidador responde em até 24h. Sem compromisso.
      </p>
      <Button
        type="button"
        onClick={handleInvite}
        disabled={loading}
        className="w-full h-10 shadow-soft mt-4"
      >
        {loading ? <Icons.spinner className="mr-1.5 w-4 h-4 animate-spin" /> : <Icons.heart className="mr-1.5 w-4 h-4" />}
        Convidar agora
      </Button>
      <Link href="/family/dashboard" className="block mt-2">
        <Button variant="outline" className="w-full h-10">Voltar à busca</Button>
      </Link>
    </div>
  )
}
