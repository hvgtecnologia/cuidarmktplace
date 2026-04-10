# CUIDE+ — Marketplace de Cuidadores de Idosos
## Documento Master do Projeto — Antigravity

> **Instruções de uso no Antigravity:**
> Cole este documento inteiro no início de cada sessão como contexto global.
> Em seguida, adicione o módulo específico que deseja construir naquela sessão.
> Nunca construa mais de um módulo por sessão para manter o foco.

---

## 1. VISÃO GERAL DO PRODUTO

**Nome:** Cuide+
**Tagline:** Encontre o cuidador ideal para seu idoso. Rápido, seguro e verificado.
**Modelo:** Marketplace de cuidadores de idosos no estilo de descoberta (swipe/match), gratuito para famílias e com taxa para cuidadores por match aceito.

### Problema que resolve
Famílias que precisam de cuidadores de idosos enfrentam: falta de confiança em quem contratar, processo lento e informal (indicação boca a boca), dificuldade de avaliar competência e disponibilidade, e riscos de segurança. Os cuidadores, por sua vez, não têm plataforma profissional para se apresentar e captar clientes de forma recorrente.

### Proposta de valor
- **Para famílias:** Plataforma 100% gratuita para encontrar cuidadores verificados, filtrados por necessidade do idoso, com avaliações reais e match rápido.
- **Para cuidadores:** Canal profissional com visibilidade, gestão de agenda e pagamento garantido. Taxa justa só quando o match é aceito.

---

## 2. PERSONAS

### Persona A — Família / Contratante
- **Perfil:** Filho(a) adulto(a) de 35–60 anos que cuida de um parente idoso
- **Dor:** Não sabe em quem confiar, processo de busca é demorado e arriscado
- **Comportamento:** Usa smartphone, está no WhatsApp, pesquisa no Google
- **Objetivo:** Encontrar cuidador de confiança rapidamente, sem burocracia
- **Gratuidade total:** nunca paga nada na plataforma

### Persona B — Cuidador Profissional
- **Perfil:** Cuidador de 25–55 anos, com experiência formal ou informal
- **Dor:** Depende de indicações, sem visibilidade profissional, instabilidade de renda
- **Comportamento:** Usa smartphone, quer mais clientes e mais formalidade
- **Objetivo:** Ter perfil profissional e receber contratações de forma recorrente
- **Monetização:** Paga taxa de R$ 5 a R$ 15 por match aceito (conforme plano)

### Persona C — Admin da Plataforma
- **Acesso:** Painel interno `/admin`
- **Função:** Moderar perfis, validar verificações, gerenciar pagamentos e suporte

---

## 3. MODELO DE NEGÓCIO

### Monetização
| Fonte | Quem paga | Quando | Valor |
|---|---|---|---|
| Taxa por match | Cuidador | Ao aceitar o match | R$ 5 (básico) / R$ 10 (padrão) |
| Plano Premium | Cuidador | Assinatura mensal | R$ 49/mês |
| Destaque no perfil | Cuidador | Avulso | R$ 19 por 7 dias |
| Parceiros farmácias | Farmácia parceira | Comissão por lead | Variável |

### Regras de negócio críticas
1. Família NUNCA paga nada — zero barreiras de entrada
2. Cuidador SÓ é cobrado ao aceitar o match — não ao se cadastrar
3. Match cancelado pelo cuidador em menos de 2h = reembolso automático
4. Cuidador sem verificação aprovada NÃO aparece nos resultados
5. Avaliação da residência é visível APENAS para cuidadores com match ativo

---

## 4. FUNCIONALIDADES POR MÓDULO

### Módulo 1 — Autenticação e Onboarding
- Tela inicial com escolha: "Sou Família" ou "Sou Cuidador"
- Cadastro com email/senha ou Google OAuth
- Onboarding guiado por tipo de usuário (fluxo diferente para cada persona)
- Verificação de email obrigatória antes de acessar o app
- Roles no banco: `family`, `caregiver`, `admin`

### Módulo 2 — Perfil do Idoso (Família)
- Upload de foto do idoso
- Nome, idade, sexo
- **Necessidades específicas (tags multi-select):**
  - Alzheimer / Demência
  - Mobilidade reduzida
  - Cadeirante
  - Pós-cirurgia
  - Cuidados paliativos
  - Higiene e banho
  - Medicação
  - Acompanhamento noturno
  - Alimentação assistida
  - Fisioterapia de manutenção
- Localização (cidade + bairro — não exata)
- Horários de preferência (manhã / tarde / noite / integral)
- Campo de observações livres
- **Avaliação da residência (opcional):**
  - Escadas / rampas?
  - Banheiro adaptado?
  - Espaço para o cuidador?
  - Animais na casa?
  - Visível apenas para matches aprovados

