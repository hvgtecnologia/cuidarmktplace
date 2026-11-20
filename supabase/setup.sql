-- =============================================================================
-- CUIDE+ — Schema Completo (Supabase / PostgreSQL)
-- Execute este script no SQL Editor do Supabase em uma nova conexão.
-- Idempotente: pode ser rodado mais de uma vez sem perda de dados.
-- =============================================================================

-- ============== EXTENSIONS =================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============== ENUM TYPES =================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('family', 'caregiver', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'in_review', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE match_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('inactive', 'trialing', 'active', 'past_due', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE plan_tier AS ENUM ('free', 'pro', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE caregiver_level AS ENUM ('companion', 'basic', 'technical', 'nurse');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Como o dinheiro entra.
DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('card', 'pix', 'boleto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Quem processa. 'fake' roda sem conta em provedor nenhum e existe para
-- desenvolvimento e teste. O provedor oficial ainda não foi escolhido: a
-- aplicação conversa com a interface PaymentProvider, não com um deles.
DO $$ BEGIN
  CREATE TYPE payment_provider AS ENUM ('fake', 'asaas', 'stripe', 'mercadopago', 'pagarme');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE service_modality AS ENUM (
    'hourly', 'half_day', 'day_shift', 'night_shift',
    'overnight', 'full_24h', 'monthly'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============== HELPERS ====================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- O usuário logado é admin?
--
-- SECURITY DEFINER é OBRIGATÓRIO aqui: esta função é usada dentro das policies
-- da própria tabela profiles. Se ela lesse profiles respeitando RLS, a policy
-- chamaria a função que consultaria a tabela que avaliaria a policy... e o
-- Postgres aborta com "infinite recursion detected in policy".
-- STABLE permite ao planner chamar uma vez por query em vez de por linha.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- O usuário logado tem algum match com este outro usuário?
-- Usada para liberar a leitura cruzada família <-> cuidador.
CREATE OR REPLACE FUNCTION public.shares_match_with(p_other uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches m
    WHERE (m.family_id = auth.uid() AND m.caregiver_id = p_other)
       OR (m.caregiver_id = auth.uid() AND m.family_id = p_other)
  );
$$;

-- Idem, mas só matches ACEITOS — para dados mais sensíveis (ficha do idoso).
CREATE OR REPLACE FUNCTION public.has_accepted_match_with_family(p_family uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.caregiver_id = auth.uid()
      AND m.family_id = p_family
      AND m.status = 'accepted'
  );
$$;

-- ============== PROFILES ===================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'family',
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  bio_short text,
  is_active boolean NOT NULL DEFAULT true,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Migrations: add columns if upgrading from an older schema
DO $$ BEGIN
  -- Convert legacy text "role" to enum if needed
  BEGIN
    ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role USING role::user_role;
  EXCEPTION WHEN others THEN NULL; END;
END $$;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio_short text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
-- CPF/CNPJ (só dígitos). Exigido pelo Asaas para criar cobrança — sem RG,
-- nome social, etc.: é só o que o provedor de pagamento precisa.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document text;
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- PRIVILÉGIO POR COLUNA — o que o RLS não cobre.
--
-- RLS é row-level: a policy acima autoriza a LINHA, mas não restringe COLUNA.
-- Sem o grant abaixo, qualquer usuário logado faria um PATCH na própria linha
-- com role='admin' e viraria administrador — contornando tanto a lista branca
-- do server action quanto a validação do trigger handle_new_user().
--
-- Só estas colunas são editáveis pelo próprio dono. role, is_active e
-- onboarded ficam fora: são decisão da plataforma.
-- Para promover alguém a admin, direto no SQL Editor:
--   UPDATE public.profiles SET role='admin' WHERE id='<uuid>';
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, avatar_url, bio_short, document) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_public_caregivers" ON public.profiles;
CREATE POLICY "profiles_select_public_caregivers" ON public.profiles FOR SELECT
  USING (role = 'caregiver' AND is_active = true);

-- Contraparte de um match: sem isto o cuidador não enxerga o NOME da família
-- que o convidou (o dashboard dele exibia só a inicial "F"), porque as policies
-- acima só liberam a própria linha e as linhas de cuidadores.
DROP POLICY IF EXISTS "profiles_select_match_counterpart" ON public.profiles;
CREATE POLICY "profiles_select_match_counterpart" ON public.profiles FOR SELECT
  USING (public.shares_match_with(id));

-- Admin lê todos os perfis (painel /admin/families contava 0 famílias).
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT
  USING (public.is_admin());
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============== CAREGIVER PROFILES =========================================
CREATE TABLE IF NOT EXISTS public.caregiver_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio text NOT NULL DEFAULT '',
  level caregiver_level NOT NULL DEFAULT 'basic',
  years_experience smallint NOT NULL DEFAULT 0,
  specialties text[] NOT NULL DEFAULT ARRAY[]::text[],
  certifications text[] NOT NULL DEFAULT ARRAY[]::text[],
  coren_number text,
  -- Multi-tier pricing (Brazilian market 2026)
  hourly_rate numeric(10, 2) NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0),
  half_day_rate numeric(10, 2),
  day_shift_rate numeric(10, 2),
  night_shift_rate numeric(10, 2),
  overnight_rate numeric(10, 2),
  full_24h_rate numeric(10, 2),
  monthly_rate numeric(10, 2),
  offered_modalities text[] NOT NULL DEFAULT ARRAY[]::text[],
  -- Schedule
  available_days text[] NOT NULL DEFAULT ARRAY[]::text[],
  available_shifts text[] NOT NULL DEFAULT ARRAY[]::text[],
  service_radius_km smallint NOT NULL DEFAULT 10 CHECK (service_radius_km BETWEEN 1 AND 100),
  city text NOT NULL DEFAULT '',
  neighborhood text NOT NULL DEFAULT '',
  state text,
  location geography(Point, 4326),
  -- Trust & ratings
  rating_average numeric(3, 2) NOT NULL DEFAULT 0 CHECK (rating_average >= 0 AND rating_average <= 5),
  rating_count integer NOT NULL DEFAULT 0,
  match_count integer NOT NULL DEFAULT 0,
  jobs_completed integer NOT NULL DEFAULT 0,
  response_time_minutes integer,
  background_check_at timestamptz,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  is_pro boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Migrations: add columns if upgrading from an older schema
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS level caregiver_level NOT NULL DEFAULT 'basic';
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS coren_number text;
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS half_day_rate numeric(10, 2);
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS day_shift_rate numeric(10, 2);
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS night_shift_rate numeric(10, 2);
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS overnight_rate numeric(10, 2);
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS full_24h_rate numeric(10, 2);
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS monthly_rate numeric(10, 2);
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS offered_modalities text[] NOT NULL DEFAULT ARRAY[]::text[];
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS jobs_completed integer NOT NULL DEFAULT 0;
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS response_time_minutes integer;
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS background_check_at timestamptz;
-- Motivo da recusa na verificação (CUIDE_PLUS_MASTER.md, Módulo 4: "rejected
-- (com motivo)"). Preenchido pelo admin em /admin/verification.
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS verification_notes text;

-- ---- MULTI-SERVIÇO --------------------------------------------------------
-- Um mesmo profissional pode oferecer mais de uma função: cuidar, dirigir, ou
-- as duas. Valores: 'care' | 'driving'.
--
-- Default ARRAY['care'] faz o backfill dos perfis que já existiam — todos eram
-- cuidadores antes desta coluna existir.
--
-- NOTA DE NOMENCLATURA: a tabela continua `caregiver_profiles` embora agora
-- guarde também motoristas. Renomear para `professional_profiles` implicaria
-- renomear as FKs (matches_caregiver_id_fkey etc.), que aparecem literalmente
-- nas strings de join do PostgREST em todo o código. É dívida consciente.
ALTER TABLE public.caregiver_profiles
  ADD COLUMN IF NOT EXISTS services text[] NOT NULL DEFAULT ARRAY['care']::text[];

-- Garante que ninguém fique sem nenhum serviço marcado.
DO $$ BEGIN
  ALTER TABLE public.caregiver_profiles
    ADD CONSTRAINT caregiver_services_not_empty CHECK (array_length(services, 1) >= 1);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- GIN porque a busca filtra com `services @> ARRAY['driving']`.
CREATE INDEX IF NOT EXISTS caregiver_profiles_services_idx
  ON public.caregiver_profiles USING GIN (services);

-- ---- CAMPOS DE MOTORISTA --------------------------------------------------
-- Nulos para quem não dirige. O raio de atendimento NÃO é duplicado aqui:
-- service_radius_km já existe e vale para todos os serviços do profissional.
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS vehicle_model text;
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS vehicle_year smallint;
-- Veículo adaptado para cadeirante — filtro relevante para a família.
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS vehicle_accessible boolean NOT NULL DEFAULT false;
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS driver_license_category text;
-- Preço por trajeto (ida ou volta). Em reais, como as demais faixas.
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS trip_rate numeric(10, 2) CHECK (trip_rate IS NULL OR trip_rate >= 0);
ALTER TABLE public.caregiver_profiles ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS caregiver_profiles_specialties_idx ON public.caregiver_profiles USING GIN (specialties);
CREATE INDEX IF NOT EXISTS caregiver_profiles_shifts_idx ON public.caregiver_profiles USING GIN (available_shifts);
CREATE INDEX IF NOT EXISTS caregiver_profiles_modalities_idx ON public.caregiver_profiles USING GIN (offered_modalities);
CREATE INDEX IF NOT EXISTS caregiver_profiles_city_idx ON public.caregiver_profiles(city);
CREATE INDEX IF NOT EXISTS caregiver_profiles_level_idx ON public.caregiver_profiles(level);
CREATE INDEX IF NOT EXISTS caregiver_profiles_rating_idx ON public.caregiver_profiles(rating_average DESC);
CREATE INDEX IF NOT EXISTS caregiver_profiles_verification_idx ON public.caregiver_profiles(verification_status);
CREATE INDEX IF NOT EXISTS caregiver_profiles_location_idx ON public.caregiver_profiles USING GIST (location);
CREATE INDEX IF NOT EXISTS caregiver_profiles_featured_idx ON public.caregiver_profiles(is_featured DESC, is_pro DESC, rating_average DESC);

DROP TRIGGER IF EXISTS caregiver_profiles_updated ON public.caregiver_profiles;
CREATE TRIGGER caregiver_profiles_updated BEFORE UPDATE ON public.caregiver_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.caregiver_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "caregiver_select_verified" ON public.caregiver_profiles;
CREATE POLICY "caregiver_select_verified" ON public.caregiver_profiles FOR SELECT
  USING (verification_status = 'approved' OR auth.uid() = user_id);
DROP POLICY IF EXISTS "caregiver_modify_own" ON public.caregiver_profiles;
CREATE POLICY "caregiver_modify_own" ON public.caregiver_profiles FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin: a fila de verificação precisa ver os perfis PENDENTES (a policy
-- pública só mostra os já aprovados), e precisa poder aprovar/recusar.
DROP POLICY IF EXISTS "caregiver_select_admin" ON public.caregiver_profiles;
CREATE POLICY "caregiver_select_admin" ON public.caregiver_profiles FOR SELECT
  USING (public.is_admin());
DROP POLICY IF EXISTS "caregiver_update_admin" ON public.caregiver_profiles;
CREATE POLICY "caregiver_update_admin" ON public.caregiver_profiles FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============== ELDERLY PROFILES ===========================================
CREATE TABLE IF NOT EXISTS public.elderly_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  age smallint CHECK (age BETWEEN 1 AND 130),
  sex text CHECK (sex IN ('M', 'F', 'outro')),
  photo_url text,
  city text NOT NULL DEFAULT '',
  neighborhood text NOT NULL DEFAULT '',
  state text,
  location geography(Point, 4326),
  care_needs text[] NOT NULL DEFAULT ARRAY[]::text[],
  preferred_schedule text[] NOT NULL DEFAULT ARRAY[]::text[],
  observations text,
  has_stairs boolean DEFAULT false,
  has_ramp boolean DEFAULT false,
  has_adapted_bathroom boolean DEFAULT false,
  has_caregiver_room boolean DEFAULT false,
  has_pets boolean DEFAULT false,
  residence_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS elderly_family_idx ON public.elderly_profiles(family_id);

DROP TRIGGER IF EXISTS elderly_updated ON public.elderly_profiles;
CREATE TRIGGER elderly_updated BEFORE UPDATE ON public.elderly_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.elderly_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "elderly_modify_own" ON public.elderly_profiles;
CREATE POLICY "elderly_modify_own" ON public.elderly_profiles FOR ALL
  USING (auth.uid() = family_id) WITH CHECK (auth.uid() = family_id);

-- Regra de negócio 5 do CUIDE_PLUS_MASTER.md: a ficha do idoso (incluindo a
-- avaliação da residência) é visível ao cuidador APENAS com match aceito.
-- Note has_accepted_match_with_family, e não shares_match_with: um convite
-- ainda pendente não dá acesso aos dados do idoso.
DROP POLICY IF EXISTS "elderly_select_accepted_caregiver" ON public.elderly_profiles;
CREATE POLICY "elderly_select_accepted_caregiver" ON public.elderly_profiles FOR SELECT
  USING (public.has_accepted_match_with_family(family_id));

DROP POLICY IF EXISTS "elderly_select_admin" ON public.elderly_profiles;
CREATE POLICY "elderly_select_admin" ON public.elderly_profiles FOR SELECT
  USING (public.is_admin());

-- ============== MATCHES ====================================================
CREATE TABLE IF NOT EXISTS public.matches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caregiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  elderly_id uuid REFERENCES public.elderly_profiles(id) ON DELETE SET NULL,
  status match_status NOT NULL DEFAULT 'pending',
  message text,
  family_message text,
  caregiver_response text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(family_id, caregiver_id, elderly_id)
);
CREATE INDEX IF NOT EXISTS matches_family_idx ON public.matches(family_id, status);
CREATE INDEX IF NOT EXISTS matches_caregiver_idx ON public.matches(caregiver_id, status);
CREATE INDEX IF NOT EXISTS matches_status_idx ON public.matches(status);

DROP TRIGGER IF EXISTS matches_updated ON public.matches;
CREATE TRIGGER matches_updated BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "matches_select_involved" ON public.matches;
CREATE POLICY "matches_select_involved" ON public.matches FOR SELECT
  USING (auth.uid() = family_id OR auth.uid() = caregiver_id);
DROP POLICY IF EXISTS "matches_insert_family" ON public.matches;
-- Além de ser o próprio family_id, o autor precisa TER role 'family'. Sem o
-- segundo teste, um cuidador logado conseguia inserir matches usando o próprio
-- uuid como family_id (a UI dele chegava a mostrar o botão "Convidar").
CREATE POLICY "matches_insert_family" ON public.matches FOR INSERT
  WITH CHECK (
    auth.uid() = family_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'family'
    )
  );
DROP POLICY IF EXISTS "matches_update_involved" ON public.matches;
CREATE POLICY "matches_update_involved" ON public.matches FOR UPDATE
  USING (auth.uid() = family_id OR auth.uid() = caregiver_id);

DROP POLICY IF EXISTS "matches_select_admin" ON public.matches;
CREATE POLICY "matches_select_admin" ON public.matches FOR SELECT
  USING (public.is_admin());

-- ============== MESSAGES (CHAT) ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_match_idx ON public.messages(match_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select_match_member" ON public.messages;
CREATE POLICY "messages_select_match_member" ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id AND (auth.uid() = m.family_id OR auth.uid() = m.caregiver_id)
  ));
DROP POLICY IF EXISTS "messages_insert_match_member" ON public.messages;
CREATE POLICY "messages_insert_match_member" ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id AND m.status = 'accepted'
      AND (auth.uid() = m.family_id OR auth.uid() = m.caregiver_id)
  ));

