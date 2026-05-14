const FORBIDDEN = [
  'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_OPENAI_API_KEY',
  'NEXT_PUBLIC_DATABASE_URL',
  'NEXT_PUBLIC_JWT_SECRET',
  'NEXT_PUBLIC_WEBHOOK_SECRET',
  'NEXT_PUBLIC_ASAAS_API_KEY',
];

export function checkEnvSecurity() {
  const exposed = FORBIDDEN.filter(k => process.env[k]);
  if (exposed.length > 0) {
    throw new Error(`🚨 CHAVES EXPOSTAS NO FRONTEND: ${exposed.join(', ')}. Build cancelada.`);
  }
}
