import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { CTA } from '@/components/landing/cta'
import { Icons } from '@/components/icons'

export const metadata: Metadata = {
  title: 'Sobre nós',
  description: 'Conheça a Cuide+: a missão, a equipe e a forma como mudamos o cuidado ao idoso no Brasil.',
}

const VALUES = [
  { icon: 'handHeart' as const, title: 'Cuidado de verdade', desc: 'Tratamos cada match como se fosse para nossas próprias famílias.' },
  { icon: 'shield' as const, title: 'Confiança em primeiro lugar', desc: 'Verificação rigorosa de cada cuidador antes de qualquer encontro.' },
  { icon: 'sparkles' as const, title: 'Tecnologia humana', desc: 'IA para acelerar o processo. Pessoas para garantir que faça sentido.' },
  { icon: 'graduation' as const, title: 'Educação contínua', desc: 'Cuidadores treinados, atualizados e reconhecidos pelo seu valor.' },
]

export default function SobrePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="pt-32 pb-16 bg-radial-fade">
          <div className="container max-w-4xl text-center">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Sobre a Cuide+</span>
            <h1 className="mt-3 text-display-lg text-balance">
              Estamos aqui porque cuidar bem importa.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground text-pretty leading-relaxed">
              A Cuide+ nasceu de uma história real: a dificuldade de uma família em encontrar um cuidador de confiança em meio a uma situação delicada. Hoje, somos a ponte entre milhares de famílias e profissionais que se importam de verdade.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container max-w-5xl">
            <div className="grid sm:grid-cols-2 gap-5">
              {VALUES.map((v) => {
                const Icon = Icons[v.icon]
                return (
                  <div key={v.title} className="bg-card border border-border rounded-2xl p-7 hover:shadow-soft transition-shadow">
                    <div className="w-12 h-12 grid place-items-center rounded-xl bg-primary/10 text-primary mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container max-w-3xl">
            <h2 className="text-display-md text-balance mb-6">Nossa missão</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Tornar o cuidado ao idoso acessível, seguro e humano para toda família brasileira. Acreditamos que envelhecer com dignidade não é privilégio — é direito. E que cuidar é uma profissão que merece reconhecimento, formação e remuneração justas.
            </p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Por isso construímos uma plataforma que respeita os dois lados: famílias que precisam de tranquilidade e profissionais que precisam de dignidade. É assim que cuidamos do cuidado.
            </p>
          </div>
        </section>

        <CTA />
      </main>
      <SiteFooter />
    </>
  )
}
