import { Icons } from '@/components/icons'

const QUOTES = [
  {
    quote: 'Em menos de 24 horas tive 5 candidatas excelentes. Escolhi a Vanessa e ela se tornou parte da família. Cuide+ devolveu nossa paz.',
    name: 'Mariana Lopes',
    role: 'Filha do Sr. Otávio · São Paulo, SP',
    rating: 5,
  },
  {
    quote: 'Trabalhava por aplicativos genéricos e ninguém valorizava minha experiência. Aqui sou reconhecida como profissional de verdade.',
    name: 'Rosana Almeida',
    role: 'Cuidadora há 12 anos · Rio de Janeiro, RJ',
    rating: 5,
  },
  {
    quote: 'O processo de verificação me passou muita segurança. Sentir que minha mãe está com alguém checado faz toda a diferença.',
    name: 'Carlos Eduardo',
    role: 'Filho da Dona Lúcia · Belo Horizonte, MG',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-3">
            Histórias reais
          </span>
          <h2 className="text-display-md text-balance">
            Quem usa, recomenda
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Mais de 12 mil famílias já encontraram o cuidador ideal pela Cuide+.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {QUOTES.map((t, i) => (
            <figure
              key={i}
              className="bg-card border border-border rounded-2xl p-7 flex flex-col hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex gap-0.5 text-highlight mb-4">
                {Array.from({ length: t.rating }).map((_, k) => (
                  <Icons.star key={k} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <blockquote className="text-sm leading-relaxed text-foreground/90 flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 pt-5 border-t border-border/60">
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
