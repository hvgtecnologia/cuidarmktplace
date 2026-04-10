# 🛡️ SEGURANÇA OBRIGATÓRIA — SaaS (Next.js + Supabase)

> **INSTRUÇÃO PARA A IA:** Este documento é OBRIGATÓRIO em todo projeto.
> NUNCA escreva código que viole estas regras. Se o usuário pedir algo que
> conflite, AVISE o risco e proponha a alternativa segura.
> Aplique TODAS as regras automaticamente sem precisar ser lembrado.

---

## PRINCÍPIO FUNDAMENTAL

**NUNCA confie no frontend.** Todo dado vindo do navegador é potencialmente manipulado.
Preço, status, permissão, desconto, quantidade — TUDO é validado e calculado no servidor.

---

## 1. VARIÁVEIS DE AMBIENTE

```env
# ✅ PODEM ter NEXT_PUBLIC_ (públicas por design)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://meusite.com

# 🚫 NUNCA com NEXT_PUBLIC_ (só servidor)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
DATABASE_URL=postgres://...
ASAAS_API_KEY=...
WEBHOOK_SECRET=...
```

**Regra:** No Next.js, `NEXT_PUBLIC_` = visível no navegador. Chaves secretas NUNCA recebem esse prefixo.

Adicionar validação no startup do projeto:

```typescript
// lib/env-check.ts — importar em instrumentation.ts ou layout.tsx
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
```

**.gitignore obrigatório:**
```gitignore
.env
.env.local
.env.development
.env.production
.env*.local
*.pem
*.key
```

---

## 2. SUPABASE — RLS (Row Level Security)

**Regra:** TODA tabela no schema `public` DEVE ter RLS ativado + policies ANTES de qualquer código que a acesse.

Sem RLS, qualquer pessoa com a anon key (pública no JS) pode `SELECT * FROM tabela`, `UPDATE`, `DELETE` tudo.

### Template padrão — dados do usuário:

```sql
CREATE TABLE nome_tabela (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  -- colunas --
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own" ON nome_tabela FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "insert own" ON nome_tabela FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "update own" ON nome_tabela FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete own" ON nome_tabela FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_nome_tabela_user ON nome_tabela(user_id);
```

### Tabela pública (catálogo, eventos):

```sql
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON eventos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write" ON eventos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "admin update" ON eventos FOR UPDATE TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
```

### Tabela crítica (tickets, pedidos, pagamentos):

```sql
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Comprador só VÊ seus tickets
CREATE POLICY "buyer read" ON tickets FOR SELECT TO authenticated
  USING (buyer_id = auth.uid());

-- NINGUÉM insere/atualiza pelo frontend. Só backend via service_role.
-- NÃO crie policies de INSERT/UPDATE para authenticated em tabelas de pagamento.

-- Admin acesso total
CREATE POLICY "admin all" ON tickets FOR ALL TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
```

### Multi-tenant (SaaS com múltiplos clientes):

```sql
CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS SETOF uuid AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "tenant isolation" ON tenant_data FOR ALL TO authenticated
  USING (org_id IN (SELECT user_org_ids()))
  WITH CHECK (org_id IN (SELECT user_org_ids()));

CREATE INDEX idx_org_members_user ON org_members(user_id);
CREATE INDEX idx_tenant_data_org ON tenant_data(org_id);
```

### PROIBIDO:

```sql
-- ❌ NUNCA
CREATE POLICY "allow all" ON tabela FOR ALL TO anon USING (true);
CREATE POLICY "anon write" ON tabela FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "read all" ON tickets FOR SELECT TO authenticated USING (true);
```

### Auditoria:

```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- Se rowsecurity = false: CORRIGIR IMEDIATAMENTE
```

---

## 3. SUPABASE CLIENTS (Padrão Correto)