### Módulo 3 — Perfil do Cuidador
- Foto principal + galeria (até 6 fotos)
- Nome completo, data de nascimento
- **Especialidades (tags multi-select):** mesmas tags do módulo de idoso
- Valor por hora (campo numérico)
- Cidade e bairro de atuação
- Raio de atendimento (km — slider)
- **Calendário de disponibilidade:** dias da semana + horários
- Breve bio (até 500 caracteres)
- Certificados e cursos (upload de documentos)
- Avaliações recebidas (⭐ + comentário)
- Badge de verificação (exibido após aprovação)

### Módulo 4 — Verificação de Identidade (Cuidador)
- **Etapa 1:** Upload de documento (RG ou CNH — frente e verso)
- **Etapa 2:** Selfie ao vivo (foto com instrução: "olhe para a câmera e sorria")
- **Etapa 3:** Vídeo curto 360° (instrução: "gire lentamente mostrando seu rosto e ambiente")
- **Validação:** IA compara selfie com documento (Replicate API / Yoti)
- **Status:** `pending` → `approved` / `rejected` (com motivo)
- Cuidador rejeitado pode reenviar após 48h
- Admin pode aprovar/rejeitar manualmente no painel

### Módulo 5 — Sistema de Match (Descoberta)
- Feed de cards para a família (similar ao Tinder)
- Cards mostram: foto, nome, especialidades, avaliação média, distância, valor/hora
- **Ações no card:**
  - Swipe/botão direito → Like (interesse)
  - Swipe/botão esquerdo → Pass (ignorar)
  - Toque no card → Ver perfil completo
- **Algoritmo de ordenação:**
  1. Cuidadores verificados têm prioridade
  2. Compatibilidade de tags (necessidades do idoso vs especialidades do cuidador)
  3. Proximidade geográfica (raio configurado pela família)
  4. Avaliação média
  5. Última atividade na plataforma
- **Filtros disponíveis:**
  - Raio de distância (5 / 10 / 20 / 50 km)
  - Especialidade específica
  - Disponibilidade (dias/horários)
  - Faixa de valor por hora
  - Somente verificados
- Match é criado quando família dá Like e cuidador aceita
- Cuidador recebe notificação de interesse → aceita ou recusa → se aceita, Match confirmado + cobrança da taxa

### Módulo 6 — Chat Pós-Match
- Chat em tempo real (Supabase Realtime)
- Somente disponível após match confirmado
- Histórico de mensagens persistido
- Botão "Agendar serviço" abre modal com calendário
- Botão "Compartilhar perfil do cuidador" gera link para WhatsApp/farmácias
- Notificações push para novas mensagens
- Avaliação do serviço desbloqueada após primeiro agendamento concluído

### Módulo 7 — Avaliações
- Avaliação pós-serviço obrigatória (família avalia cuidador)
- Nota de 1 a 5 estrelas + comentário livre
- Cuidador pode responder a avaliações públicas
- Avaliações visíveis no perfil do cuidador para todos
- Avaliação da residência (família preenche): visível apenas para cuidadores com match ativo
- Flag de avaliação suspeita → vai para moderação

### Módulo 8 — Dashboard do Cuidador
- Lista de matches pendentes (a aceitar)
- Histórico de matches e contratações
- Calendário com agendamentos
- Resumo financeiro: taxa paga por match, ganhos totais
- Status de verificação
- Gerenciar perfil, fotos, disponibilidade
- Upgrade para Premium

### Módulo 9 — Dashboard da Família
- Histórico de matches e cuidadores contratados
- Conversas ativas
- Perfis curtidos (Likes dados)
- Gerenciar perfil do idoso
- Avaliações enviadas

### Módulo 10 — Painel Admin
- Lista de cuidadores aguardando verificação
- Aprovar / rejeitar verificação (com comentário)
- Gerenciar usuários (banir, alertar)
- Relatório de matches e receita
- Moderar avaliações flagadas
- Gerenciar farmácias parceiras

---

## 5. SCHEMA DO BANCO DE DADOS (Supabase)

