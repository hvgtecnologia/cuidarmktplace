# Cuide+ — marketplace de cuidadores de idosos

Next.js 14 (App Router) + Supabase/Postgres + Tailwind.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha URL e chave do Supabase
npm run dev
```

Abre em http://localhost:3000.

O schema fica em [`supabase/setup.sql`](supabase/setup.sql) (idempotente) e os dados
de demonstração em [`supabase/seed.sql`](supabase/seed.sql) — **nesta ordem**, o seed
depende das tabelas do setup. Cole os dois no SQL Editor do Supabase.

Contas demo (senha `Demo@2026`): `familia@`, `cuidador@` e `admin@cuidemais.com.br`.

## Arquitetura

O código é separado em duas camadas com dependência de mão única: **o front importa
do back, nunca o contrário.**

```
src/
  server/            ← BACK — não conhece React
    db/              cliente Supabase do servidor (único ponto que abre conexão)
    domain/          regra e acesso a dado, por domínio
      caregivers/      .repository = queries | .service = orquestra várias
      matches/  elderly/  subscriptions/  profiles/  reviews/  payments/  admin/
    actions/         server actions — a "API" que a UI chama
    validations/     schemas zod (entrada de dado)
    http/            guards de sessão/role e middleware de sessão
  app/               ← FRONT — páginas e layouts (+ app/api, borda HTTP externa)
  components/        ← FRONT — UI. Recebe dado por props, nunca consulta banco
  lib/               utilitários puros, sem lado nenhum
```

### Por que não há um projeto de API separado

Em App Router, Server Components e Server Actions **são** o backend: rodam no
servidor e o navegador nunca recebe esse código. Criar rota HTTP para a tela
buscar dado que o Server Component já lê direto só adiciona um salto de rede ao
próprio servidor. Então `src/app/api/` existe apenas para consumidor **externo**
(webhook de pagamento, app mobile, integração de terceiro) — hoje só o health check.

### Onde a autorização mora de verdade

No **RLS do Postgres**, não na aplicação. Toda query usa a chave publishable com a
sessão do usuário, então a policy decide o que ele vê. Os `requireRole()` em
`server/http/guards.ts` são defesa em profundidade na UI: evitam a tela errada,
mas não são o que protege o dado.

Consequência prática: **esquecer um filtro numa query não vaza dado de ninguém.**

### A fronteira é verificada pelo lint

`.eslintrc.json` proíbe, com erro:

- `src/components/**` importar `@/server/db/*`, `@/server/domain/*` ou `@supabase/*`
  → UI recebe dado por props ou chama um server action
- `src/server/**` importar `@/components/*`, `@/app/*`, `react` ou `react-dom`
  → a dependência só vai no sentido front ← back

O lint roda no `next build` (`eslint.ignoreDuringBuilds: false`), então quebrar a
camada quebra o build — não passa como sugestão a ser ignorada.

## Convenções

- `*.repository.ts` — fala com uma tabela. Nada de regra de negócio.
- `*.service.ts` — combina repositórios e aplica regra. É o que a página chama
  quando precisa de mais de uma fonte.
- `*.actions.ts` — server actions. Validam com zod via `createSafeAction` e
  delegam para domain. Nada de SQL aqui.
- Página (`page.tsx`) não tem query. Chama repository/service e cuida de layout.

Uma armadilha que já custou caro: `caregiver_profiles` tem **duas** chaves — `id`
(PK própria) e `user_id` (vínculo com `auth.users`, e o que o RLS usa). Para achar
o perfil do usuário logado é sempre `user_id`.
