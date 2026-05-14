import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com a equipe Cuide+. Atendimento humano, rápido e por múltiplos canais.',
}

const CHANNELS = [
  { icon: 'mail' as const, title: 'E-mail', value: 'ola@cuidemais.com.br', sub: 'Resposta em até 4h úteis.' },
  { icon: 'phone' as const, title: 'WhatsApp', value: '(11) 99999-0000', sub: 'Seg a Dom · 8h às 22h.' },
  { icon: 'chat' as const, title: 'Chat na plataforma', value: 'Logado, no canto inferior', sub: 'Para clientes ativos.' },
]

export default function ContatoPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="pt-32 pb-16 bg-radial-fade">
          <div className="container max-w-3xl text-center">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Contato</span>
            <h1 className="mt-3 text-display-lg text-balance">Fale com a gente</h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Time real, com gente de verdade, pronta para te ajudar.
            </p>
          </div>
        </section>

        <section className="pb-20">
          <div className="container max-w-5xl grid lg:grid-cols-[1fr_1.2fr] gap-10">
            <div className="space-y-4">
              {CHANNELS.map((c) => {
                const Icon = Icons[c.icon]
                return (
                  <div key={c.title} className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4 hover:border-primary/30 transition-colors">
                    <div className="w-11 h-11 grid place-items-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{c.title}</h3>
                      <p className="text-base font-medium mt-0.5">{c.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <form className="bg-card border border-border rounded-2xl p-7 space-y-4 shadow-soft">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" name="name" required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" required className="h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input id="subject" name="subject" required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea id="message" name="message" rows={5} required />
              </div>
              <Button type="submit" className="w-full h-11 shadow-soft">
                Enviar mensagem
                <Icons.arrowRight className="ml-2 w-4 h-4" />
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Ao enviar, você concorda com nossa <a href="/privacidade" className="underline">política de privacidade</a>.
              </p>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
