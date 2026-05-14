import Link from 'next/link'
import { Icons } from '@/components/icons'

const COLUMNS = [
  {
    title: 'Plataforma',
    links: [
      { href: '/#como-funciona', label: 'Como funciona' },
      { href: '/#para-familias', label: 'Para famílias' },
      { href: '/#para-cuidadores', label: 'Para cuidadores' },
      { href: '/#planos', label: 'Planos' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { href: '/sobre', label: 'Sobre nós' },
      { href: '/contato', label: 'Contato' },
      { href: '/imprensa', label: 'Imprensa' },
      { href: '/carreiras', label: 'Carreiras' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { href: '/blog', label: 'Blog' },
      { href: '/#duvidas', label: 'Perguntas frequentes' },
      { href: '/ajuda', label: 'Central de ajuda' },
      { href: '/seguranca', label: 'Segurança' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/termos', label: 'Termos de uso' },
      { href: '/privacidade', label: 'Privacidade' },
      { href: '/cookies', label: 'Cookies' },
      { href: '/lgpd', label: 'LGPD' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30 mt-24">
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid place-items-center w-9 h-9 rounded-xl gradient-primary text-white shadow-soft">
                <Icons.logo className="w-5 h-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">
                Cuide<span className="text-primary">+</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              A maneira mais segura e humana de encontrar cuidadores verificados para quem você ama.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a aria-label="Instagram" href="#" className="w-9 h-9 grid place-items-center rounded-lg border border-border hover:border-primary hover:text-primary transition-colors">
                <Icons.instagram className="w-4 h-4" />
              </a>
              <a aria-label="Facebook" href="#" className="w-9 h-9 grid place-items-center rounded-lg border border-border hover:border-primary hover:text-primary transition-colors">
                <Icons.facebook className="w-4 h-4" />
              </a>
              <a aria-label="LinkedIn" href="#" className="w-9 h-9 grid place-items-center rounded-lg border border-border hover:border-primary hover:text-primary transition-colors">
                <Icons.linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Cuide+ — Todos os direitos reservados. Feito com cuidado no Brasil.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Icons.shield className="w-3.5 h-3.5 text-secondary" /> SSL & LGPD</span>
            <span className="inline-flex items-center gap-1.5"><Icons.verified className="w-3.5 h-3.5 text-primary" /> Cuidadores verificados</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
