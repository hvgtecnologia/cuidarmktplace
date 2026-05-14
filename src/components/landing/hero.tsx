import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'

const STATS = [
  { value: '33M+', label: 'Idosos no Brasil' },
  { value: '8.4k', label: 'Cuidadores na rede' },
  { value: '4.9★', label: 'Avaliação média' },
  { value: '<2h', label: 'Match médio' },
]

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 -left-20 w-[420px] h-[420px] rounded-full bg-primary/15 blur-3xl animate-blob" />
        <div className="absolute -top-10 right-0 w-[380px] h-[380px] rounded-full bg-secondary/15 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-[360px] h-[360px] rounded-full bg-accent/10 blur-3xl animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-grid opacity-[0.18] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      </div>

      <div className="container">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs sm:text-sm font-medium mb-6 animate-fade-in">
            <Icons.sparkles className="w-3.5 h-3.5" />
            O marketplace de cuidadores que sua família merece
          </div>

          <h1 className="text-display-xl text-balance">
            Cuidadores verificados,{' '}
            <span className="gradient-text">sob demanda</span>, em horas.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            A plataforma onde famílias encontram cuidadores e técnicos de enfermagem verificados — por hora, plantão, pernoite ou mensalista. Pagamento seguro, substituição garantida.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register?role=family">
              <Button size="lg" className="w-full sm:w-auto shadow-glow text-base h-12 px-7 group">
                Encontrar um cuidador
                <Icons.arrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/register?role=caregiver">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-12 px-7">
                Sou cuidador profissional
              </Button>
            </Link>
          </div>

          <p className="mt-5 text-xs text-muted-foreground inline-flex items-center gap-2 justify-center flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <Icons.check className="w-3.5 h-3.5 text-secondary" />
              Cadastro grátis
            </span>
            <span className="opacity-50">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Icons.check className="w-3.5 h-3.5 text-secondary" />
              Sem cartão de crédito
            </span>
            <span className="opacity-50">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Icons.check className="w-3.5 h-3.5 text-secondary" />
              Pagamento intermediado
            </span>
          </p>
        </div>

        {/* Stats card */}
        <div className="mt-16 lg:mt-20 max-w-5xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-1 gradient-primary opacity-20 blur-2xl rounded-3xl" />
            <div className="relative bg-card border border-border rounded-3xl shadow-elevated p-6 sm:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold gradient-text tracking-tight">{s.value}</div>
                  <div className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