-- ============== REVIEWS ====================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id uuid UNIQUE NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caregiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_caregiver_idx ON public.reviews(caregiver_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- LEITURA DA TABELA BASE É FECHADA.
--
-- Antes era USING (true): qualquer um lia reviewer_id e match_id. Como o
-- cuidador enxerga family_id nos próprios matches, bastava cruzar
-- review.reviewer_id = match.family_id para descobrir QUEM avaliou — e o
-- comentário deixava de ser anônimo.
--
-- O público lê pela view caregiver_public_reviews (abaixo), que não tem
-- nenhuma coluna de identidade. Aqui na base, só o autor e o admin.
DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
DROP POLICY IF EXISTS "reviews_select_own" ON public.reviews;
CREATE POLICY "reviews_select_own" ON public.reviews FOR SELECT
  USING (auth.uid() = reviewer_id);
DROP POLICY IF EXISTS "reviews_select_admin" ON public.reviews;
CREATE POLICY "reviews_select_admin" ON public.reviews FOR SELECT
  USING (public.is_admin());

-- ESCRITA: três buracos fechados em relação ao WITH CHECK antigo
-- (auth.uid() = reviewer_id, e nada mais):
--
--  1. não conferia se o autor era a família DAQUELE match — dava para avaliar
--     um atendimento alheio;
--  2. não conferia o caregiver_id contra o match — dava para registrar a nota
--     no nome de OUTRO cuidador, afundando ou inflando a média dele;
--  3. não exigia que algo tivesse acontecido — convidar e largar 1 estrela no
--     segundo seguinte era válido.
--
-- Só 'accepted'/'completed': o cuidador precisa ter ao menos aceitado.
DROP POLICY IF EXISTS "reviews_insert_reviewer" ON public.reviews;
CREATE POLICY "reviews_insert_reviewer" ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND m.family_id = auth.uid()
        AND m.caregiver_id = reviews.caregiver_id
        AND m.status IN ('accepted', 'completed')
    )
  );

