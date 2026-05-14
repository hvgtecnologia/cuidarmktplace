import { createClient } from '@/lib/supabase/server'
import { Icons } from '@/components/icons'

export const metadata = { title: 'Avaliações · Admin' }

export default async function AdminReviewsPage() {
  const supabase = createClient()

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id, rating, comment, created_at,
      reviewer:profiles!reviews_reviewer_id_fkey(full_name),
      caregiver:profiles!reviews_caregiver_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const items = reviews || []
  const avg = items.length > 0 ? items.reduce((s, r) => s + (r.rating || 0), 0) / items.length : 0
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: items.filter((r) => r.rating === star).length,
  }))

  return (
    <div className="p-8 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-display-md">Avaliações</h1>
        <p className="text-muted-foreground mt-1">{items.length} reviews na plataforma</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <div className="text-5xl font-bold gradient-text">{avg.toFixed(1)}</div>
          <div className="flex justify-center gap-0.5 mt-2 text-highlight">
            {Array.from({ length: 5 }).map((_, i) => (
              <Icons.star key={i} className={`w-4 h-4 ${i < Math.round(avg) ? 'fill-highlight' : ''}`} />
            ))}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Média geral</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 lg:col-span-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Distribuição</div>
          <div className="space-y-1.5">
            {distribution.map((d) => {
              const pct = items.length > 0 ? (d.count / items.length) * 100 : 0
              return (
                <div key={d.star} className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-right font-semibold">{d.star}★</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-highlight transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-muted-foreground">{d.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((r) => {
          const reviewer = Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer
          const caregiver = Array.isArray(r.caregiver) ? r.caregiver[0] : r.caregiver
          return (
            <div key={r.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{reviewer?.full_name || 'Família'}</div>
                  <div className="text-xs text-muted-foreground">para <strong>{caregiver?.full_name}</strong> · {new Date(r.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="flex gap-0.5 text-highlight flex-shrink-0">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Icons.star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>
              {r.comment && (
                <p className="mt-3 text-sm text-foreground/80">&ldquo;{r.comment}&rdquo;</p>
              )}
            </div>
          )
        })}
        {items.length === 0 && (
          <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
            Nenhuma avaliação ainda.
          </div>
        )}
      </div>
    </div>
  )
}
