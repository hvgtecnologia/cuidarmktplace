import Link from 'next/link'
import { requireUser, dashboardForRole } from '@/server/http/guards'
import * as profiles from '@/server/domain/profiles/profiles.repository'
import { listProducts, paymentProviderRequiresDocument } from '@/server/domain/payments/payments.service'
import { findByUser as findSubscription } from '@/server/domain/subscriptions/subscriptions.repository'
import { ProfileForm } from '@/components/forms/profile/ProfileForm'
import { AvatarUploader } from '@/components/forms/profile/AvatarUploader'
import { DocumentForm } from '@/components/forms/profile/DocumentForm'
import { CheckoutPanel } from '@/components/payments/CheckoutPanel'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Minha conta · Cuide+',
  description: 'Seus dados de cadastro.',
}

const ROLE_LABEL: Record<string, string> = {
  family: 'Família',
  caregiver: 'Cuidador',
  admin: 'Administrador',
}

/** Cabeçalho de seção no padrão de telas de configuração: título à esquerda,
 *  conteúdo à direita em telas largas. */
function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="grid lg:grid-cols-[260px_1fr] gap-6 py-8 border-b border-border last:border-0">
      <div>
        <h2 className="text-base font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

/**
 * Dados de conta — vale para os três roles.
 *
 * Distinta de /caregiver/profile, que é o perfil PROFISSIONAL do cuidador
 * (especialidades, valor/hora, disponibilidade). Aqui é só quem a pessoa é.
 */
export default async function ProfilePage() {
  const user = await requireUser()
  const profile = await profiles.findById(user.id)
  const fullName = profile?.full_name ?? ''

  // Assinatura só existe para cuidador (regra de negócio: família não paga).
  const [products, subscription] = user.role === 'caregiver'
    ? await Promise.all([listProducts().catch(() => []), findSubscription(user.id)])
    : [[], null]

  const isPlanActive =
    subscription?.status === 'active' &&
    (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())

  // Taxa por match é cobrança avulsa, não assinatura — fora da lista de planos.
  const plans = (products ?? []).filter((p) => p.grants_plan !== null)
  const needsDocument = user.role === 'caregiver' && paymentProviderRequiresDocument()

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background sticky top-0 z-30">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary text-white">
              <Icons.logo className="w-5 h-5" />
            </span>
            <span className="text-lg font-bold">Cuide<span className="text-primary">+</span></span>
          </Link>
          <Link href={dashboardForRole(user.role)}>
            <Button variant="ghost" size="sm">
              <Icons.arrowRight className="w-4 h-4 mr-1 rotate-180" />
              Voltar ao painel
            </Button>
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl py-10 px-4">
        <div className="mb-2 flex items-center gap-3 flex-wrap">
          <h1 className="text-display-md">Minha conta</h1>
          <Badge variant="outline" className="text-xs">
            {ROLE_LABEL[user.role] ?? user.role}
          </Badge>
        </div>
        <p className="text-muted-foreground mb-4">
          Gerencie seus dados pessoais e como você aparece na plataforma.
        </p>

        <div className="bg-card border border-border rounded-2xl px-6 lg:px-8">
          <Section
            title="Foto de perfil"
            description="Ajuda famílias e cuidadores a reconhecerem você."
          >
            <AvatarUploader currentUrl={profile?.avatar_url ?? null} fullName={fullName} />
          </Section>

          <Section
            title="Dados pessoais"
            description="Nome e contato usados na plataforma."
          >
            <ProfileForm
              initialData={{
                full_name: fullName,
                phone: profile?.phone ?? '',
                bio_short: profile?.bio_short ?? '',
              }}
            />
          </Section>

          <Section
            title="Acesso"
            description="E-mail e senha da sua conta."
          >
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium" htmlFor="account-email">E-mail</label>
                <input
                  id="account-email"
                  value={user.email ?? ''}
                  readOnly
                  disabled
                  className="mt-1.5 flex h-11 w-full rounded-lg border border-input bg-muted/50 px-3 text-sm text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  O e-mail não pode ser alterado por aqui — fale com o suporte.
                </p>
              </div>

              <div>
                <div className="text-sm font-medium">Senha</div>
                <p className="text-xs text-muted-foreground mt-1 mb-2">
                  Enviamos um link de redefinição para o seu e-mail.
                </p>
                <Link href="/forgot-password">
                  <Button variant="outline" size="sm">Alterar senha</Button>
                </Link>
              </div>
            </div>
          </Section>

          {user.role === 'caregiver' && (
            <Section
              title="Perfil profissional"
              description="Especialidades, valor por hora e disponibilidade."
            >
              <p className="text-sm text-muted-foreground mb-3">
                Os dados que as famílias veem na busca ficam em uma tela separada.
              </p>
              <Link href="/caregiver/profile">
                <Button variant="outline">
                  <Icons.stethoscope className="w-4 h-4 mr-1.5" />
                  Editar perfil profissional
                </Button>
              </Link>
            </Section>
          )}

          {user.role === 'caregiver' && (
            <Section
              title="Pagamento e plano"
              description="Seu plano atual e como pagar para trocar."
            >
              {isPlanActive && (
                <div className="mb-5 bg-secondary/10 border border-secondary/30 rounded-xl p-4">
                  <Badge className="bg-secondary text-secondary-foreground mb-2">
                    <Icons.verified className="w-3 h-3 mr-1" /> Plano ativo
                  </Badge>
                  <p className="text-sm">
                    Seu plano <strong>{subscription?.plan}</strong> vale até{' '}
                    {subscription?.current_period_end
                      ? new Date(subscription.current_period_end).toLocaleDateString('pt-BR')
                      : '—'}
                    .
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pagar de novo — mesmo plano ou outro — soma ao tempo que ainda resta.
                  </p>
                </div>
              )}

              {needsDocument && (
                <div className="mb-5">
                  <p className="text-sm font-medium mb-2">CPF/CNPJ</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Exigido pelo provedor de pagamento para gerar a cobrança.
                  </p>
                  <DocumentForm initialDocument={profile?.document ?? null} />
                </div>
              )}

              {plans.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum plano disponível no momento.
                </p>
              ) : needsDocument && !profile?.document ? (
                <p className="text-sm text-muted-foreground">
                  Preencha o CPF/CNPJ acima para ver as opções de plano.
                </p>
              ) : (
                <CheckoutPanel products={plans} />
              )}
            </Section>
          )}
        </div>
      </main>
    </div>
  )
}