-- Corrigir a própria avaliação é permitido; trocar de alvo, não. O trigger
-- de média já roda em UPDATE, então o agregado acompanha.
DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);
REVOKE UPDATE ON public.reviews FROM authenticated;
GRANT UPDATE (rating, comment) ON public.reviews TO authenticated;

-- ---- A view pública: nota e comentário, zero identidade --------------------
-- Sem reviewer_id e sem match_id de propósito — são justamente as colunas que
-- permitiriam ligar o comentário a uma família. Roda com direitos do dono
-- (atravessa o RLS acima), e isso é intencional: o conteúdo aqui é público.
DROP VIEW IF EXISTS public.caregiver_public_reviews;
CREATE VIEW public.caregiver_public_reviews AS
  SELECT
    r.id,
    r.caregiver_id,
    r.rating,
    r.comment,
    r.created_at
  FROM public.reviews r;

GRANT SELECT ON public.caregiver_public_reviews TO anon, authenticated;

-- Trigger: keep caregiver rating aggregate in sync
--
-- SECURITY DEFINER é OBRIGATÓRIO. Quem dispara este trigger é a FAMÍLIA, ao
-- avaliar — e a família não pode escrever em caregiver_profiles: a policy
-- caregiver_modify_own exige auth.uid() = user_id.
--
-- Sem SECURITY DEFINER o UPDATE não dá erro: o RLS apenas o reduz a ZERO
-- linhas. A avaliação é gravada, ninguém reclama, e rating_average fica
-- parado em 0 para sempre. Falha silenciosa — a pior categoria.
--
-- O SET search_path fecha o risco que todo SECURITY DEFINER carrega: sem ele,
-- um search_path manipulado poderia apontar "reviews" para outra tabela.
CREATE OR REPLACE FUNCTION public.refresh_caregiver_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.caregiver_profiles cp
  SET rating_average = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM public.reviews WHERE caregiver_id = cp.user_id), 0),
      rating_count   = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE caregiver_id = cp.user_id), 0)
  WHERE cp.user_id = COALESCE(NEW.caregiver_id, OLD.caregiver_id);
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS reviews_refresh_rating ON public.reviews;
CREATE TRIGGER reviews_refresh_rating AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_caregiver_rating();

