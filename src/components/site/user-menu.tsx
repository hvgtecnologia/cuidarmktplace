'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Icons, type IconKey } from '@/components/icons'
import { signOut } from '@/server/actions/auth.actions'
import { cn } from '@/lib/utils'

type Role = 'family' | 'caregiver' | 'admin'

type MenuItem = {
  href?: string
  label: string
  icon: IconKey
  destructive?: boolean
  onClick?: () => void | Promise<void>
}

type Section = {
  label: string
  /**
   * 'nav'     → atalhos de navegação
   * 'account' → dados da conta, suporte
   *
   * Onde já existe sidebar (admin no desktop), o layout passa
   * showNavigation={false} e só as seções 'account' aparecem — senão o menu
   * vira uma cópia da sidebar que está logo acima dele.
   */
  kind: 'nav' | 'account'
  items: MenuItem[]
}

const SECTIONS_BY_ROLE: Record<Role, Section[]> = {
  family: [
    {
      label: 'Cuidados',
      kind: 'nav',
      items: [
        { href: '/family/dashboard', label: 'Buscar cuidadores', icon: 'search' },
        { href: '/family/dashboard/matches', label: 'Meus convites', icon: 'chat' },
        { href: '/family/elderly/new', label: 'Cadastrar idoso', icon: 'handHeart' },
      ],
    },
    {
      label: 'Conta',
      kind: 'account',
      items: [
        { href: '/profile', label: 'Minha conta', icon: 'users' },
        { href: '/contato', label: 'Suporte', icon: 'chat' },
      ],
    },
  ],
  caregiver: [
    {
      label: 'Trabalho',
      kind: 'nav',
      items: [
        { href: '/caregiver/dashboard/matches', label: 'Meus convites', icon: 'chat' },
        { href: '/caregiver/profile', label: 'Editar perfil profissional', icon: 'stethoscope' },
        { href: '/caregiver/dashboard/plans', label: 'Meu plano', icon: 'sparkles' },
      ],
    },
    {
      label: 'Conta',
      kind: 'account',
      items: [
        { href: '/profile', label: 'Minha conta', icon: 'users' },
        { href: '/contato', label: 'Suporte', icon: 'chat' },
      ],
    },
  ],
  admin: [
    {
      label: 'Operação',
      kind: 'nav',
      items: [
        { href: '/admin', label: 'Visão geral', icon: 'sparkles' },
        { href: '/admin/caregivers', label: 'Cuidadores', icon: 'stethoscope' },
        { href: '/admin/families', label: 'Famílias', icon: 'handHeart' },
        { href: '/admin/bookings', label: 'Contratos', icon: 'calendar' },
        { href: '/admin/verification', label: 'Verificação', icon: 'shield' },
      ],
    },
    {
      label: 'Conta',
      kind: 'account',
      items: [
        { href: '/profile', label: 'Minha conta', icon: 'users' },
      ],
    },
  ],
}

const ROLE_LABEL: Record<Role, string> = {
  family: 'Família',
  caregiver: 'Cuidador',
  admin: 'Administrador',
}

export function UserMenu({
  fullName,
  avatarUrl,
  role,
  email,
  showNavigation = true,
}: {
  fullName: string
  avatarUrl?: string | null
  role: Role
  email?: string | null
  /** false quando o layout já tem navegação própria (sidebar do admin). */
  showNavigation?: boolean
}) {
  const [open, setOpen] = useState(false)
  // Abre para cima quando não há espaço embaixo. Sem isto, o menu da sidebar
  // do admin (que fica no rodapé de uma coluna min-h-screen) renderizava
  // abaixo do viewport — parecia que o clique não fazia nada.
  const [dropUp, setDropUp] = useState(false)
  // Idem no eixo horizontal: o painel tem 288px e fica ancorado à direita do
  // gatilho. Na sidebar do admin (256px de largura) isso joga a borda esquerda
  // para fora da tela, cortando o texto dos itens.
  const [alignStart, setAlignStart] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const initial = fullName.charAt(0).toUpperCase()
  const sections = SECTIONS_BY_ROLE[role].filter(
    (section) => showNavigation || section.kind === 'account'
  )

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const PANEL_WIDTH = 288 // w-72

  function toggle() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()

      // Vertical: ~340px é a altura típica do painel.
      const spaceBelow = window.innerHeight - rect.bottom
      setDropUp(spaceBelow < 340 && rect.top > spaceBelow)

      // Horizontal: ancorado à direita, o painel se estende para a ESQUERDA a
      // partir de rect.right. Se não couber, ancora à esquerda e deixa crescer
      // para a direita (sobre o conteúdo principal).
      setAlignStart(rect.right < PANEL_WIDTH)
    }
    setOpen((v) => !v)
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label="Abrir menu do usuário"
        aria-expanded={open}
        className={cn(
          'group flex items-center gap-2 rounded-full p-1 pr-2 sm:pr-3 transition-all',
          'hover:bg-muted',
          open && 'bg-muted'
        )}
      >
        <span className="w-9 h-9 rounded-full overflow-hidden gradient-primary text-white grid place-items-center text-sm font-bold flex-shrink-0 shadow-soft">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </span>
        <span className="hidden sm:flex flex-col items-start min-w-0 max-w-[140px]">
          <span className="text-xs font-semibold truncate w-full">{fullName.split(' ')[0]}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{ROLE_LABEL[role]}</span>
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={cn('text-muted-foreground transition-transform hidden sm:block', open && 'rotate-180')}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute w-72 max-w-[calc(100vw-1rem)] rounded-2xl border border-border',
            'bg-card shadow-elevated overflow-hidden animate-fade-in z-50',
            alignStart ? 'left-0' : 'right-0',
            dropUp ? 'bottom-full mb-2' : 'top-full mt-2',
            dropUp
              ? (alignStart ? 'origin-bottom-left' : 'origin-bottom-right')
              : (alignStart ? 'origin-top-left' : 'origin-top-right')
          )}
        >
          {/* Header */}
          <div className="px-4 py-4 bg-gradient-to-br from-primary/5 to-secondary/5 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full overflow-hidden gradient-primary text-white grid place-items-center font-bold flex-shrink-0">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">{fullName}</div>
                {email && <div className="text-xs text-muted-foreground truncate">{email}</div>}
                <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <Icons.verified className="w-3 h-3" /> {ROLE_LABEL[role]}
                </div>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="py-2 max-h-[60vh] overflow-y-auto">
            {sections.map((section) => (
              <div key={section.label} className="py-1">
                <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </div>
                {section.items.map((item) => {
                  const Icon = Icons[item.icon]
                  return (
                    <Link
                      key={item.label}
                      href={item.href || '#'}
                      onClick={() => setOpen(false)}
                      role="menuitem"
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/60 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            ))}

            {/* Logout */}
            <div className="border-t border-border mt-1 pt-1">
              <form action={signOut}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Icons.close className="w-4 h-4" />
                  Sair da conta
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