```typescript
// lib/supabase/client.ts — FRONTEND (browser)
import { createBrowserClient } from '@supabase/ssr';
export const createClient = () => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// lib/supabase/server.ts — SERVER (API Routes, Server Components)
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export const createServerSupabase = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
    }}
  );
};

// lib/supabase/admin.ts — ADMIN (APENAS backend, NUNCA importar no client)
import { createClient } from '@supabase/supabase-js';
export const createAdminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypassa RLS — só para operações admin no backend
);
```

---

## 4. AUTENTICAÇÃO E ROTAS PROTEGIDAS

### Middleware:

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC = ['/', '/login', '/signup', '/api/webhooks'];
const ADMIN = ['/admin', '/api/admin'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  if (PUBLIC.some(r => path.startsWith(r))) return res;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      getAll() { return req.cookies.getAll(); },
      setAll(c) { c.forEach(({ name, value, options }) => res.cookies.set(name, value, options)); },
    }}
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));

  if (ADMIN.some(r => path.startsWith(r))) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

### Tabela profiles com proteção de role:

```sql
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "update own" ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Impedir que usuário mude seu próprio role
CREATE OR REPLACE FUNCTION prevent_role_change() RETURNS trigger AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
      NEW.role := OLD.role;
    END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER protect_role BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_change();

-- Auto-criar profile no signup
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name) VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 5. API ROUTES — Estrutura Obrigatória

Toda API Route segue esta ordem:

```typescript
// app/api/exemplo/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

const schema = z.object({ /* validação dos inputs */ });

export async function POST(req: Request) {
  // 1. RATE LIMITING
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(ip, 10, 60000).success) {
    return Response.json({ error: 'Muitas tentativas' }, { status: 429 });
  }

  // 2. AUTENTICAÇÃO
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  // 3. VALIDAÇÃO DE INPUT
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: 'Dados inválidos' }, { status: 400 });

  // 4. LÓGICA DE NEGÓCIO (preços, status, descontos — tudo aqui)

  // 5. RESPOSTA SEGURA (sem dados internos)
  return Response.json({ id: result.id }); // só o necessário
}
```

### Rate Limiting:

```typescript
// lib/rate-limit.ts
const map = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(id: string, max: number = 10, windowMs: number = 60000) {
  const now = Date.now();
  const record = map.get(id);
  if (!record || now > record.resetAt) {
    map.set(id, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: max - 1 };
  }
  if (record.count >= max) return { success: false, remaining: 0 };
  record.count++;
  return { success: true, remaining: max - record.count };
}
```

**Limites recomendados:** Login: 5/min | Checkout: 3/min | API IA: 10/min | Geral: 60/min

### Resposta segura:

```typescript
// ❌ NUNCA
return Response.json({ error: error.message, stack: error.stack });
return Response.json({ user }); // pode ter CPF, email, etc.

// ✅ CORRETO
console.error('Error:', error); // log interno
return Response.json({ error: 'Erro interno' }, { status: 500 }); // genérico pro client
return Response.json({ id: user.id, name: user.name }); // só o necessário
```

---

## 6. SERVER ACTIONS — Wrapper Seguro

```typescript
// lib/safe-action.ts
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

export function createSafeAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (input: TInput, userId: string) => Promise<TOutput>
) {
  return async (raw: TInput) => {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const parsed = schema.safeParse(raw);
    if (!parsed.success) return { success: false, error: 'Dados inválidos' };

    try {
      const result = await handler(parsed.data, user.id);
      return { success: true, data: result };
    } catch (e) {
      console.error('Action error:', e);
      return { success: false, error: 'Erro interno' };
    }
  };
}
```

---

## 7. PAGAMENTOS (Asaas)

**Regra:** O frontend NUNCA define preço, status ou desconto. Só envia IDs.

```
FLUXO:
Frontend → API Route: { event_id, quantity, coupon_code }
API Route:
  1. Busca preço REAL no banco
  2. Valida cupom no banco (expiração, limite, %)
  3. Calcula total NO SERVIDOR
  4. Cria cobrança no Asaas com valor do servidor
  5. Cria ticket com status = "pending"
  6. Retorna URL de pagamento

