import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cuidemais.com.br'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes = [
    '',
    '/login',
    '/register',
    '/sobre',
    '/contato',
    '/termos',
    '/privacidade',
  ]
  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.7,
  }))
}
