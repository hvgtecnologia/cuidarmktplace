import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icons, type IconKey } from '@/components/icons'
import { cn } from '@/lib/utils'

type Tier = {
  modality: string
  short: string
  range: string
  desc: string
  icon: IconKey
}

const TIERS: Tier[] = [
  {
    modality: 'Hora avulsa',
    short: '/hora',
    range: 'R$ 50 – 80',
    desc: 'Tarefas pontuais, acompanhamento curto, consultas',
    icon: 'clock',
  },
  {
    modality: 'Plantão diurno · 12h',
    short: '/plantão',
    range: 'R$ 200 – 320',
    desc: '6h às 18h — cobertura completa do dia',
    icon: 'sun',
  },
  {
    modality: 'Plantão noturno · 12h',
    short: '/plantão',
    range: 'R$ 280 – 420',
    desc: '18h às 6h — adicional noturno aplicado',
    icon: 'moon',
  },
  {
    modality: 'Pernoite',
    short: '/noite',
    range: 'R$ 180 – 250',
    desc: 'Cuidador dorme no local, plantão de presença',
    icon: 'moon',
  },
  {
    modality: '24 horas',
    short: '/dia',
    range: 'R$ 350 – 500',
    desc: 'Alta dependência, pós-cirúrgico, paliativos',
    icon: 'shield',
  },
  {
    modality: 'Mensalista 12x36',
    short: '/mês',
    range: 'R$ 3.500 – 5.500',
    desc: 'Cuidador fixo, escala mensal com escrow',
    icon: 'calendar',
  },
]

const FAMILY_INCLUDES = [
  'Buscar e contratar é grátis',
  'Filtro por COREN, Alzheimer, paliativos',
  'Pagamento seguro via plataforma (escrow)',
  'Substituição em até 2h se faltar',
  'Avaliações e histórico verificados',
  'Suporte humano 7 dias por semana',
]

const CAREGIVER_FEE = '15%'
const CAREGIVER_PRO_PRICE = 'R$ 39'

export function Pricing() {
  return (
    <section id="planos" className="py-20 lg:py-28 scroll-mt-24">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Preços de mercado · 2026
          </span>
          <h2 className="text-display-md text-balance">
            Os valores reais do cuidado, sem surpresa.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg text-pretty">
            Você escolhe a modalidade. O cuidador define o valor justo. A Cuide+ garante o pagamento e a confiança.
          </p>
        </div>

        {/* Modalities grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {TIERS.map((t) => {
            const Icon = Icons[t.icon]
            return (
              <div key={t.modality} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-soft transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 grid place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                    referência
                  </span>
                </div>
                <h3 className="mt-3 font-bold">{t.modality}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed min-h-[2rem]">{t.desc}</p>
                <div className="mt-3 pt-3 border-t border-border/60 flex items-baseline gap-1">
                  <span className="text-xl font-bold gradient-text">{t.range}</span>
                  <span className="text-xs text-muted-foreground">{t.short}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Two-column commitment */}
        <div className="mt-16 grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Família */}
          <div className="rounded-3xl border border-primary/30 bg-card p-8 shadow-glow relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/15 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                <Icons.handHeart className="w-3.5 h-3.5" /> Para famílias
              </span>
              <h3 className="mt-4 text-2xl font-bold">100% gratuito</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Você só paga o cuidador. Nenhuma taxa, nenhuma assinatura.
              </p>
              <ul className="mt-6 space-y-2.5">
                {FAMILY_INCLUDES.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm">
                    <Icons.check className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register?role=family" className="mt-7 block">
                <Button className="w-full h-11 shadow-soft">
                  Começar agora <Icons.arrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Cuidador */}
          <div className="rounded-3xl border border-border bg-card p-8 hover:border-secondary/40 hover:shadow-soft transition-all">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider">
              <Icons.stethoscope className="w-3.5 h-3.5" /> Para cuidadores
            </span>
            <h3 className="mt-4 text-2xl font-bold">
              {CAREGIVER_FEE} de taxa <span className="text-base font-medium text-muted-foreground">por hora trabalhada</span>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Sem mensalidade obrigatória. Você só paga quando ganha.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {[
                'Cadastro grátis',
                'Receba convites',
                'Pagamento garantido',
                'Carteira CLT facilitada',
                'Cursos COREN parceiros',
                'Selo de verificação',
              ].map((b) => (
                <div key={b} className="flex items-center gap-2">
                  <Icons.check className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg gradient-primary text-white grid place-items-center flex-shrink-0">
                  <Icons.sparkles className="w-5 h-5" />
                </div>
                <div className="text-sm">
                  <div className="font-bold">Plano Pro · {CAREGIVER_PRO_PRICE}/mês</div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Aparece primeiro · convites ilimitados · saque em 1 dia útil · estatísticas avançadas
                  </p>
                </div>
              </div>
            </div>

            <Link href="/register?role=caregiver" className="mt-6 block">
              <Button variant="outline" className="w-full h-11">
                Quero ser cuidador
              </Button>
            </Link>
          </div>
        </div>

        {/* Trust footnote */}
        <p className="mt-10 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
          Valores baseados em pesquisa de mercado 2026 (CuidadosConecta, Cronoshare, GetNinjas, agências home care).
          A Cuide+ não emprega cuidadores — somos a infraestrutura segura entre famílias e profissionais autônomos.
        </p>
      </div>
    </section>
  )
}
