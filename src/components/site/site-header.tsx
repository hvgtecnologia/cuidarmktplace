'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/site/theme-toggle'

const NAV_LINKS = [
  { href: '/#como-funciona', label: 'Como funciona' },
  { href: '/#para-familias', label: 'Para famílias' },
  { href: '/#para-cuidadores', label: 'Para cuidadores' },
  { href: '/#planos', label: 'Planos' },
  { href: '/#duvidas', label: 'Dúvidas' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/60 supports-[backdrop-filter]:bg-background/60'
          : 'bg-transparent'
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary text-white shadow-soft group-hover:scale-105 transition-transform">
            <Icons.logo className="w-5 h-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Cuide<span className="text-primary">+</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="shadow-soft">
              Começar grátis
              <Icons.arrowRight className="ml-1 w-4 h-4" />
            </Button>
          </Link>
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setOpen(v => !v)}
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
          >
            {open ? <Icons.close className="w-5 h-5" /> : <Icons.menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl animate-slide-down">
          <div className="container py-4 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-lg text-base font-medium hover:bg-muted/60"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="px-3 py-3 rounded-lg text-base font-medium hover:bg-muted/60"
            >
              Entrar
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