-- ============== SUBSCRIPTIONS ==============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan plan_tier NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);

DROP TRIGGER IF EXISTS subs_updated ON public.subscriptions;
CREATE TRIGGER subs_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subs_select_own" ON public.subscriptions;
CREATE POLICY "subs_select_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "subs_select_admin" ON public.subscriptions;
CREATE POLICY "subs_select_admin" ON public.subscriptions FOR SELECT USING (public.is_admin());

-- NÃO existe policy de INSERT/UPDATE de subscriptions para o próprio usuário,
-- e isso é deliberado: quem concede plano é o provedor de pagamento, não o
-- cliente. A concessão acontece dentro de confirm_payment(), chamada pelo
-- webhook com a service role depois que o dinheiro entra.

-- ============== PAYMENTS ===================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'BRL',
  status payment_status NOT NULL DEFAULT 'pending',
  description text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- ---- Colunas agnósticas de provedor -------------------------------------
-- `stripe_payment_intent_id` acima é legado: amarra o schema a um provedor
-- que sequer foi escolhido. Fica para não quebrar nada, mas o que vale é
-- (provider, provider_payment_id).
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider payment_provider NOT NULL DEFAULT 'fake';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS provider_payment_id text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS method payment_method;
-- O que está sendo pago: 'subscription_monthly', 'match_fee'...
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS product_code text;
-- Campos específicos de Pix: o QR e o copia-e-cola vêm do provedor.
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS pix_qr_code text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS pix_copy_paste text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS failure_reason text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Um pagamento por id de provedor: trava dupla criação se um retry acontecer.
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_id_uidx
  ON public.payments(provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS payments_user_idx ON public.payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments(status, created_at DESC);

DROP TRIGGER IF EXISTS payments_set_updated_at ON public.payments;
CREATE TRIGGER payments_set_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== CATÁLOGO DE PREÇOS =========================================
-- O valor NUNCA vem do cliente. A função create_payment_intent lê o preço
-- daqui pelo código do produto — se o valor viajasse do navegador, daria para
-- assinar o plano por R$ 0,01.
CREATE TABLE IF NOT EXISTS public.payment_products (
  code text PRIMARY KEY,
  label text NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'BRL',
  -- O que conceder quando pago: 'pro' libera plano, NULL é cobrança avulsa.
  grants_plan plan_tier,
  grants_months smallint,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.payment_products (code, label, amount_cents, grants_plan, grants_months) VALUES
  ('subscription_monthly',   'Plano Mensal',     9900,  'pro', 1),
  ('subscription_quarterly', 'Plano Trimestral', 26700, 'pro', 3),
  ('match_fee',              'Taxa por match',   1000,  NULL,  NULL)
ON CONFLICT (code) DO UPDATE
  SET label = EXCLUDED.label,
      amount_cents = EXCLUDED.amount_cents,
      grants_plan = EXCLUDED.grants_plan,
      grants_months = EXCLUDED.grants_months;

ALTER TABLE public.payment_products ENABLE ROW LEVEL SECURITY;
-- Catálogo é público para leitura (a tela de planos mostra os preços);
-- escrita só por SQL/admin, nunca pela aplicação.
DROP POLICY IF EXISTS "payment_products_select_all" ON public.payment_products;
CREATE POLICY "payment_products_select_all" ON public.payment_products FOR SELECT USING (is_active);

-- ============== EVENTOS DE WEBHOOK =========================================
-- Idempotência: provedor de pagamento reenvia webhook. Sem a UNIQUE abaixo,
-- um reenvio concederia o plano duas vezes.
CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider payment_provider NOT NULL,
  external_event_id text NOT NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, external_event_id)
);
CREATE INDEX IF NOT EXISTS payment_events_payment_idx ON public.payment_events(payment_id);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy de leitura para usuário: log interno. O webhook escreve com
-- a service role, que ignora RLS.
DROP POLICY IF EXISTS "payment_events_select_admin" ON public.payment_events;
CREATE POLICY "payment_events_select_admin" ON public.payment_events FOR SELECT
  USING (public.is_admin());

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own" ON public.payments FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "payments_select_admin" ON public.payments;
CREATE POLICY "payments_select_admin" ON public.payments FOR SELECT USING (public.is_admin());

