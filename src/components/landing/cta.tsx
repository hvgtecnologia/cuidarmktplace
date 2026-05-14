import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'

export function CTA() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl gradient-primary animate-gradient text-primary-foreground p-10 sm:p-14 lg:p-20">
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-accent/30 blur-3xl" />

          <div className="relative max-w-2xl">
            <Icons.handHeart className="w-12 h-12 mb-6 opacity-90" />
            <h2 className="text-display-md text-balance">
              Comece hoje a cuidar com tranquilidade
            </h2>
            <p className="mt-4 text-lg text-white/90 max-w-xl text-pretty">
              Crie sua conta em menos de 2 minutos e receba os primeiros perfis ainda hoje. Sem cartão. Sem compromisso.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/register?role=family">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/95 shadow-lg h-12 px-7 text-base"
                >
                  Encontrar um cuidador
                  <Icons.arrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/register?role=caregiver">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white h-12 px-7 text-base"
                >
                  Sou cuidador
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
