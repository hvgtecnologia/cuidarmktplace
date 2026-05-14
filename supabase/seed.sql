-- =============================================================================
-- CUIDE+ — SEED DEMO PARA INVESTIDOR
-- Cria 3 contas demo + cuidadores fictícios para apresentação.
-- Idempotente: pode rodar quantas vezes quiser.
--
-- ⚠️  PRÉ-REQUISITO: rode setup.sql ANTES deste arquivo.
--
-- Como usar:
--   1. Abra o SQL Editor do Supabase
--   2. Cole TODO este arquivo e clique Run
--   3. Faça login com qualquer das contas abaixo
--
-- ============================================================
-- CREDENCIAIS DAS CONTAS DEMO (senha: Demo@2026)
-- ============================================================
--   Família       → familia@cuidemais.com.br     · Demo@2026
--   Cuidador      → cuidador@cuidemais.com.br    · Demo@2026
--   Administrador → admin@cuidemais.com.br       · Demo@2026
-- =============================================================================

-- --------- 1. CRIAR USUÁRIOS NO AUTH (3 contas) ---------------------------
DO $$
DECLARE
  v_password text := 'Demo@2026';
  v_family_id   uuid := '11111111-1111-4111-8111-111111111111';
  v_caregiver_id uuid := '22222222-2222-4222-8222-222222222222';
  v_admin_id    uuid := '33333333-3333-4333-8333-333333333333';

  -- IDs adicionais para popular o marketplace
  v_cg2 uuid := '44444444-4444-4444-8444-444444444444';
  v_cg3 uuid := '55555555-5555-4555-8555-555555555555';
  v_cg4 uuid := '66666666-6666-4666-8666-666666666666';
  v_cg5 uuid := '77777777-7777-4777-8777-777777777777';
  v_cg6 uuid := '88888888-8888-4888-8888-888888888888';
  v_cg7 uuid := '99999999-9999-4999-8999-999999999999';