```sql
-- =============================================
-- CUIDE+ — Schema Completo Supabase
-- Todos os campos críticos com RLS obrigatório
-- =============================================

-- EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- Para geolocalização

-- =============================================
-- TABELA: profiles (vinculada ao auth.users)
-- =============================================
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('family', 'caregiver', 'admin')),
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprio perfil"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuário atualiza próprio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admin vê todos os perfis"
  ON profiles FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- =============================================
-- TABELA: elderly_profiles (perfil do idoso)
-- =============================================
CREATE TABLE elderly_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  age integer NOT NULL CHECK (age > 0 AND age < 130),
  sex text CHECK (sex IN ('M', 'F', 'outro')),
  photo_url text,
  city text NOT NULL,
  neighborhood text,
  lat numeric(10,7),
  lng numeric(10,7),
  care_needs text[] DEFAULT '{}', -- array de tags
  preferred_schedule text[] DEFAULT '{}', -- ['manha', 'tarde', 'noite', 'integral']
  observations text,
  -- Avaliação da residência
  has_stairs boolean DEFAULT false,
  has_ramp boolean DEFAULT false,
  has_adapted_bathroom boolean DEFAULT false,
  has_caregiver_room boolean DEFAULT false,
  has_pets boolean DEFAULT false,
  residence_notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE elderly_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Família vê e edita próprio perfil do idoso"
  ON elderly_profiles FOR ALL
  USING (auth.uid() = family_id);

CREATE POLICY "Cuidador com match ativo vê perfil do idoso"
  ON elderly_profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT caregiver_id FROM matches
      WHERE elderly_id = elderly_profiles.id
      AND status = 'confirmed'
    )
  );

-- =============================================
-- TABELA: caregiver_profiles
-- =============================================
CREATE TABLE caregiver_profiles (
  id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bio text CHECK (char_length(bio) <= 500),
  specialties text[] DEFAULT '{}',
  hourly_rate numeric(10,2) NOT NULL CHECK (hourly_rate > 0),
  city text NOT NULL,
  neighborhood text,
  lat numeric(10,7),
  lng numeric(10,7),
  service_radius_km integer DEFAULT 10,
  available_days text[] DEFAULT '{}', -- ['seg','ter','qua','qui','sex','sab','dom']
  available_shifts text[] DEFAULT '{}', -- ['manha','tarde','noite','integral']
  verification_status text DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'approved', 'rejected', 'resubmit')
  ),
  verification_notes text,
  is_premium boolean DEFAULT false,
  premium_until timestamptz,
  rating_average numeric(3,2) DEFAULT 0,
  rating_count integer DEFAULT 0,
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE caregiver_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cuidador vê e edita próprio perfil"
  ON caregiver_profiles FOR ALL
  USING (auth.uid() = id);

CREATE POLICY "Família vê perfis verificados e ativos"
  ON caregiver_profiles FOR SELECT
  USING (
    verification_status = 'approved'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = caregiver_profiles.id AND is_active = true)
  );

CREATE POLICY "Admin vê todos"
  ON caregiver_profiles FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- =============================================
-- TABELA: caregiver_photos
-- =============================================
CREATE TABLE caregiver_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_id uuid REFERENCES caregiver_profiles(id) ON DELETE CASCADE NOT NULL,
  photo_url text NOT NULL,
  is_primary boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE caregiver_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cuidador gerencia próprias fotos"
  ON caregiver_photos FOR ALL
  USING (auth.uid() = caregiver_id);

CREATE POLICY "Público vê fotos de cuidadores verificados"
  ON caregiver_photos FOR SELECT
  USING (
    caregiver_id IN (
      SELECT id FROM caregiver_profiles WHERE verification_status = 'approved'
    )
  );

-- =============================================
-- TABELA: verification_submissions
-- =============================================
CREATE TABLE verification_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_id uuid REFERENCES caregiver_profiles(id) ON DELETE CASCADE NOT NULL,
  document_front_url text NOT NULL,
  document_back_url text NOT NULL,
  selfie_url text NOT NULL,
  video_url text,
  ai_score numeric(5,4), -- score de similaridade (0 a 1)
  ai_response jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE verification_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cuidador vê próprias submissões"
  ON verification_submissions FOR SELECT
  USING (auth.uid() = caregiver_id);

CREATE POLICY "Cuidador insere submissão"
  ON verification_submissions FOR INSERT
  WITH CHECK (auth.uid() = caregiver_id);

CREATE POLICY "Admin gerencia verificações"
  ON verification_submissions FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- =============================================
-- TABELA: matches
-- =============================================
CREATE TABLE matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  elderly_id uuid REFERENCES elderly_profiles(id) ON DELETE CASCADE NOT NULL,
  family_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  caregiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- family_action: like ou pass
  family_action text CHECK (family_action IN ('like', 'pass')),
  family_action_at timestamptz,
  -- caregiver_action: accept ou decline
  caregiver_action text CHECK (caregiver_action IN ('accept', 'decline')),
  caregiver_action_at timestamptz,
  -- status geral do match
  status text DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'declined', 'expired', 'cancelled')
  ),
  expires_at timestamptz DEFAULT (now() + interval '48 hours'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (elderly_id, caregiver_id) -- evita match duplicado
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Família vê próprios matches"
  ON matches FOR SELECT
  USING (auth.uid() = family_id);

CREATE POLICY "Cuidador vê matches onde é convidado"
  ON matches FOR SELECT
  USING (auth.uid() = caregiver_id);

CREATE POLICY "Família cria match (like/pass)"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = family_id);

CREATE POLICY "Família e cuidador atualizam match"
  ON matches FOR UPDATE
  USING (auth.uid() = family_id OR auth.uid() = caregiver_id);

-- =============================================
-- TABELA: payments
-- =============================================
CREATE TABLE payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  caregiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'BRL',
  payment_type text CHECK (payment_type IN ('match_fee', 'premium', 'highlight')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  asaas_charge_id text, -- ID da cobrança no Asaas
  asaas_payment_link text,
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cuidador vê próprios pagamentos"
  ON payments FOR SELECT
  USING (auth.uid() = caregiver_id);

CREATE POLICY "Admin vê todos os pagamentos"
  ON payments FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- =============================================
-- TABELA: conversations e messages (chat)
-- =============================================
CREATE TABLE conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE UNIQUE NOT NULL,
  family_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  caregiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes veem a conversa"
  ON conversations FOR SELECT
  USING (auth.uid() = family_id OR auth.uid() = caregiver_id);

CREATE TABLE messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL CHECK (char_length(content) <= 2000),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes veem mensagens da conversa"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE family_id = auth.uid() OR caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Participante envia mensagem"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE family_id = auth.uid() OR caregiver_id = auth.uid()
    )
  );

-- =============================================
-- TABELA: reviews (avaliações)
-- =============================================
CREATE TABLE reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE UNIQUE NOT NULL,
  caregiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  family_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text CHECK (char_length(comment) <= 1000),
  caregiver_response text CHECK (char_length(caregiver_response) <= 500),
  is_flagged boolean DEFAULT false,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Público vê avaliações publicadas"
  ON reviews FOR SELECT
  USING (is_published = true AND is_flagged = false);

CREATE POLICY "Família cria avaliação do próprio match"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = family_id);

CREATE POLICY "Cuidador responde avaliação própria"
  ON reviews FOR UPDATE
  USING (auth.uid() = caregiver_id);

-- =============================================
-- TABELA: schedules (agendamentos)
-- =============================================
CREATE TABLE schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  family_id uuid REFERENCES profiles(id) NOT NULL,
  caregiver_id uuid REFERENCES profiles(id) NOT NULL,
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes gerenciam próprios agendamentos"
  ON schedules FOR ALL
  USING (auth.uid() = family_id OR auth.uid() = caregiver_id);

-- =============================================
-- TABELA: security_logs
-- =============================================
CREATE TABLE security_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  ip_address text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Somente admin vê logs"
  ON security_logs FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- =============================================
-- FUNÇÃO: atualizar rating do cuidador
-- =============================================
CREATE OR REPLACE FUNCTION update_caregiver_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE caregiver_profiles
  SET
    rating_average = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE caregiver_id = NEW.caregiver_id
      AND is_published = true
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE caregiver_id = NEW.caregiver_id
      AND is_published = true
    )
  WHERE id = NEW.caregiver_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_rating
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_caregiver_rating();

-- =============================================
-- ÍNDICES DE PERFORMANCE
-- =============================================
CREATE INDEX idx_elderly_family ON elderly_profiles(family_id);
CREATE INDEX idx_matches_family ON matches(family_id);
CREATE INDEX idx_matches_caregiver ON matches(caregiver_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_reviews_caregiver ON reviews(caregiver_id);
CREATE INDEX idx_caregiver_verification ON caregiver_profiles(verification_status);
CREATE INDEX idx_payments_caregiver ON payments(caregiver_id);
```