Asaas → Webhook → API:
  1. Valida token do webhook
  2. Confirma pagamento na API do Asaas
  3. Atualiza ticket para "paid" (SÓ o webhook faz isso)
```

### Webhook do Asaas:

```typescript
// app/api/webhooks/asaas/route.ts
export async function POST(req: Request) {
  const token = req.headers.get('asaas-access-token');
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const event = await req.json();
  if (!['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'].includes(event.event)) {
    return Response.json({ received: true });
  }

  // VERIFICAR NA API DO ASAAS (não confiar só no webhook)
  const real = await fetch(`https://api.asaas.com/v3/payments/${event.payment.id}`, {
    headers: { 'access_token': process.env.ASAAS_API_KEY! },
  }).then(r => r.json());

  if (['CONFIRMED', 'RECEIVED'].includes(real.status)) {
    const admin = createAdminClient();
    await admin.from('tickets')
      .update({ status: 'paid', paid_at: new Date().toISOString(), confirmed_value: real.value })
      .eq('payment_id', event.payment.id)
      .eq('status', 'pending'); // Idempotente
  }

  return Response.json({ received: true });
}
```

### Cupom atômico:

```sql
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_id uuid) RETURNS void AS $$
  UPDATE coupons SET used_count = used_count + 1
  WHERE id = p_coupon_id AND (max_uses IS NULL OR used_count < max_uses);
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 8. UPLOAD DE ARQUIVOS

```typescript
const ALLOWED_TYPES: Record<string, number[]> = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png':  [0x89, 0x50, 0x4E, 0x47],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
};
const MAX_SIZE = 5 * 1024 * 1024;

// Validar tipo REAL (magic bytes), gerar nome aleatório, armazenar no Supabase Storage
// NUNCA confiar na extensão. NUNCA salvar no diretório público.
// NUNCA usar nome original do arquivo (directory traversal).
```

---

## 9. FRONTEND — Proteções

```tsx
// ❌ VULNERÁVEL
<div dangerouslySetInnerHTML={{ __html: userContent }} />
<a href={userUrl}>Link</a> // userUrl = "javascript:alert('xss')"

// ✅ SEGURO
import DOMPurify from 'isomorphic-dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />

const safeUrl = (url: string) => {
  try { return ['http:', 'https:'].includes(new URL(url).protocol) ? url : '#'; }
  catch { return '#'; }
};
```

**Regra:** O frontend é camada de apresentação, não de segurança.
Se a proteção só existe no JS do navegador, não existe proteção.

---

## 10. HEADERS DE SEGURANÇA

```javascript
// next.config.js — adicionar em TODO projeto
module.exports = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'" },
      ],
    }];
  },
};
```

---

## 11. MONITORAMENTO (Implementar desde o dia 1)

```sql
CREATE TABLE security_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  user_id uuid REFERENCES auth.users(id),
  ip_address text,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin only" ON security_logs FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE INDEX idx_sec_logs_event ON security_logs(event_type);
CREATE INDEX idx_sec_logs_created ON security_logs(created_at DESC);
```

```typescript
// lib/security-log.ts
export async function logSecurity(
  type: string, severity: 'info'|'warning'|'critical',
  details: Record<string, any>, userId?: string, ip?: string
) {
  try {
    await createAdminClient().from('security_logs').insert({
      event_type: type, severity, user_id: userId, ip_address: ip, details,
    });
  } catch (e) { console.error('Log failed:', e); }
}
```

**Logar:** login falho, rate limit atingido, webhook inválido, acesso admin negado, ticket criado, pagamento confirmado.

---

## 12. RESPOSTA A INCIDENTES

Se descobrir brecha em produção:

