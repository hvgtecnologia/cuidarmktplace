import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Prefixos que exigem sessão. Note que /caregiver/[id] NÃO entra aqui: é o
 * perfil público do cuidador. Por isso a lista é de prefixos específicos em
 * vez de '/caregiver' inteiro.
 */
const PROTECTED_PREFIXES = [
  '/admin',
  '/dashboard',
  '/profile',
  '/checkout',
  '/family',
  '/caregiver/dashboard',
  '/caregiver/profile',
  '/caregiver/onboarding',
]

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // RequestCookies.set não aceita options (só name, value)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          // ResponseCookies.set aceita options (httpOnly, maxAge, etc)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser() também renova a sessão e grava os cookies novos na resposta —
  // precisa rodar em toda requisição, não só nas protegidas.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && isProtected(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Preserva o destino para voltar depois do login.
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