---

## 6. ESTRUTURA DE PASTAS (Next.js 14 App Router)

```
cuide-plus/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── verify-email/page.tsx
│   ├── (family)/
│   │   ├── layout.tsx              # Layout autenticado para família
│   │   ├── dashboard/page.tsx      # Feed de swipe
│   │   ├── elderly/
│   │   │   ├── new/page.tsx        # Criar perfil do idoso
│   │   │   └── [id]/edit/page.tsx  # Editar perfil
│   │   ├── matches/page.tsx        # Meus matches
│   │   ├── conversations/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx       # Chat
│   │   └── profile/page.tsx
│   ├── (caregiver)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx      # Lista de matches pendentes
│   │   ├── profile/
│   │   │   ├── page.tsx            # Ver/editar perfil
│   │   │   └── photos/page.tsx     # Gerenciar fotos
│   │   ├── verification/page.tsx   # Submeter verificação
│   │   ├── matches/page.tsx        # Aceitar/recusar matches
│   │   ├── conversations/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── schedule/page.tsx       # Calendário
│   │   └── payments/page.tsx       # Histórico financeiro
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── verifications/page.tsx  # Fila de verificações
│   │   ├── users/page.tsx
│   │   └── reviews/page.tsx
│   ├── caregiver/[id]/page.tsx     # Perfil público do cuidador
│   ├── api/
│   │   ├── matches/
│   │   │   ├── like/route.ts
│   │   │   └── accept/route.ts
│   │   ├── payments/
│   │   │   ├── create/route.ts
│   │   │   └── webhook/route.ts    # Webhook Asaas
│   │   ├── verification/
│   │   │   └── submit/route.ts
│   │   └── upload/route.ts
│   ├── layout.tsx
│   └── page.tsx                    # Landing page
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── cards/
│   │   ├── CaregiverCard.tsx       # Card para swipe
│   │   ├── MatchCard.tsx
│   │   └── ElderlyCard.tsx
│   ├── forms/
│   │   ├── ElderlyProfileForm.tsx
│   │   ├── CaregiverProfileForm.tsx
│   │   └── VerificationForm.tsx
│   ├── match/
│   │   ├── SwipeDeck.tsx           # Componente de swipe
│   │   └── MatchFilters.tsx
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   └── MessageBubble.tsx
│   └── layout/
│       ├── Navbar.tsx
│       └── Sidebar.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   └── middleware.ts
│   ├── asaas/
│   │   └── client.ts               # Integração Asaas
│   ├── validations/
│   │   ├── elderly.ts              # Zod schemas
│   │   ├── caregiver.ts
│   │   └── match.ts
│   └── utils/
│       ├── geo.ts                  # Cálculo de distância
│       └── upload.ts               # Validação de uploads
├── middleware.ts                   # Auth + role guard
├── types/
│   └── database.types.ts           # Types gerados pelo Supabase
└── constants/
    ├── care-tags.ts                # Lista de tags de necessidades
    └── plans.ts                    # Planos e preços
```

