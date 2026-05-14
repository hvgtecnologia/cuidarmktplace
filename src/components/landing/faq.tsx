'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const FAQS = [
  {
    q: 'Como vocês verificam os cuidadores?',
    a: 'Cada cuidador passa por checagem de documentos (CPF, RG, comprovante de residência), validação de antecedentes criminais, conferência de certificações e uma entrevista por vídeo com nossa equipe. Só depois o perfil fica visível.',
  },
  {
    q: 'Quanto custa para a família usar a Cuide+?',
    a: 'Nada. Famílias buscam, conversam e contratam de forma 100% gratuita. Nossa receita vem das assinaturas opcionais e da taxa cobrada do cuidador quando há um match aceito.',
  },
  {
    q: 'Em quanto tempo encontro um cuidador?',
    a: 'O tempo médio é menor que 24 horas em capitais. Em cidades menores, costuma levar até 72 horas dependendo da especialidade desejada.',
  },
  {
    q: 'Posso conversar antes de fechar?',
    a: 'Claro. O chat seguro permite trocar mensagens, agendar entrevistas (presencial ou por vídeo) e tirar todas as dúvidas antes de qualquer decisão.',
  },
  {
    q: 'O que acontece se algo der errado?',
    a: 'Nossa equipe de suporte humano acompanha cada caso, oferece substituição rápida quando necessário e media qualquer conflito. Você nunca está sozinho.',
  },
  {
    q: 'Como o cuidador recebe o pagamento?',
    a: 'O pagamento é intermediado pela plataforma para sua segurança. O valor é liberado conforme o plantão é realizado, com saque rápido em até 1 dia útil para planos Pro.',
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="duvidas" className="py-20 lg:py-28 scroll-mt-24">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Perguntas frequentes
          </span>
          <h2 className="text-display-md text-balance">Resolvemos sua dúvida</h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Não achou o que precisava? Fale com a gente, é rápido.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                className={cn(
                  'border rounded-2xl bg-card transition-all',
                  isOpen ? 'border-primary/40 shadow-soft' : 'border-border'
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-base">{item.q}</span>
                  <span
                    className={cn(
                      'w-8 h-8 grid place-items-center rounded-full bg-muted text-muted-foreground transition-all flex-shrink-0',
                      isOpen && 'bg-primary text-primary-foreground rotate-180'
                    )}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed animate-fade-in">
                    {item.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
