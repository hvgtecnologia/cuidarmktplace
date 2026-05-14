import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'

export const metadata: Metadata = { title: 'Política de privacidade' }

export default function PrivacidadePage() {
  return (
    <>
      <SiteHeader />
      <main className="pt-32 pb-20">
        <article className="container max-w-3xl prose prose-slate dark:prose-invert">
          <h1 className="text-display-md mb-2">Política de privacidade</h1>
          <p className="text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          <h2 className="mt-8">Dados que coletamos</h2>
          <p>Coletamos apenas o necessário: cadastro (nome, e-mail, telefone), perfil (foto, bio, especialidades), localização aproximada e histórico de uso da plataforma.</p>
          <h2>Como usamos</h2>
          <p>Para conectar famílias e cuidadores, melhorar nossos algoritmos de match, garantir segurança e cumprir obrigações legais.</p>
          <h2>Com quem compartilhamos</h2>
          <p>Apenas com prestadores essenciais (hospedagem, pagamentos, anti-fraude) sob contratos de confidencialidade. Nunca vendemos seus dados.</p>
          <h2>LGPD</h2>
          <p>Você pode acessar, corrigir, exportar ou excluir seus dados a qualquer momento. Fale com nosso DPO em <a href="mailto:dpo@cuidemais.com.br">dpo@cuidemais.com.br</a>.</p>
          <h2>Cookies</h2>
          <p>Usamos cookies essenciais para login e cookies analíticos para melhorar a experiência. Você controla pelas configurações do navegador.</p>
        </article>
      </main>
      <SiteFooter />
    </>
  )
}
