import { Icons } from '@/components/icons'

const ITEMS = [
  { icon: 'shield' as const, label: 'Verificação completa' },
  { icon: 'verified' as const, label: 'LGPD & dados seguros' },
  { icon: 'star' as const, label: 'Avaliações reais' },
  { icon: 'chat' as const, label: 'Suporte humano 7/7' },
  { icon: 'card' as const, label: 'Pagamento intermediado' },
]

export function TrustBar() {
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="container py-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-muted-foreground">
          {ITEMS.map((it) => {
            const Icon = Icons[it.icon]
            return (
              <span key={it.label} className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium">
                <Icon className="w-4 h-4 text-primary" />
                {it.label}
              </span>
            )
          })}
        </div>
      </div>
    </section>
  )
}