-- ============== NOTIFICATIONS ==============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_unread_idx ON public.notifications(user_id) WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notif_select_own" ON public.notifications;
CREATE POLICY "notif_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_update_own" ON public.notifications;
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============== FAVORITES ==================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  family_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caregiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (family_id, caregiver_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "favorites_own" ON public.favorites;
CREATE POLICY "favorites_own" ON public.favorites FOR ALL
  USING (auth.uid() = family_id) WITH CHECK (auth.uid() = family_id);

-- ============== AUTH HOOK: create profile ==================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_requested text := NEW.raw_user_meta_data->>'role';
  v_role user_role;
BEGIN
  -- raw_user_meta_data vem do cliente no signUp(), portanto NÃO é confiável:
  -- um POST com role=admin criaria um administrador. Aqui só 'caregiver' e
  -- 'family' são aceitos; qualquer outra coisa (inclusive 'admin') cai em
  -- 'family'. Admin se concede manualmente:
  --   UPDATE public.profiles SET role='admin' WHERE id='<uuid>';
  -- A lista branca no server action (src/app/actions.ts) é a primeira barreira;
  -- esta é a segunda, e vale também para OAuth e para chamadas diretas na API.
  v_role := CASE
    WHEN v_requested = 'caregiver' THEN 'caregiver'::user_role
    ELSE 'family'::user_role
  END;
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_role
  );

  IF v_role = 'caregiver' THEN
    INSERT INTO public.caregiver_profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    INSERT INTO public.subscriptions (user_id, plan, status) VALUES (NEW.id, 'free', 'inactive')
      ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============== BOOKINGS (CONTRATOS) =======================================
-- Cada match aceito pode gerar múltiplos bookings (plantões, contratos)
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
  family_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caregiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  elderly_id uuid REFERENCES public.elderly_profiles(id) ON DELETE SET NULL,
  modality service_modality NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  hours numeric(6, 2) NOT NULL DEFAULT 0,
  rate numeric(10, 2) NOT NULL,
  subtotal_cents integer NOT NULL,
  platform_fee_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL,
  status booking_status NOT NULL DEFAULT 'requested',
  notes text,
  cancelled_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_family_idx ON public.bookings(family_id, start_at DESC);
CREATE INDEX IF NOT EXISTS bookings_caregiver_idx ON public.bookings(caregiver_id, start_at DESC);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(status);

DROP TRIGGER IF EXISTS bookings_updated ON public.bookings;
CREATE TRIGGER bookings_updated BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookings_select_involved" ON public.bookings;
CREATE POLICY "bookings_select_involved" ON public.bookings FOR SELECT
  USING (auth.uid() = family_id OR auth.uid() = caregiver_id);
DROP POLICY IF EXISTS "bookings_insert_family" ON public.bookings;
CREATE POLICY "bookings_insert_family" ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = family_id);
DROP POLICY IF EXISTS "bookings_update_involved" ON public.bookings;
CREATE POLICY "bookings_update_involved" ON public.bookings FOR UPDATE
  USING (auth.uid() = family_id OR auth.uid() = caregiver_id);

-- Admin: /admin/bookings calculava GMV e take rate sobre 0 linhas.
DROP POLICY IF EXISTS "bookings_select_admin" ON public.bookings;
CREATE POLICY "bookings_select_admin" ON public.bookings FOR SELECT
  USING (public.is_admin());
DROP POLICY IF EXISTS "bookings_update_admin" ON public.bookings;
CREATE POLICY "bookings_update_admin" ON public.bookings FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============== CHECKOUT SIMULADO — REMOVIDO ===============================
-- simulate_subscription_checkout() concedia plano direto, sem pagamento. Era
-- um "me dê plano de graça" disponível a qualquer cuidador logado, e existia
-- só porque não havia estrutura de pagamento.
--
-- Agora existe: create_payment_intent + confirm_payment, com o valor saindo do
-- catálogo e a confirmação vindo por webhook. A função antiga sai de cena.
DROP FUNCTION IF EXISTS public.simulate_subscription_checkout(plan_tier, timestamptz);

-- ============== STORAGE BUCKETS ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('elderly-photos', 'elderly-photos', false) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false) ON CONFLICT (id) DO NOTHING;

-- Policies do bucket de avatares.
--
-- storage.objects tem RLS ligado por padrão no Supabase: sem as policies
-- abaixo os buckets existem mas NINGUÉM consegue enviar arquivo.
--
-- Convenção de caminho: avatars/<user_id>/<arquivo>. É o primeiro segmento da
-- pasta que amarra o arquivo ao dono — por isso todas as regras de escrita
-- comparam (storage.foldername(name))[1] com o auth.uid(). Sem isso, um
-- usuário sobrescreveria a foto de outro.
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
CREATE POLICY "avatars_select_public" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ===========================================================================
-- PRIVACIDADE DO CUIDADOR — o cuidador não sabe quem é a família
-- ===========================================================================
--
-- Regra: ao receber um convite, o cuidador vê apenas BAIRRO/CIDADE, TIPO DE
-- SERVIÇO e SEXO do idoso. Nome, foto, telefone, CPF e a ficha completa do
-- idoso (observações, avaliação da residência) ficam fechados até existir
-- AGENDAMENTO FIRMADO entre os dois.
--
-- Este bloco fica no FIM do arquivo de propósito: depende da tabela bookings,
-- criada mais acima. Como tudo aqui é DROP ... CREATE, redefinir políticas já
-- declaradas antes é intencional — vale a última definição, e o modelo de
-- privacidade inteiro fica legível num lugar só.

-- ---- Portão de identidade --------------------------------------------------
-- Hoje NADA cria booking, então isto devolve false sempre e o anonimato é
-- total. Quando a contratação for construída, o portão abre sozinho — não há
-- outro lugar para mexer.
--
-- 'requested' NÃO conta: é a família pedindo, ainda sem acordo das duas partes.
CREATE OR REPLACE FUNCTION public.has_confirmed_booking_with_family(p_family uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.caregiver_id = auth.uid()
      AND b.family_id = p_family
      AND b.status IN ('confirmed', 'in_progress', 'completed')
  );
$$;

