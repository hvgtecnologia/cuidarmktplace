'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get('email') as string
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/family/dashboard`,
      })
      if (error) {
        toast.error(error.message)
      } else {
        setSent(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary text-white">
            <Icons.logo className="w-5 h-5" />
          </span>
          <span className="text-lg font-bold">Cuide+</span>
        </Link>

        {sent ? (
          <div className="text-center bg-card border border-border rounded-2xl p-8 shadow-soft">
            <div className="w-12 h-12 mx-auto rounded-full bg-secondary/15 text-secondary grid place-items-center mb-4">
              <Icons.check className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Verifique seu e-mail</h1>
            <p className="mt-3 text-muted-foreground">
              Se o e-mail estiver cadastrado, enviamos um link para você redefinir sua senha. Pode demorar alguns minutos.
            </p>
            <Link href="/login" className="inline-block mt-6">
              <Button variant="outline">Voltar ao login</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight">Esqueceu a senha?</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sem problema. Digite seu e-mail e enviaremos um link de recuperação.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" placeholder="voce@exemplo.com" required className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading && <Icons.spinner className="mr-2 w-4 h-4 animate-spin" />}
                Enviar link de recuperação
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Lembrou? <Link href="/login" className="text-primary font-semibold hover:underline">Voltar ao login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
