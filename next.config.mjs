import { existsSync } from 'node:fs'

// Cache local de node_modules fora do Dropbox (apenas no Mac do dev).
// Se não existir, é ignorado — Vercel/Linux usam apenas o node_modules padrão.
const LOCAL_NODE_MODULES_CACHE = '/Users/hamiltonvinicius/dev_cache/cuidemais/node_modules'
const useLocalCache = existsSync(LOCAL_NODE_MODULES_CACHE)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Não trave o build da Vercel por warnings cosméticos.
  // Em CI/local você ainda roda `npm run lint` separadamente.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.supabase.co https://i.pravatar.cc https://*.googleusercontent.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
            ].join('; ')
          }
        ],
      },
    ]
  },
  webpack(config) {
    if (useLocalCache) {
      // Dev local: prioriza o cache fora do Dropbox para evitar conflitos de sync.
      config.resolve.modules = [LOCAL_NODE_MODULES_CACHE, 'node_modules']
    }
    return config
  },
}

export default nextConfig