-- ---- profiles: leitura da contraparte vira ASSIMÉTRICA ---------------------
-- Antes: shares_match_with(id) — qualquer match, nos dois sentidos. Isso dava
-- ao cuidador a LINHA INTEIRA do perfil da família, incluindo phone e document
-- (CPF). RLS é row-level: não adianta a tela selecionar poucas colunas, porque
-- um PATCH/GET direto na API devolveria o resto.
--
-- Agora:
--   família  -> cuidador : liberado (o cuidador é público de qualquer forma)
--   cuidador -> família  : só com agendamento firmado
DROP POLICY IF EXISTS "profiles_select_match_counterpart" ON public.profiles;
CREATE POLICY "profiles_select_match_counterpart" ON public.profiles FOR SELECT
  USING (
    -- Eu sou a família lendo o perfil de um cuidador com quem tenho match.
    (role = 'caregiver' AND public.shares_match_with(id))
    -- Ou eu sou o cuidador e já existe agendamento firmado com esta família.
    OR (role = 'family' AND public.has_confirmed_booking_with_family(id))
  );

-- ---- elderly_profiles: ficha completa também espera o agendamento ----------
-- Antes era has_accepted_match_with_family: aceitar o convite abria a ficha
-- inteira (nome do idoso, foto, observações, notas da residência). Com o
-- anonimato, aceitar não basta — o que o cuidador precisa para DECIDIR vem
-- pela view caregiver_match_requests abaixo, sem identificar ninguém.
DROP POLICY IF EXISTS "elderly_select_accepted_caregiver" ON public.elderly_profiles;
DROP POLICY IF EXISTS "elderly_select_booked_caregiver" ON public.elderly_profiles;
CREATE POLICY "elderly_select_booked_caregiver" ON public.elderly_profiles FOR SELECT
  USING (public.has_confirmed_booking_with_family(family_id));

-- ---- Todo convite precisa dizer PARA QUEM é ---------------------------------
-- Sem elderly_id não há bairro/serviço/sexo para mostrar, e o cuidador ficaria
-- decidindo às cegas. O WITH CHECK só vale para linhas NOVAS — convites
-- antigos com elderly_id nulo continuam existindo e são tratados na aplicação.
-- O EXISTS garante que a ficha é mesmo desta família (e não de outra pessoa).
DROP POLICY IF EXISTS "matches_insert_family" ON public.matches;
CREATE POLICY "matches_insert_family" ON public.matches FOR INSERT
  WITH CHECK (
    auth.uid() = family_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'family'
    )
    AND elderly_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.elderly_profiles e
      WHERE e.id = elderly_id AND e.family_id = auth.uid()
    )
  );

-- ---- A view que o cuidador enxerga ------------------------------------------
-- Por que uma VIEW e não uma policy: RLS decide LINHA, não COLUNA. Liberar a
-- linha de elderly_profiles entregaria nome, foto e observações junto. A view
-- expõe só o conjunto seguro de colunas.
--
-- ATENÇÃO — esta view roda com os direitos do DONO (security_invoker desligado,
-- que é o padrão), então ela ATRAVESSA o RLS de matches e elderly_profiles.
-- O WHERE abaixo é, portanto, a ÚNICA barreira de acesso: o filtro
-- m.caregiver_id = auth.uid() não é conveniência, é a trava. Não relaxe esse
-- WHERE sem ligar security_invoker e repensar as policies.
--
-- NÃO inclua aqui: e.name, e.photo_url, e.observations, e.residence_notes,
-- e.location, nem nada de profiles. Faixa etária em vez de idade exata, para
-- não virar identificador junto com bairro + sexo.
DROP VIEW IF EXISTS public.caregiver_match_requests;
CREATE VIEW public.caregiver_match_requests AS
  SELECT
    m.id            AS match_id,
    m.status,
    m.created_at,
    e.city,
    e.neighborhood,
    e.state,
    e.sex,
    e.care_needs,
    e.preferred_schedule,
    CASE
      WHEN e.age IS NULL     THEN NULL
      WHEN e.age < 70        THEN 'menos de 70'
      WHEN e.age < 80        THEN '70 a 79'
      WHEN e.age < 90        THEN '80 a 89'
      ELSE '90 ou mais'
    END             AS age_range
  FROM public.matches m
  -- LEFT e não INNER: convites criados antes desta regra têm elderly_id nulo.
  -- Com INNER eles sumiriam da lista do cuidador sem aviso; assim aparecem com
  -- os campos vazios e a tela mostra "não informado".
  LEFT JOIN public.elderly_profiles e ON e.id = m.elderly_id
  WHERE m.caregiver_id = auth.uid();

-- A view é só leitura e já filtra por auth.uid(); anon não tem sessão, logo
-- não enxerga linha nenhuma — mas não damos o privilégio para deixar explícito.
REVOKE ALL ON public.caregiver_match_requests FROM anon;
GRANT SELECT ON public.caregiver_match_requests TO authenticated;

-- ===========================================================================
-- CERTIFICADOS, RG E ORDEM DE EXIBIÇÃO
-- ===========================================================================
--
-- Duas coisas ligadas: como o cuidador prova quem é, e em que ordem ele
-- aparece para a família.
--
-- Documento de identidade tem prazo: certificado e RG ficam no banco por
-- UMA SEMANA e somem. O que sobrevive é só o RESULTADO da conferência
-- (verificação presencial / online), nunca a imagem do documento.

-- ---- Como a verificação foi feita -----------------------------------------
-- Separado de verification_status: `status` diz se o perfil está no ar,
-- `method` diz quanta prova foi apresentada. Um perfil aprovado pode nunca
-- ter tido documento conferido — daí method NULL.
DO $$ BEGIN
  CREATE TYPE verification_method AS ENUM ('online', 'in_person');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.caregiver_profiles
  ADD COLUMN IF NOT EXISTS verification_method verification_method;

-- ---- Os documentos --------------------------------------------------------
-- A tabela guarda o CAMINHO no storage, não o arquivo. expires_at é a regra
-- de negócio escrita no schema: sete dias a partir do envio.
CREATE TABLE IF NOT EXISTS public.caregiver_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  caregiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('rg', 'certificate')),
  storage_path text NOT NULL UNIQUE,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);