---

## 7. VARIÁVEIS DE AMBIENTE

```env
# .env.local — NUNCA commitar este arquivo

# Supabase — públicas (seguro expor no frontend)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Supabase — SOMENTE servidor (NUNCA com NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Asaas (pagamentos) — SOMENTE servidor
ASAAS_API_KEY=...
ASAAS_WEBHOOK_TOKEN=...
ASAAS_ENV=sandbox # ou production

# Verificação de identidade — SOMENTE servidor
REPLICATE_API_TOKEN=...

# Storage
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://xxx.supabase.co/storage/v1/object/public
```

---

## 8. TAGS DE NECESSIDADES (constants/care-tags.ts)

```typescript
export const CARE_TAGS = [
  { value: 'alzheimer', label: 'Alzheimer / Demência' },
  { value: 'mobility_reduced', label: 'Mobilidade reduzida' },
  { value: 'wheelchair', label: 'Cadeirante' },
  { value: 'post_surgery', label: 'Pós-cirurgia' },
  { value: 'palliative', label: 'Cuidados paliativos' },
  { value: 'hygiene', label: 'Higiene e banho' },
  { value: 'medication', label: 'Medicação' },
  { value: 'nocturnal', label: 'Acompanhamento noturno' },
  { value: 'feeding', label: 'Alimentação assistida' },
  { value: 'physiotherapy', label: 'Fisioterapia de manutenção' },
  { value: 'companionship', label: 'Companhia / Lazer' },
  { value: 'hospital', label: 'Acompanhamento hospitalar' },
  { value: 'depression', label: 'Depressão / Saúde mental' },
  { value: 'diabetes', label: 'Diabetes / Pressão alta' },
  { value: 'stroke', label: 'Pós-AVC' },
] as const;

export const SCHEDULES = [
  { value: 'morning', label: 'Manhã (6h–12h)' },
  { value: 'afternoon', label: 'Tarde (12h–18h)' },
  { value: 'evening', label: 'Noite (18h–22h)' },
  { value: 'nocturnal', label: 'Pernoite (22h–6h)' },
  { value: 'fulltime', label: 'Período integral' },
] as const;
```

---

## 9. FLUXOS CRÍTICOS DE NEGÓCIO

### Fluxo de Match Completo
```
1. Família acessa o feed (SwipeDeck)
2. Família dá Like em um cuidador
   → INSERT em matches com family_action = 'like', status = 'pending'
   → Notificação push enviada ao cuidador
3. Cuidador recebe notificação → acessa dashboard
4. Cuidador aceita o match
   → UPDATE em matches: caregiver_action = 'accept', status = 'confirmed'
   → TRIGGER: criar cobrança no Asaas (R$ 5 a R$ 15)
   → Criar conversa em conversations
   → Notificação para família: "Você tem um novo match!"
5. Cuidador paga a taxa (PIX/cartão via Asaas)
   → Webhook Asaas: UPDATE payments.status = 'paid'
   → Match liberado para chat completo
6. Chat ativo → família e cuidador conversam → agendamento criado
7. Serviço concluído → família avalia o cuidador
   → TRIGGER: atualizar rating_average do cuidador
```