BEGIN
  -- helper inline para inserir auth user
  -- Família
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_family_id, 'authenticated', 'authenticated',
    'familia@cuidemais.com.br',
    crypt(v_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Mariana Lopes","role":"family"}'::jsonb,
    now(), now(), '', '', '', ''
  ) ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, email = EXCLUDED.email;

  -- Cuidador principal
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_caregiver_id, 'authenticated', 'authenticated',
    'cuidador@cuidemais.com.br',
    crypt(v_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Vanessa Rodrigues","role":"caregiver"}'::jsonb,
    now(), now(), '', '', '', ''
  ) ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, email = EXCLUDED.email;

  -- Administrador
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
    'admin@cuidemais.com.br',
    crypt(v_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Hamilton Vinicius","role":"admin"}'::jsonb,
    now(), now(), '', '', '', ''
  ) ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, email = EXCLUDED.email;

  -- Cuidadores adicionais para popular o marketplace
  INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES
    ('00000000-0000-0000-0000-000000000000', v_cg2, 'authenticated', 'authenticated', 'rosana.almeida@cuidemais.com.br', crypt(v_password,gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{"full_name":"Rosana Almeida","role":"caregiver"}'::jsonb, now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_cg3, 'authenticated', 'authenticated', 'patricia.santos@cuidemais.com.br', crypt(v_password,gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{"full_name":"Patrícia Santos","role":"caregiver"}'::jsonb, now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_cg4, 'authenticated', 'authenticated', 'carlos.mendes@cuidemais.com.br', crypt(v_password,gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{"full_name":"Carlos Mendes","role":"caregiver"}'::jsonb, now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_cg5, 'authenticated', 'authenticated', 'fernanda.oliveira@cuidemais.com.br', crypt(v_password,gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{"full_name":"Fernanda Oliveira","role":"caregiver"}'::jsonb, now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_cg6, 'authenticated', 'authenticated', 'lucia.ferreira@cuidemais.com.br', crypt(v_password,gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{"full_name":"Lúcia Ferreira","role":"caregiver"}'::jsonb, now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_cg7, 'authenticated', 'authenticated', 'paulo.silva@cuidemais.com.br', crypt(v_password,gen_salt('bf')), now(), '{"provider":"email"}'::jsonb, '{"full_name":"Paulo Silva","role":"caregiver"}'::jsonb, now(), now(), '', '', '', '')
  ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, email = EXCLUDED.email;

  -- ---------- 2. PROFILES (atualizar/inserir) -----------------------------
  INSERT INTO public.profiles (id, role, full_name, phone, avatar_url, is_active, onboarded) VALUES
    (v_family_id,    'family',    'Mariana Lopes',     '(11) 98800-0001', 'https://i.pravatar.cc/300?img=49', true, true),
    (v_caregiver_id, 'caregiver', 'Vanessa Rodrigues', '(11) 98800-0002', 'https://i.pravatar.cc/300?img=44', true, true),
    (v_admin_id,     'admin',     'Hamilton Vinicius', '(11) 98800-0003', 'https://i.pravatar.cc/300?img=12', true, true),
    (v_cg2, 'caregiver', 'Rosana Almeida',     '(21) 98800-0010', 'https://i.pravatar.cc/300?img=47', true, true),
    (v_cg3, 'caregiver', 'Patrícia Santos',    '(11) 98800-0011', 'https://i.pravatar.cc/300?img=48', true, true),
    (v_cg4, 'caregiver', 'Carlos Mendes',      '(31) 98800-0012', 'https://i.pravatar.cc/300?img=33', true, true),
    (v_cg5, 'caregiver', 'Fernanda Oliveira',  '(11) 98800-0013', 'https://i.pravatar.cc/300?img=45', true, true),
    (v_cg6, 'caregiver', 'Lúcia Ferreira',     '(11) 98800-0014', 'https://i.pravatar.cc/300?img=23', true, true),
    (v_cg7, 'caregiver', 'Paulo Silva',        '(21) 98800-0015', 'https://i.pravatar.cc/300?img=68', true, true)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    is_active = EXCLUDED.is_active,
    onboarded = EXCLUDED.onboarded;

  -- ---------- 3. CAREGIVER PROFILES (com pricing realista) ----------------
  INSERT INTO public.caregiver_profiles (
    user_id, bio, level, years_experience, specialties, certifications, coren_number,
    hourly_rate, half_day_rate, day_shift_rate, night_shift_rate, overnight_rate, full_24h_rate, monthly_rate,
    offered_modalities, available_days, available_shifts,
    service_radius_km, city, neighborhood, state,
    rating_average, rating_count, jobs_completed,
    verification_status, verified_at, is_pro, is_featured
  ) VALUES
    -- Vanessa - cuidadora destaque, especialista Alzheimer
    (v_caregiver_id,
     'Cuidadora há 8 anos, especializada em Alzheimer e demências. Formada pela Cruz Vermelha (160h) com certificação em cuidados paliativos. Empatia e paciência são meus diferenciais.',
     'basic', 8,
     ARRAY['alzheimer','medication','hygiene','companionship','depression','feeding'],
     ARRAY['Curso Cuidador 160h - Cruz Vermelha','Cuidados Paliativos - Senac','Primeiros Socorros'],
     NULL,
     65, 110, 240, 320, 200, 420, 4500,
     ARRAY['hourly','half_day','day_shift','night_shift','overnight','monthly'],
     ARRAY['mon','tue','wed','thu','fri','sat'],
     ARRAY['morning','afternoon','evening','nocturnal'],
     15, 'São Paulo', 'Vila Mariana', 'SP',
     4.9, 47, 132, 'approved', now() - interval '6 months', true, true),

    -- Rosana - técnica enfermagem, paliativos
    (v_cg2,
     'Técnica de Enfermagem com COREN-RJ ativo há 12 anos. Experiência sólida em cuidados paliativos, oncologia e pós-operatório. Atendo com carinho e técnica.',
     'technical', 12,
     ARRAY['palliative','post_surgery','medication','sonda','curativos','oxygen'],
     ARRAY['Téc. Enfermagem - COREN-RJ','Cuidados Paliativos','Oncologia Domiciliar'],
     'COREN-RJ 458921',
     90, 150, 320, 420, 250, 520, 6800,
     ARRAY['hourly','day_shift','night_shift','full_24h','monthly'],
     ARRAY['mon','tue','wed','thu','fri','sat','sun'],
     ARRAY['morning','afternoon','evening','nocturnal'],
     20, 'Rio de Janeiro', 'Tijuca', 'RJ',
     5.0, 89, 215, 'approved', now() - interval '1 year', true, true),

    -- Patrícia - cuidadora básica diurna
    (v_cg3,
     'Cuidadora dedicada, foco em qualidade de vida do idoso autônomo ou com dependência leve. Companhia, alimentação e atividades cognitivas.',
     'basic', 5,
     ARRAY['companionship','feeding','medication','depression','physiotherapy'],
     ARRAY['Curso Cuidador 160h - Senac','Atividades Cognitivas para Idosos'],
     NULL,
     55, 95, 220, 300, 180, NULL, 3800,
     ARRAY['hourly','half_day','day_shift','night_shift','overnight'],
     ARRAY['mon','tue','wed','thu','fri'],
     ARRAY['morning','afternoon'],
     12, 'São Paulo', 'Pinheiros', 'SP',
     4.8, 32, 68, 'approved', now() - interval '4 months', true, false),

    -- Carlos - enfermeiro, alta complexidade
    (v_cg4,
     'Enfermeiro com 15 anos de experiência. Atuo em casos de alta complexidade: pós-AVC, ventilação mecânica, traqueostomia. Treinamento contínuo.',
     'nurse', 15,
     ARRAY['stroke','post_surgery','palliative','sonda','curativos','oxygen','medication'],
     ARRAY['Enfermagem - UFMG','COREN-MG','UTI Adulto','Suporte Avançado de Vida'],
     'COREN-MG 234567',
     150, 220, 480, 600, 380, 850, 11500,
     ARRAY['hourly','day_shift','night_shift','full_24h','monthly'],
     ARRAY['mon','tue','wed','thu','fri','sat','sun'],
     ARRAY['morning','afternoon','evening','nocturnal'],
     25, 'Belo Horizonte', 'Funcionários', 'MG',
     5.0, 64, 178, 'approved', now() - interval '8 months', true, true),

    -- Fernanda - acompanhante hospitalar
    (v_cg5,
     'Especializada em acompanhamento hospitalar. 6 anos atuando em Albert Einstein, Sírio-Libanês e Oswaldo Cruz. Disponibilidade 24/7.',
     'basic', 6,
     ARRAY['hospital','companionship','medication','feeding','mobility_reduced'],
     ARRAY['Curso Cuidador 160h','Acompanhante Hospitalar - Senac'],
     NULL,
     70, 120, 250, 350, 220, 480, NULL,
     ARRAY['hourly','half_day','day_shift','night_shift','overnight','full_24h'],
     ARRAY['mon','tue','wed','thu','fri','sat','sun'],
     ARRAY['morning','afternoon','evening','nocturnal'],
     30, 'São Paulo', 'Itaim Bibi', 'SP',
     4.9, 28, 95, 'approved', now() - interval '3 months', false, false),

    -- Lúcia - companhia leve
    (v_cg6,
     'Acompanhante e companhia para idosos autônomos. Conversação, leitura, passeios, atividades culturais. Carinho e respeito.',
     'companion', 3,
     ARRAY['companionship','depression','feeding'],
     ARRAY['Gerontologia Social - Senac'],
     NULL,
     45, 80, 180, NULL, NULL, NULL, 2800,
     ARRAY['hourly','half_day','day_shift','monthly'],
     ARRAY['mon','tue','wed','thu','fri'],
     ARRAY['morning','afternoon'],
     10, 'São Paulo', 'Moema', 'SP',
     4.7, 19, 43, 'approved', now() - interval '2 months', false, false),

    -- Paulo - cuidador noturno
    (v_cg7,
     'Cuidador noturno experiente. Especializado em pernoite e plantão noturno. Discreto, atento e treinado em primeiros socorros.',
     'basic', 4,
     ARRAY['nocturnal','medication','mobility_reduced','companionship'],
     ARRAY['Curso Cuidador 160h - Cruz Vermelha','Primeiros Socorros'],
     NULL,
     60, NULL, NULL, 340, 220, 450, NULL,
     ARRAY['night_shift','overnight','full_24h'],
     ARRAY['mon','tue','wed','thu','fri','sat','sun'],
     ARRAY['evening','nocturnal'],
     18, 'Rio de Janeiro', 'Copacabana', 'RJ',
     4.8, 22, 71, 'approved', now() - interval '5 months', false, false)
  ON CONFLICT (user_id) DO UPDATE SET
    bio = EXCLUDED.bio,
    level = EXCLUDED.level,
    years_experience = EXCLUDED.years_experience,
    specialties = EXCLUDED.specialties,
    certifications = EXCLUDED.certifications,
    coren_number = EXCLUDED.coren_number,
    hourly_rate = EXCLUDED.hourly_rate,
    half_day_rate = EXCLUDED.half_day_rate,
    day_shift_rate = EXCLUDED.day_shift_rate,
    night_shift_rate = EXCLUDED.night_shift_rate,
    overnight_rate = EXCLUDED.overnight_rate,
    full_24h_rate = EXCLUDED.full_24h_rate,
    monthly_rate = EXCLUDED.monthly_rate,
    offered_modalities = EXCLUDED.offered_modalities,
    available_days = EXCLUDED.available_days,
    available_shifts = EXCLUDED.available_shifts,
    city = EXCLUDED.city,
    neighborhood = EXCLUDED.neighborhood,
    state = EXCLUDED.state,
    rating_average = EXCLUDED.rating_average,
    rating_count = EXCLUDED.rating_count,
    jobs_completed = EXCLUDED.jobs_completed,
    verification_status = EXCLUDED.verification_status,
    verified_at = EXCLUDED.verified_at,
    is_pro = EXCLUDED.is_pro,
    is_featured = EXCLUDED.is_featured;

  -- ---------- 4. SUBSCRIPTIONS dos cuidadores Pro -------------------------
  INSERT INTO public.subscriptions (user_id, plan, status, current_period_end) VALUES
    (v_caregiver_id, 'pro', 'active', now() + interval '30 days'),
    (v_cg2,          'pro', 'active', now() + interval '30 days'),
    (v_cg3,          'pro', 'active', now() + interval '30 days'),
    (v_cg4,          'pro', 'active', now() + interval '30 days'),
    (v_cg5,          'free','inactive', NULL),
    (v_cg6,          'free','inactive', NULL),
    (v_cg7,          'free','inactive', NULL)
  ON CONFLICT (user_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status, current_period_end = EXCLUDED.current_period_end;

  -- ---------- 5. ELDERLY do nosso usuário FAMÍLIA -------------------------
  INSERT INTO public.elderly_profiles (id, family_id, name, age, sex, photo_url, city, neighborhood, state, care_needs, preferred_schedule, observations, has_stairs, has_adapted_bathroom, has_caregiver_room, has_pets, residence_notes)
  VALUES (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', v_family_id,
    'Sr. Otávio Lopes', 78, 'M', 'https://i.pravatar.cc/300?img=70',
    'São Paulo', 'Vila Mariana', 'SP',
    ARRAY['alzheimer','medication','companionship','hygiene'],
    ARRAY['morning','afternoon'],
    'Diagnóstico de Alzheimer leve há 2 anos. Mobilidade preservada, mas precisa de companhia e supervisão de medicação. Gosta muito de música clássica.',
    true, true, true, false,
    'Casa térrea com 2 degraus na entrada. Banheiro com barras de apoio. Quarto disponível para cuidador.'
  )
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, age = EXCLUDED.age;

  -- ---------- 6. MATCHES E REVIEWS para histórico do cuidador -------------
  INSERT INTO public.matches (id, family_id, caregiver_id, elderly_id, status, message, created_at, responded_at)
  VALUES
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', v_family_id, v_caregiver_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
     'accepted', 'Olá Vanessa, vi seu perfil e gostaria de conversar sobre cuidar do meu pai.',
     now() - interval '15 days', now() - interval '14 days')
  ON CONFLICT (family_id, caregiver_id, elderly_id) DO NOTHING;

  -- Reviews (vão atualizar rating automaticamente via trigger)
  INSERT INTO public.reviews (id, match_id, reviewer_id, caregiver_id, rating, comment, created_at) VALUES
    ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', v_family_id, v_caregiver_id,
     5, 'Vanessa é maravilhosa! Meu pai adora ela. Pontual, dedicada e muito carinhosa.', now() - interval '3 days')
  ON CONFLICT (match_id) DO NOTHING;

  -- ---------- 7. BOOKINGS de exemplo --------------------------------------
  INSERT INTO public.bookings (id, match_id, family_id, caregiver_id, elderly_id, modality, start_at, end_at, hours, rate, subtotal_cents, platform_fee_cents, total_cents, status, notes)
  VALUES
    ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
     v_family_id, v_caregiver_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
     'day_shift', now() + interval '1 day', now() + interval '1 day' + interval '12 hours', 12, 240,
     288000, 43200, 331200, 'confirmed',
     'Plantão diurno regular. Lembrar medicação 8h, 12h e 16h.')
  ON CONFLICT (id) DO NOTHING;

  -- ---------- 8. NOTIFICAÇÕES de exemplo -----------------------------------
  INSERT INTO public.notifications (user_id, type, title, body) VALUES
    (v_family_id,    'match_accepted',  'Vanessa aceitou seu convite!',          'Agora você pode conversar pelo chat e agendar a primeira visita.'),
    (v_caregiver_id, 'new_invite',      'Nova família interessada',              'A família Lopes te enviou um convite. Responda em até 24h.'),
    (v_caregiver_id, 'review_received', 'Você ganhou uma avaliação 5★',          'Mariana Lopes deixou um depoimento sobre o seu trabalho.'),
    (v_admin_id,     'verification',    '3 cuidadores aguardando verificação',   'Acesse o painel admin para aprovar.')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Demo seed completo. Logins:';
  RAISE NOTICE '   👨‍👩‍👧 Família       → familia@cuidemais.com.br  · Demo@2026';
  RAISE NOTICE '   🩺 Cuidador      → cuidador@cuidemais.com.br · Demo@2026';
  RAISE NOTICE '   🛡️  Admin         → admin@cuidemais.com.br    · Demo@2026';
  RAISE NOTICE '   + 6 cuidadores extras populando o marketplace.';
END $$;