CREATE INDEX IF NOT EXISTS caregiver_documents_owner_idx
  ON public.caregiver_documents(caregiver_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS caregiver_documents_expiry_idx
  ON public.caregiver_documents(expires_at);

ALTER TABLE public.caregiver_documents ENABLE ROW LEVEL SECURITY;

-- O dono enxerga os próprios registros mesmo depois de expirar, para a tela
-- poder dizer "expirou, reenvie" em vez de fingir que nunca existiu.
DROP POLICY IF EXISTS "caregiver_documents_select_own" ON public.caregiver_documents;
CREATE POLICY "caregiver_documents_select_own" ON public.caregiver_documents FOR SELECT
  USING (auth.uid() = caregiver_id);

-- O admin NÃO: passou de uma semana, acabou o acesso, mesmo que a faxina
-- ainda não tenha rodado. O prazo vale por si, não depende do agendador.
DROP POLICY IF EXISTS "caregiver_documents_select_admin" ON public.caregiver_documents;
CREATE POLICY "caregiver_documents_select_admin" ON public.caregiver_documents FOR SELECT
  USING (public.is_admin() AND expires_at > now());

DROP POLICY IF EXISTS "caregiver_documents_insert_own" ON public.caregiver_documents;
CREATE POLICY "caregiver_documents_insert_own" ON public.caregiver_documents FOR INSERT
  WITH CHECK (auth.uid() = caregiver_id);

-- Apagar antes do prazo é direito de quem enviou.
DROP POLICY IF EXISTS "caregiver_documents_delete_own" ON public.caregiver_documents;
CREATE POLICY "caregiver_documents_delete_own" ON public.caregiver_documents FOR DELETE
  USING (auth.uid() = caregiver_id);

-- expires_at não é editável por ninguém: sem o GRANT por coluna, o cuidador
-- empurraria o próprio prazo para 2099 com um PATCH.
REVOKE UPDATE ON public.caregiver_documents FROM authenticated;

-- ---- O arquivo em si -------------------------------------------------------
-- O bucket verification-docs já existia e estava com ZERO policies, ou seja,
-- envio nenhum funcionava (mesmo caso que os avatares tiveram).
-- Ele é privado: diferente de avatars, aqui NÃO existe policy de leitura
-- pública. O acesso é por URL assinada, gerada no servidor.
--
-- Convenção de caminho: verification-docs/<user_id>/<arquivo>
DROP POLICY IF EXISTS "verification_docs_insert_own" ON storage.objects;
CREATE POLICY "verification_docs_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "verification_docs_delete_own" ON storage.objects;
CREATE POLICY "verification_docs_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Leitura: o dono sempre; o admin só enquanto o prazo não venceu. O EXISTS
-- amarra o arquivo ao registro, então o vencimento vale também para o arquivo.
DROP POLICY IF EXISTS "verification_docs_select_owner_or_admin" ON storage.objects;
CREATE POLICY "verification_docs_select_owner_or_admin" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (
        public.is_admin()
        AND EXISTS (
          SELECT 1 FROM public.caregiver_documents d
          WHERE d.storage_path = storage.objects.name
            AND d.expires_at > now()
        )
      )
    )
  );