### Fluxo de Verificação
```
1. Cuidador acessa /caregiver/verification
2. Faz upload: doc frente, doc verso, selfie, vídeo
   → Validação de tipo e tamanho no servidor
   → Upload para Supabase Storage (bucket privado: 'verifications')
   → INSERT em verification_submissions
3. Edge Function processa em background:
   → Chama API de IA (Replicate) para comparar selfie x documento
   → Salva ai_score e ai_response
   → Se score >= 0.85: UPDATE status = 'approved' automaticamente
   → Se score < 0.70: marcar para revisão manual pelo admin
4. Admin revisa casos borderline no painel
5. UPDATE caregiver_profiles.verification_status
6. Email/notificação informando o resultado ao cuidador
```

### Fluxo de Pagamento (Asaas)
```
1. Match aceito pelo cuidador
2. API Route POST /api/payments/create:
   → Cria customer no Asaas (se não existir)
   → Cria cobrança PIX de R$5 a R$15
   → Salva asaas_charge_id em payments
   → Retorna link de pagamento para o frontend
3. Cuidador paga via PIX
4. Webhook POST /api/payments/webhook:
   → Valida token do webhook (ASAAS_WEBHOOK_TOKEN)
   → Se event = 'PAYMENT_RECEIVED': UPDATE payments.status = 'paid'
   → Liberar funcionalidades do match
5. Cuidador não paga em 24h → match expires automaticamente
   → Cron job (Supabase Edge Function scheduled) atualiza status
```

---

## 10. SEGURANÇA — REGRAS OBRIGATÓRIAS

> Baseado no SECURITY-RULES.md do projeto. Aplicar sem exceção.

### Variáveis de Ambiente
- ❌ NUNCA usar `NEXT_PUBLIC_` em chaves secretas
- ❌ NUNCA commitar `.env.local` no git
- ✅ `SUPABASE_SERVICE_ROLE_KEY` somente em Server Actions e API Routes
- ✅ `ASAAS_API_KEY` somente no servidor

### Supabase / RLS
- ✅ RLS ativado em TODAS as tabelas (sem exceção)
- ✅ Políticas com `auth.uid()` — nunca policies abertas
- ✅ Bucket `verifications` privado — nunca público
- ✅ Bucket `photos` público somente para fotos de cuidadores verificados

### Upload de Arquivos
```typescript
// Validar magic bytes — não confiar apenas em extensão ou MIME
const MAGIC_BYTES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
};
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
// Nome do arquivo: sempre gerado com crypto.randomUUID() no servidor
```

### API Routes
- ✅ Toda route valida sessão com `getSession()`
- ✅ Inputs validados com Zod antes de qualquer operação
- ✅ Erros retornam mensagem genérica (nunca stack trace)
- ✅ Rate limiting nas rotas de match, pagamento e verificação

### Headers de Segurança (next.config.js)
```javascript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    ].join('; ')
  }
];
```

### Middleware de Autenticação (middleware.ts)
```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/family/:path*',
    '/caregiver/:path*',
    '/admin/:path*',
  ]
};
// Verificar sessão + role antes de qualquer rota protegida
// Redirecionar para /login se não autenticado
// Redirecionar para /dashboard se role errado para aquela rota
```

---

## 11. TECH STACK DEFINITIVO

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR, API Routes, Server Actions integrados |
| Banco de dados | Supabase (PostgreSQL) | RLS nativo, Auth, Realtime, Storage |
| UI Components | shadcn/ui + TailwindCSS | Design system consistente |
| Animações de swipe | `react-spring` ou `@use-gesture` | Swipe fluido como Tinder |
| Formulários | react-hook-form + Zod | Validação robusta |
| Pagamentos | Asaas | PIX nativo, mercado brasileiro |
| Verificação IA | Replicate (face comparison) | API simples, pay-per-use |
| Chat realtime | Supabase Realtime | Já incluso no Supabase |
| Geolocalização | Supabase + PostGIS | Queries por raio |
| Deploy | Vercel | CI/CD com GitHub |
| Storage | Supabase Storage | Buckets públicos e privados |

---

## 12. DESIGN SYSTEM

### Paleta de Cores
```css
--color-primary: #2D9CDB;      /* Azul confiança */
--color-secondary: #27AE60;    /* Verde cuidado */
--color-accent: #F2994A;       /* Laranja ação */
--color-danger: #EB5757;       /* Vermelho alerta */
--color-bg: #F7F9FC;           /* Fundo claro */
--color-text: #1A1A2E;         /* Texto principal */
--color-muted: #6B7280;        /* Texto secundário */
```

