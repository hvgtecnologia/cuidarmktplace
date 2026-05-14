'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signup, signInWithGoogle } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/icons'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const ROLES = [
  {
    value: 'family',
    title: 'Sou família',
    desc: 'Procuro um cuidador para alguém da minha família.',
    icon: 'handHeart' as const,
  },
  {
    value: 'caregiver',
    title: 'Sou cuidador',
    desc: 'Quero oferecer meus serviços profissionais.',
    icon: 'stethoscope' as const,
  },
] as const

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  )
}

function RegisterInner() {
  const searchParams = useSearchParams()
  const initialRole = (searchParams.get('role') === 'caregiver' ? 'caregiver' : 'family') as 'family' | 'caregiver'
  const [role, setRole] = useState<'family' | 'caregiver'>(initialRole)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    const formData = new FormData(event.currentTarget)
    formData.set('role', role)
    const result = await signup(formData)
    if (result?.error) {
      toast.error(result.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.1fr] bg-background">
      {/* Form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary text-white">
                <Icons.logo className="w-5 h-5" />
              </span>
              <span className="text-lg font-bold">Cuide+</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Crie sua conta</h1>
            <p className="mt-2 text-muted-foreground">
              Comece em menos de 2 minutos. É grátis.
            </p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {ROLES.map((r) => {
              const Icon = Icons[r.icon]
              const active = role === r.value
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    'text-left p-4 rounded-xl border-2 transition-all',
                    active
                      ? 'border-primary bg-primary/5 shadow-soft'
                      : 'border-border hover:border-primary/40 bg-card'
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-lg grid place-items-center mb-2',
                    active ? 'gradient-primary text-white' : 'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="font-semibold text-sm">{r.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug">{r.desc}</div>
                </button>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input id="fullName" name="fullName" placeholder="Como devemos te chamar?" required className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" placeholder="voce@exemplo.com" autoComplete="email" required className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Crie uma senha</Label>
              <Input id="password" name="password" type="password" placeholder="Mínimo 8 caracteres" minLength={8} autoComplete="new-password" required className="h-11" />
              <p className="text-xs text-muted-foreground">
                Use 8+ caracteres com letras, números e símbolos.
              </p>
            </div>

            <Button type="submit" className="w-full h-11 shadow-soft mt-6" disabled={isLoading}>
              {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Criar minha conta
              <Icons.arrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">ou</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <Button
            variant="outline"
            type="button"
            className="w-full h-11"
            onClick={() => signInWithGoogle()}
          >
            <Icons.google className="mr-2 h-4 w-4" />
            Continuar com Google
          </Button>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>

      {/* Brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden gradient-primary text-white order-1 lg:order-2">
        <div className="absolute inset-0 opacity-30 bg-grid" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-blob" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl animate-blob animation-delay-2000" />

        <Link href="/" className="relative inline-flex items-center gap-2 z-10">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-white/15 backdrop-blur">
            <Icons.logo className="w-5 h-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">Cuide+</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-bold leading-tight text-balance mb-4">
            Junte-se à maior comunidade de cuidados do Brasil.
          </h2>
          <p className="text-white/90 text-lg leading-relaxed">
            Mais de 12 mil famílias e 8 mil cuidadores já fazem parte. Bem-vindo.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              'Cadastro 100% gratuito',
              'Verificação de identidade segura',
              'Suporte humano 7 dias por semana',
              'Pagamentos protegidos pela plataforma',
            ].map((b) => (
              <li key={b} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white/20 grid place-items-center">
                  <Icons.check className="w-3.5 h-3.5" />
                </span>
                <span className="text-white/95">{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-sm text-white/70">
          © {new Date().getFullYear()} Cuide+ · O seu idoso em boas mãos.
        </div>
      </aside>
    </div>
  )
}
