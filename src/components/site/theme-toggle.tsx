'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Icons } from '@/components/icons'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const current = mounted ? (resolvedTheme || theme) : 'light'
  const isDark = current === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-transparent hover:border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all"
    >
      {mounted && isDark ? (
        <Icons.sun className="w-4 h-4" />
      ) : (
        <Icons.moon className="w-4 h-4" />
      )}
    </button>
  )
}
