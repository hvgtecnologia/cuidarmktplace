import { Icons, type IconKey } from '@/components/icons'

const STEPS: Array<{ icon: IconKey; title: string; desc: string }> = [
  {
    icon: 'users',
    title: 'Conte sobre quem você ama',
    desc: 'Em 2 minutos, descreva as necessidades, rotina e preferências do seu idoso. Quanto mais detalhes, melhor o match.',
  },
  {
    icon: 'sparkles',
    title: 'Receba cuidadores compatíveis',
    desc: 'Nossa IA cruza experiência, especialidades e localização para sugerir os profissionais mais alinhados com você.',
  },
  {
    icon: 'shield',
    title: 'Conheça e contrate com segurança',
    desc: 'Veja perfis verificados, leia avaliações reais, converse no chat e formalize tudo direto pela plataforma.',
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 lg:py-28 relative">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Como funciona
          </span>
          <h2 className="text-display-md text-balance">
            Três passos para encontrar a pessoa certa
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Um processo desenhado para ser simples para a família e justo para o cuidador.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {STEPS.map((step, i) => {
            const Icon = Icons[step.icon]
            return (
              <div
                key={step.title}
                className="relative group bg-card border border-border rounded-2xl p-7 hover:shadow-elevated hover:border-primary/30 transition-all duration-300"
              >
                <div className="absolute -top-4 left-7 w-8 h-8 grid place-items-center rounded-lg gradient-primary text-white text-sm font-bold shadow-soft">
                  {i + 1}
                </div>
                <div className="w-12 h-12 grid place-items-center rounded-xl bg-primary/10 text-primary mb-5 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