### Princípios de UX
- Botões mínimo 48px de altura (acessibilidade para idosos e mobile)
- Tipografia mínima 16px no corpo
- Cards com bordas arredondadas 16px
- Feedbacks visuais imediatos (loading states em toda ação)
- Mensagens de erro claras e humanas (nunca técnicas para o usuário)
- Swipe com feedback háptico no mobile

### Ícone de status de verificação
- ✅ Badge azul com check = verificado
- ⏳ Badge cinza = aguardando verificação  
- ❌ Badge vermelho = rejeitado (só visível para o próprio cuidador)

---

## 13. ROADMAP DE DESENVOLVIMENTO

### Fase 1 — MVP (Semanas 1–5)
**Objetivo:** Validar o produto com usuários reais em Montes Claros / Norte de MG

- [ ] Setup: Next.js + Supabase + deploy no Vercel
- [ ] Schema do banco completo (seção 5)
- [ ] Autenticação (email + Google OAuth)
- [ ] Onboarding (escolha de role)
- [ ] Perfil do idoso (família)
- [ ] Perfil do cuidador (básico, sem verificação IA)
- [ ] Verificação manual (admin aprova via painel simples)
- [ ] Feed de swipe (família)
- [ ] Sistema de match (like → notificação → aceitar/recusar)
- [ ] Chat básico pós-match
- [ ] Integração Asaas (PIX — taxa por match)
- [ ] Landing page

### Fase 2 — Produto (Semanas 6–10)
**Objetivo:** Produto completo, pronto para crescimento

- [ ] Verificação por IA (Replicate)
- [ ] Filtros avançados no feed
- [ ] Avaliações pós-serviço
- [ ] Avaliação da residência
- [ ] Calendário de agendamentos
- [ ] Notificações push (PWA)
- [ ] Dashboard financeiro do cuidador
- [ ] Plano Premium (assinatura)
- [ ] Compartilhamento de perfil (farmácias)
- [ ] Admin completo

### Fase 3 — Escala (Semanas 11–16)
**Objetivo:** Expansão regional e novas funcionalidades

- [ ] App mobile nativo (React Native / Expo)
- [ ] Destaque de perfil (avulso)
- [ ] Parceiros farmácias (integração de desconto)
- [ ] Relatórios e analytics
- [ ] Background check básico (CPF via API)
- [ ] Expansão para outras cidades de MG

---

## 14. PROMPTS POR MÓDULO (Para usar no Antigravity)

> Após colar o contexto global (este documento), use um dos prompts abaixo na sessão específica.

### Prompt — Módulo 1: Setup e Autenticação
```
Contexto: Projeto Cuide+ conforme o documento master acima.

Construa agora o Módulo 1 — Setup e Autenticação:
1. Configurar Next.js 14 com App Router, TailwindCSS e shadcn/ui
2. Configurar Supabase client (browser + server) e middleware de auth
3. Página de login (/login) — email/senha + Google OAuth
4. Página de registro (/register) — com campo de role (família ou cuidador)
5. Middleware.ts que protege rotas e redireciona por role
6. Após cadastro, redirecionar para onboarding correto por role

Stack: Next.js 14, Supabase Auth Helpers, shadcn/ui, TailwindCSS
Segurança: aplicar todas as regras da seção 10 do documento master.
```

### Prompt — Módulo 2: Perfil do Idoso
```
Contexto: Projeto Cuide+ conforme o documento master acima.
Autenticação já está implementada e funcionando.

Construa agora o Módulo 2 — Perfil do Idoso:
1. Formulário completo em /family/elderly/new (campos da seção 4 do documento)
2. Upload de foto do idoso (validação de tipo + tamanho conforme seção 10)
3. Seletor de tags múltiplas usando CARE_TAGS (seção 8)
4. Salvar na tabela elderly_profiles com RLS correto
5. Página de edição /family/elderly/[id]/edit
6. Seção de avaliação da residência (campos boolean + notas)

Validação com Zod. Feedback visual em todos os estados (loading, erro, sucesso).
```

### Prompt — Módulo 3: Perfil do Cuidador
```
Contexto: Projeto Cuide+ conforme o documento master acima.
Autenticação e perfil do idoso já implementados.

Construa agora o Módulo 3 — Perfil do Cuidador:
1. Formulário em /caregiver/profile com todos os campos (seção 4)
2. Upload de galeria de fotos (até 6, com indicação de foto principal)
3. Seletor de especialidades (mesmas CARE_TAGS)
4. Calendário de disponibilidade (dias + turnos)
5. Slider de raio de atendimento em km
6. Perfil público em /caregiver/[id] — visível para todos
7. Badge de verificação condicional

Tabelas: caregiver_profiles + caregiver_photos com RLS da seção 5.
```

