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
}

export default nextConfig
