import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'

export const metadata: Metadata = { title: 'Termos de uso' }

export default function TermosPage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-32 pb-20">
        <article className="container max-w-3xl prose prose-slate dark:prose-invert">
          <h1 className="text-display-md mb-2">Termos de uso</h1>
          <p className="text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          <h2 className="mt-8">1. Aceite</h2>
          <p>Ao usar a Cuide+, você concorda com estes Termos. Se discordar de qualquer ponto, por favor não utilize a plataforma.</p>
          <h2>2. Uso da plataforma</h2>
          <p>A Cuide+ é um marketplace que conecta famílias a cuidadores de idosos. Não somos empregadores nem agência. Os contratos de prestação de serviço são firmados diretamente entre as partes.</p>
          <h2>3. Cadastro</h2>
          <p>Você precisa ter 18 anos ou mais e fornecer informações verdadeiras. Cuidadores passam por verificação adicional de documentos e antecedentes.</p>
          <h2>4. Pagamentos</h2>
          <p>Famílias usam a plataforma gratuitamente. Cuidadores podem assinar planos pagos ou pagar taxa por match aceito, conforme planos vigentes.</p>
          <h2>5. Conduta</h2>
          <p>É proibido qualquer conteúdo discriminatório, fraudulento, abusivo ou que coloque em risco a integridade dos usuários.</p>
          <h2>6. Suporte e disputas</h2>
          <p>Nossa equipe atua como mediadora em casos de conflito. Reservamo-nos o direito de suspender contas em desacordo com estes Termos.</p>
          <h2>7. Alterações</h2>
          <p>Podemos atualizar estes Termos. Notificaremos os usuários por e-mail e na plataforma.</p>
        </article>
      </main>
      <SiteFooter />
    </>
  )
}
