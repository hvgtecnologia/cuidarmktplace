'use client'

import { useState } from 'react'
import { login, signInWithGoogle } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/icons'
import Link from 'next/link'
import { toast } from 'sonner'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    const formData = new FormData(event.currentTarget)
    const result = await login(formData)
    if (result?.error) {
      toast.error(result.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-background">
      {/* Brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden gradient-primary text-white">
        <div className="absolute inset-0 opacity-30 bg-grid" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />

        <Link href="/" className="relative inline-flex items-center gap-2 z-10">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-white/15 backdrop-blur">
            <Icons.logo className="w-5 h-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">Cuide+</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <Icons.sparkles className="w-8 h-8 mb-6 opacity-90" />
          <blockquote className="text-2xl font-semibold leading-snug text-balance">
            &ldquo;Encontrei a cuidadora perfeita para minha mãe em menos de 24 horas. O processo foi simples e me senti segura o tempo todo.&rdquo;
          </blockquote>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 grid place-items-center font-semibold">
              MS
            </div>
            <div>
              <div className="font-semibold">Maria Silva</div>
              <div className="text-sm text-white/80">Filha do Sr. Antônio · Curitiba</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 max-w-md text-sm">
          {[
            { v: '12k+', l: 'famílias' },
            { v: '4.9★', l: 'avaliação' },
            { v: '24h', l: 'até o match' },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-2xl font-bold">{s.v}</div>
              <div className="text-white/80">{s.l}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* Form */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary text-white">
                <Icons.logo className="w-5 h-5" />
              </span>
              <span className="text-lg font-bold">Cuide+</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta</h1>
            <p className="mt-2 text-muted-foreground">
              Entre na sua conta para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="voce@exemplo.com"
                autoComplete="email"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="h-11 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 shadow-soft" disabled={isLoading}>
              {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
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
            Ainda não tem conta?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Cadastre-se grátis
            </Link>
          </p>

          <p className="mt-6 text-center text-xs text-muted-foreground px-4">
            Ao continuar, você concorda com nossos{' '}
            <Link href="/termos" className="underline hover:text-foreground">Termos</Link>{' '}
            e nossa{' '}
            <Link href="/privacidade" className="underline hover:text-foreground">Privacidade</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