### Prompt — Módulo 4: Verificação de Identidade
```
Contexto: Projeto Cuide+ conforme o documento master acima.

Construa agora o Módulo 4 — Verificação de Identidade:
1. Tela em /caregiver/verification com 3 etapas guiadas (stepper)
2. Etapa 1: upload doc frente + verso (validação magic bytes no servidor)
3. Etapa 2: captura de selfie (usar câmera nativa via getUserMedia)
4. Etapa 3: upload de vídeo 360° (máximo 50MB)
5. Upload para bucket PRIVADO do Supabase Storage
6. INSERT em verification_submissions
7. API Route /api/verification/submit que processa e chama Replicate
8. Página de status da verificação (pending/approved/rejected)
9. Painel admin /admin/verifications para aprovar manualmente

Arquivos nomeados com randomUUID() no servidor. Nunca extensão do usuário.
```

### Prompt — Módulo 5: Feed de Swipe e Match
```
Contexto: Projeto Cuide+ conforme o documento master acima.
Perfis de idoso, cuidadores e verificação já implementados.

Construa agora o Módulo 5 — Feed de Swipe e Match:
1. SwipeDeck em /family/dashboard — cards estilo Tinder com react-spring
2. Cada card: foto, nome, especialidades, avaliação, distância, valor/hora
3. Ações: Like (right), Pass (left), Ver perfil completo (tap)
4. Filtros: raio, especialidade, disponibilidade, faixa de valor, só verificados
5. Algoritmo de ordenação (seção 5 — motor de match)
6. API Route POST /api/matches/like — cria match com status pending
7. Dashboard do cuidador: lista de matches pendentes com botão aceitar/recusar
8. API Route POST /api/matches/accept — aceita match + dispara cobrança Asaas
9. Notificações em tempo real (Supabase Realtime)

Garantir UNIQUE (elderly_id, caregiver_id) para evitar matches duplicados.
```

### Prompt — Módulo 6: Chat e Agendamento
```
Contexto: Projeto Cuide+ conforme o documento master acima.
Match confirmado já funciona.

Construa agora o Módulo 6 — Chat e Agendamento:
1. Chat em tempo real com Supabase Realtime em /family/conversations/[id]
2. Interface de chat completa: bolhas de mensagem, timestamps, leitura
3. Validação: mensagem máximo 2000 caracteres
4. Botão "Agendar serviço" → modal com DatePicker + horário
5. INSERT em schedules com status pending
6. Cuidador confirma/cancela agendamento no dashboard
7. Lista de todas as conversas ativas com preview da última mensagem
8. Botão "Compartilhar perfil" → gera link para WhatsApp

RLS: só participantes do match veem a conversa.
```

### Prompt — Módulo 7: Pagamentos (Asaas)
```
Contexto: Projeto Cuide+ conforme o documento master acima.
Stack: Next.js 14 + Asaas API + Supabase.

Construa agora o Módulo 7 — Pagamentos com Asaas:
1. API Route POST /api/payments/create:
   - Autenticar usuário (somente cuidador)
   - Criar ou recuperar customer no Asaas
   - Criar cobrança PIX de R$5 (básico) ou R$10 (padrão)
   - Salvar payment com asaas_charge_id no Supabase
   - Retornar link de pagamento PIX
2. API Route POST /api/payments/webhook:
   - Validar ASAAS_WEBHOOK_TOKEN no header
   - Se PAYMENT_RECEIVED: UPDATE payments.status = 'paid'
   - Liberar conversa do match
3. Dashboard financeiro do cuidador /caregiver/payments:
   - Histórico de pagamentos com status
   - Total pago no mês
4. Cron job (Edge Function scheduled): expirar matches não pagos após 24h

ASAAS_API_KEY somente no servidor. Nunca no frontend.
```

---

## 15. CHECKLIST DE LANÇAMENTO

### Antes do primeiro deploy em produção:
- [ ] Todas as tabelas têm RLS ativado
- [ ] Nenhuma chave secreta com prefixo `NEXT_PUBLIC_`
- [ ] `.env.local` no `.gitignore`
- [ ] Bucket `verifications` configurado como PRIVADO
- [ ] Bucket `photos` com policy: público apenas para cuidadores verificados
- [ ] Webhook Asaas configurado e token salvo na env
- [ ] Headers de segurança configurados no `next.config.js`
- [ ] Middleware.ts protegendo todas as rotas autenticadas
- [ ] Rate limiting nas rotas críticas (match, payment, verification)
- [ ] `npm audit` sem vulnerabilidades críticas
- [ ] Domínio com HTTPS (automático no Vercel)
- [ ] Variáveis de ambiente configuradas no painel da Vercel (não só no .env local)
- [ ] Email de verificação configurado no Supabase Auth
- [ ] Logs de segurança funcionando

---

*Documento gerado para o projeto Cuide+ — Hamilton / 2026*
*Stack: Next.js 14 · Supabase · Asaas · Vercel · TailwindCSS · shadcn/ui*
