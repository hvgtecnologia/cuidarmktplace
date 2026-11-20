'use client'

import { useParams } from 'next/navigation'

/**
 * Em telas estreitas só cabe uma coluna por vez, então o componente alterna
 * lista/conversa pelo que está selecionado na URL — por isso precisa ser
 * client component (useParams enxerga o [matchId], mesmo estando abaixo
 * deste layout). Em md+ as duas colunas ficam visíveis ao mesmo tempo.
 */
export function MatchesSplitView({ list, children }: { list: React.ReactNode; children: React.ReactNode }) {
  const params = useParams<{ matchId?: string }>()
  const hasSelection = Boolean(params?.matchId)

  return (
    <div className="flex-1 flex min-h-0">
      <aside
        className={`${hasSelection ? 'hidden' : 'flex'} md:flex w-full md:max-w-xs flex-col border-r border-border/60 bg-background min-h-0`}
      >
        {list}
      </aside>
      <section className={`${hasSelection ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-h-0`}>
        {children}
      </section>
    </div>
  )
}