-- ---- A faxina de sete dias -------------------------------------------------
-- Devolve os caminhos apagados para que o chamador remova os arquivos pelo
-- Storage: apagar a linha de storage.objects por SQL não garante que o
-- binário saia do bucket, então quem apaga de verdade é a API.
--
-- SECURITY DEFINER porque roda sem usuário (job agendado), e o RLS barraria.
CREATE OR REPLACE FUNCTION public.purge_expired_caregiver_documents()
RETURNS TABLE (storage_path text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.caregiver_documents
  WHERE expires_at <= now()
  RETURNING caregiver_documents.storage_path;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_caregiver_documents() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_caregiver_documents() TO service_role;

-- ---- A ordem em que o cuidador aparece -------------------------------------
-- Seis faixas, da melhor para a pior:
--   1 pagou + verificado presencialmente
--   2 pagou + verificado online
--   3 pagou
--   4 verificado presencialmente, não paga
--   5 verificado online, não paga
--   6 nem um nem outro
--
-- "Pagou" é calculado AQUI, na hora da consulta, e não lido de
-- caregiver_profiles.is_pro. Aquela coluna nunca foi preenchida por nada — e,
-- mesmo preenchida, ficaria mentindo no dia em que a assinatura vencesse,
-- porque vencimento não dispara evento nenhum.
--
-- A view roda com direitos do dono e atravessa o RLS; por isso o WHERE repete
-- o que as policies garantiam: só perfil aprovado e conta ativa. Tudo aqui é
-- dado público de vitrine — não há identidade de família envolvida.
DROP VIEW IF EXISTS public.caregiver_search;
CREATE VIEW public.caregiver_search AS
  SELECT
    b.*,
    CASE
      WHEN b.is_paid AND b.verification_method = 'in_person' THEN 1
      WHEN b.is_paid AND b.verification_method = 'online'    THEN 2
      WHEN b.is_paid                                         THEN 3
      WHEN b.verification_method = 'in_person'               THEN 4
      WHEN b.verification_method = 'online'                  THEN 5
      ELSE 6
    END AS rank_tier
  FROM (
    SELECT
      cp.id, cp.user_id, cp.bio, cp.level, cp.years_experience, cp.specialties,
      cp.certifications, cp.coren_number, cp.hourly_rate, cp.half_day_rate,
      cp.day_shift_rate, cp.night_shift_rate, cp.overnight_rate,
      cp.full_24h_rate, cp.monthly_rate, cp.offered_modalities, cp.services,
      cp.vehicle_model, cp.vehicle_year, cp.vehicle_accessible,
      cp.driver_license_category, cp.trip_rate, cp.service_radius_km,
      cp.city, cp.neighborhood, cp.state, cp.available_days,
      cp.available_shifts, cp.rating_average, cp.rating_count,
      cp.jobs_completed, cp.is_featured, cp.verification_status,
      cp.verification_method,
      p.full_name,
      p.avatar_url,
      COALESCE(
        s.status = 'active'
        AND (s.current_period_end IS NULL OR s.current_period_end > now()),
        false
      ) AS is_paid
    FROM public.caregiver_profiles cp
    JOIN public.profiles p ON p.id = cp.user_id
    LEFT JOIN public.subscriptions s ON s.user_id = cp.user_id
    WHERE cp.verification_status = 'approved'
      AND p.is_active = true
  ) b;

GRANT SELECT ON public.caregiver_search TO anon, authenticated;

-- ---- Quem afirmou a verificação presencial, e quando -----------------------
-- Marcar alguém como "verificado pessoalmente" o joga para o topo da vitrine.
-- É uma afirmação de que um humano conferiu o documento na frente da pessoa —
-- então fica registrado QUEM afirmou. Sem isso, a faixa 1 é um campo que
-- qualquer admin muda sem deixar rastro.
ALTER TABLE public.caregiver_profiles
  ADD COLUMN IF NOT EXISTS verification_method_at timestamptz;
ALTER TABLE public.caregiver_profiles
  ADD COLUMN IF NOT EXISTS verification_method_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Troca APENAS o método, sem mexer no status. Serve ao caso real: o cuidador
-- já foi aprovado online e semanas depois aparece presencialmente com o
-- documento — ele não está mais na fila de pendentes, mas precisa subir.
--
-- SECURITY DEFINER com checagem explícita de admin: a função grava
-- verification_method_by = auth.uid(), e esse campo não pode vir do chamador.
CREATE OR REPLACE FUNCTION public.set_verification_method(
  p_caregiver uuid,
  p_method verification_method
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows int;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Ação restrita a administradores.';
  END IF;

  -- Só faz sentido em perfil aprovado: quem não está aprovado nem aparece na
  -- busca, e deixar o método gravado faria o cuidador nascer na faixa 1 no
  -- dia em que fosse aprovado, sem ninguém ter conferido nada.
  UPDATE public.caregiver_profiles
  SET verification_method    = p_method,
      verification_method_at = now(),
      verification_method_by = auth.uid()
  WHERE user_id = p_caregiver
    AND verification_status = 'approved';

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.set_verification_method(uuid, verification_method) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_verification_method(uuid, verification_method) TO authenticated;

-- ---- PRIVILÉGIO POR COLUNA em caregiver_profiles ---------------------------
-- Mesma lição de profiles.role, agora na tabela que decide a VITRINE.
--
-- A policy caregiver_modify_own é FOR ALL USING (auth.uid() = user_id). RLS
-- autoriza a LINHA; não restringe COLUNA. Sem o GRANT abaixo, o cuidador
-- fazia um PATCH na própria linha e saía com:
--     verification_method = 'in_person'   -> pulava da faixa 6 para a 4
--     verification_status = 'approved'    -> entrava na busca sem análise
--     is_featured = true                  -> virava destaque
--     rating_average = 5, rating_count=999-> nota perfeita inventada
--
-- Abaixo ficam SÓ as colunas que são de fato do profissional: o que ele
-- oferece, onde, por quanto e quando. Tudo que é veredito da plataforma ou
-- número calculado fica de fora.
REVOKE INSERT, UPDATE ON public.caregiver_profiles FROM authenticated;

GRANT INSERT (
  user_id, bio, level, years_experience, specialties, certifications,
  coren_number, hourly_rate, half_day_rate, day_shift_rate, night_shift_rate,
  overnight_rate, full_24h_rate, monthly_rate, offered_modalities,
  available_days, available_shifts, service_radius_km, city, neighborhood,
  state, location, services, vehicle_model, vehicle_year, vehicle_accessible,
  driver_license_category, trip_rate, updated_at
) ON public.caregiver_profiles TO authenticated;

-- user_id fora do UPDATE: trocá-lo moveria o perfil para outra conta.
GRANT UPDATE (
  bio, level, years_experience, specialties, certifications,
  coren_number, hourly_rate, half_day_rate, day_shift_rate, night_shift_rate,
  overnight_rate, full_24h_rate, monthly_rate, offered_modalities,
  available_days, available_shifts, service_radius_km, city, neighborhood,
  state, location, services, vehicle_model, vehicle_year, vehicle_accessible,
  driver_license_category, trip_rate, updated_at
) ON public.caregiver_profiles TO authenticated;

-- O admin escreve o veredito por outro caminho: a policy caregiver_update_admin
-- continua valendo, mas o role `authenticated` não alcança essas colunas. Por
-- isso as decisões passam por funções SECURITY DEFINER
-- (set_verification_method) ou pelo fluxo de aprovação, que roda com a policy
-- de admin — e o GRANT por coluna acima NÃO se aplica ao dono da função.

-- ---- A decisão de verificação, agora por função -----------------------------
-- Consequência direta do GRANT por coluna acima: privilégio de coluna vale por
-- ROLE, e o admin também é `authenticated`. Um UPDATE direto em
-- verification_status vindo do app passaria a dar "permission denied" para
-- ele também.
--
-- Então a decisão sai do UPDATE e vira esta função, que confere is_admin() e
-- escreve como DONA — fora do alcance do GRANT por coluna.
CREATE OR REPLACE FUNCTION public.review_caregiver_verification(
  p_caregiver uuid,
  p_decision  verification_status,
  p_notes     text DEFAULT NULL,
  p_method    verification_method DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows int;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Ação restrita a administradores.';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decisão inválida: %', p_decision;
  END IF;

  UPDATE public.caregiver_profiles
  SET verification_status    = p_decision,
      verified_at            = CASE WHEN p_decision = 'approved' THEN now() ELSE NULL END,
      verification_notes     = p_notes,
      -- Recusado volta tudo a NULL: não se mantém "verificado presencialmente"
      -- em quem acabou de ser reprovado — isso o manteria subindo no ranking.
      verification_method    = CASE WHEN p_decision = 'approved' THEN p_method ELSE NULL END,
      verification_method_at = CASE WHEN p_decision = 'approved' AND p_method IS NOT NULL
                                    THEN now() ELSE NULL END,
      verification_method_by = CASE WHEN p_decision = 'approved' AND p_method IS NOT NULL
                                    THEN auth.uid() ELSE NULL END
  WHERE user_id = p_caregiver;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.review_caregiver_verification(uuid, verification_status, text, verification_method) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.review_caregiver_verification(uuid, verification_status, text, verification_method) TO authenticated;
