import { Icons, type IconKey } from '@/components/icons'

const FAMILY_FEATURES: Array<{ icon: IconKey; title: string; desc: string }> = [
  { icon: 'verified', title: 'Cuidadores verificados', desc: 'Documentos, antecedentes e referências checados antes do perfil ir ao ar.' },
  { icon: 'search', title: 'Busca inteligente', desc: 'Filtre por especialidade, turno, raio de atendimento e valor — em segundos.' },
  { icon: 'chat', title: 'Chat seguro', desc: 'Converse com candidatos sem expor seu telefone. Tudo registrado.' },
  { icon: 'star', title: 'Avaliações reais', desc: 'Notas e depoimentos só de famílias que realmente contrataram pela plataforma.' },
  { icon: 'clock', title: 'Match em horas', desc: 'Tempo médio para encontrar o cuidador ideal: menos de 24 horas.' },
  { icon: 'shield', title: 'Suporte humano', desc: 'Time especializado disponível por chat, telefone e WhatsApp 7 dias por semana.' },
]

const CARE_FEATURES: Array<{ icon: IconKey; title: string; desc: string }> = [
  { icon: 'handHeart', title: 'Mais oportunidades', desc: 'Receba convites de famílias compatíveis com seu perfil e região.' },
  { icon: 'graduation', title: 'Crescimento profissional', desc: 'Cursos gratuitos, certificações e selos de especialização.' },
  { icon: 'card', title: 'Pagamentos garantidos', desc: 'Receba sem risco: a plataforma intermedia e protege os seus honorários.' },
  { icon: 'calendar', title: 'Agenda integrada', desc: 'Gerencie disponibilidade, plantões e folgas em um único lugar.' },
]

export function Features() {
  return (
    <section className="py-20 lg:py-28 bg-radial-fade">
      <div className="container">
        <div id="para-familias" className="max-w-2xl mx-auto text-center mb-14 scroll-mt-24">
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Para famílias
          </span>
          <h2 className="text-display-md text-balance">
            Tudo que você precisa para tomar a melhor decisão
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Da primeira busca ao primeiro plantão, com confiança em cada etapa.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FAMILY_FEATURES.map((f) => {
            const Icon = Icons[f.icon]
            return (
              <div key={f.title} className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-soft transition-all">
                <div className="w-11 h-11 grid place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Caregiver section */}
        <div id="para-cuidadores" className="mt-28 scroll-mt-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="inline-block text-sm font-semibold text-secondary uppercase tracking-wider mb-3">
                Para cuidadores
              </span>
              <h2 className="text-display-md text-balance">
                Sua próxima oportunidade está a um swipe daqui
              </h2>
              <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
                Cadastre-se gratuitamente, mostre sua experiência e receba convites de famílias da sua região. Você decide quando, onde e por quanto trabalhar.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Perfil com selo de verificação',
                  'Cobrança automática e segura',
                  'Curso de boas práticas grátis',
                  'Sem comissão sobre o seu valor/hora',
                ].map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 grid place-items-center rounded-full bg-secondary/15 text-secondary">
                      <Icons.check className="w-3.5 h-3.5" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {CARE_FEATURES.map((f, i) => {
                const Icon = Icons[f.icon]
                return (
                  <div
                    key={f.title}
                    className={`bg-card border border-border rounded-2xl p-5 hover:border-secondary/40 hover:shadow-soft transition-all ${i % 2 === 1 ? 'translate-y-6' : ''}`}
                  >
                    <div className="w-10 h-10 grid place-items-center rounded-xl bg-secondary/10 text-secondary mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
