'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { InviteDialog, type ElderlyOption } from '@/components/matches/InviteDialog'

export function InvitePanel({
  caregiverUserId,
  caregiverName,
  elderly,
}: {
  caregiverUserId: string
  caregiverName: string
  /** Fichas da família logada. Vazio = visitante ou família sem cadastro. */
  elderly: ElderlyOption[]
}) {
  return (
    <div className="bg-white text-foreground rounded-2xl shadow-elevated p-5 w-full md:w-72">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Próximo passo</div>
      <div className="mt-1 text-base font-bold leading-snug">Envie um convite para conversar</div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
        O cuidador responde em até 24h. Sem compromisso.
      </p>

      <InviteDialog
        caregiverUserId={caregiverUserId}
        caregiverName={caregiverName}
        elderly={elderly}
        trigger={(open) => (
          <Button type="button" onClick={open} className="w-full h-10 shadow-soft mt-4">
            <Icons.heart className="mr-1.5 w-4 h-4" />
            Convidar agora
          </Button>
        )}
      />

      <Link href="/family/dashboard" className="block mt-2">
        <Button variant="outline" className="w-full h-10">Voltar à busca</Button>
      </Link>
    </div>
  )
}
