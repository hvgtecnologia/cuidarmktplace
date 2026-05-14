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
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_select_public_caregivers" ON public.profiles;
CREATE POLICY "profiles_select_public_caregivers" ON public.profiles FOR SELECT
  USING (role = 'caregiver' AND is_active = true);

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
CREATE POLICY "matches_insert_family" ON public.matches FOR INSERT
  WITH CHECK (auth.uid() = family_id);
DROP POLICY IF EXISTS "matches_update_involved" ON public.matches;
CREATE POLICY "matches_update_involved" ON public.matches FOR UPDATE
  USING (auth.uid() = family_id OR auth.uid() = caregiver_id);

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
DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
CREATE POLICY "reviews_select_public" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "reviews_insert_reviewer" ON public.reviews;
CREATE POLICY "reviews_insert_reviewer" ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Trigger: keep caregiver rating aggregate in sync
CREATE OR REPLACE FUNCTION public.refresh_caregiver_rating() RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.caregiver_profiles cp
  SET rating_average = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM public.reviews WHERE caregiver_id = cp.user_id), 0),
      rating_count   = COALESCE((SELECT COUNT(*) FROM public.reviews WHERE caregiver_id = cp.user_id), 0)
  WHERE cp.user_id = COALESCE(NEW.caregiver_id, OLD.caregiver_id);
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

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
CREATE INDEX IF NOT EXISTS payments_user_idx ON public.payments(user_id, created_at DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own" ON public.payments FOR SELECT USING (auth.uid() = user_id);

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
  v_role user_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'family');
BEGIN
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

-- ============== STORAGE BUCKETS ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('elderly-photos', 'elderly-photos', false) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false) ON CONFLICT (id) DO NOTHING;