```
IMEDIATO (15 min):
  □ Rotacionar chaves: Supabase (Dashboard > Settings > API), Asaas, OpenAI
  □ Atualizar variáveis no Vercel + re-deploy
  □ Invalidar sessões: DELETE FROM auth.sessions;

AVALIAR (2h):
  □ Verificar logs do Supabase (Dashboard > Logs)
  □ Buscar tickets fraudulentos: SELECT * FROM tickets WHERE status='paid' AND payment_id IS NULL;
  □ Verificar git: git log --all --full-history -- "*.env*"

CORRIGIR:
  □ Aplicar regras deste documento
  □ Monitorar por 30 dias

LGPD (se dados pessoais foram expostos):
  □ Comunicar titulares dos dados afetados
  □ Documentar o incidente
```

---

## 13. DEPLOY SEGURO (GitHub + Vercel)

GitHub → Vercel é o fluxo correto. O risco não é a ferramenta, é o uso.

### Regras obrigatórias:

```bash
# ANTES do primeiro commit de qualquer projeto, verificar:
cat .gitignore | grep -E "\.env"
# Se não retornar nada: PARE e adicione .env* ao .gitignore AGORA

# Verificar se já commitou secrets no passado:
git log --all --full-history -- "*.env*"
# Se retornar algo: as chaves estão comprometidas. Rotacionar TUDO.

# Buscar chaves hardcoded no código:
grep -rn "eyJ" --include="*.ts" --include="*.tsx" --include="*.js" src/ app/ lib/
grep -rn "sk-" --include="*.ts" --include="*.tsx" --include="*.js" src/ app/ lib/
grep -rn "service_role" --include="*.ts" --include="*.tsx" --include="*.js" src/ app/ lib/
# Se encontrar: remover do código e usar variável de ambiente
```

### Repositório:

```
✅ CORRETO:
- Repo PRIVADO no GitHub (padrão para projetos de clientes)
- .env* no .gitignore desde o primeiro commit
- Secrets apenas no painel do Vercel (Settings > Environment Variables)
- Branch protection no main (evitar push direto)

❌ PERIGOSO:
- Repo PÚBLICO com qualquer chave no histórico
- .env commitado "só uma vez" (fica no histórico pra sempre)
- Chaves hardcoded no código (mesmo em repo privado)
- Mesmo repo para múltiplos clientes sem separação
```

### Vercel:

```
✅ CONFIGURAR:
- Environment Variables: adicionar TODAS as chaves secretas no painel
- Marcar como "Sensitive" (não aparece nos logs de deploy)
- Separar variáveis por ambiente (Production / Preview / Development)
- Vercel > Settings > General > Build & Development: verificar framework correto

⚠️ ATENÇÃO com Preview Deployments:
- Cada PR gera um deploy preview com URL pública
- Se o repo for de um projeto de cliente, desativar preview em branches
- Vercel > Settings > Deployment Protection: ativar se necessário
```

### Se um secret vazou no Git:

```bash
# 1. Rotacionar a chave IMEDIATAMENTE (Supabase, Asaas, OpenAI, etc.)
# 2. Atualizar no Vercel (Settings > Environment Variables)
# 3. Remover do histórico do Git:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
# 4. Mas a chave antiga já está comprometida — rotacionar é o que salva
```

---

## CHECKLIST PRÉ-DEPLOY

```
[ ] Repo PRIVADO no GitHub
[ ] .env* no .gitignore (verificar ANTES do primeiro commit)
[ ] Nenhum secret no histórico do git
[ ] Todas as tabelas: RLS ativado + policies adequadas
[ ] Nenhuma variável sensível com NEXT_PUBLIC_
[ ] Toda lógica de preço/status/desconto no servidor
[ ] Rate limiting em login, checkout, APIs críticas
[ ] Inputs validados com zod em toda API Route e Server Action
[ ] Headers de segurança no next.config.js
[ ] Variáveis sensíveis APENAS no painel do Vercel (marcadas Sensitive)
[ ] npm audit sem vulnerabilidades críticas
[ ] Tabela security_logs criada
[ ] Webhook do gateway valida token + confirma na API
```
