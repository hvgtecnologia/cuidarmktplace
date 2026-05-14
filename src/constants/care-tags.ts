export const CARE_TAGS = [
  { value: 'alzheimer', label: 'Alzheimer / Demência', premium: true },
  { value: 'mobility_reduced', label: 'Mobilidade reduzida' },
  { value: 'wheelchair', label: 'Cadeirante' },
  { value: 'post_surgery', label: 'Pós-cirúrgico', premium: true },
  { value: 'palliative', label: 'Cuidados paliativos', premium: true },
  { value: 'hygiene', label: 'Higiene e banho' },
  { value: 'medication', label: 'Administração de medicação' },
  { value: 'nocturnal', label: 'Acompanhamento noturno' },
  { value: 'feeding', label: 'Alimentação assistida' },
  { value: 'physiotherapy', label: 'Fisioterapia de manutenção' },
  { value: 'companionship', label: 'Companhia / Lazer' },
  { value: 'hospital', label: 'Acompanhante hospitalar' },
  { value: 'depression', label: 'Saúde mental / Depressão' },
  { value: 'diabetes', label: 'Diabetes / Pressão alta' },
  { value: 'stroke', label: 'Reabilitação pós-AVC', premium: true },
  { value: 'oxygen', label: 'Oxigenoterapia' },
  { value: 'sonda', label: 'Cuidado com sondas' },
  { value: 'curativos', label: 'Curativos' },
] as const

// Tipo profissional do cuidador (regulamentação brasileira)
export const CAREGIVER_LEVELS = [
  {
    value: 'companion',
    label: 'Acompanhante / Companhia',
    desc: 'Companhia, lazer e socialização',
    requires: 'Maior de 18 anos',
  },
  {
    value: 'basic',
    label: 'Cuidador Formação Básica',
    desc: 'Curso de 160h, higiene, medicação oral, mobilidade',
    requires: 'Curso 160h (Cruz Vermelha, Senac)',
  },
  {
    value: 'technical',
    label: 'Técnico de Enfermagem',
    desc: 'COREN ativo, sondas, curativos, glicemia, injetáveis',
    requires: 'Registro COREN',
  },
  {
    value: 'nurse',
    label: 'Enfermeiro(a)',
    desc: 'Enfermagem completa, alta complexidade, paliativos',
    requires: 'Graduação + COREN',
  },
] as const

// Modalidades de serviço com pricing
export const SERVICE_MODALITIES = [
  {
    value: 'hourly',
    label: 'Hora avulsa',
    short: '/hora',
    desc: 'Por hora trabalhada — ideal para tarefas pontuais',
    typicalRange: 'R$ 50 – R$ 80/h',
    icon: 'clock',
  },
  {
    value: 'half_day',
    label: 'Meio período (6h)',
    short: '/turno',
    desc: 'Manhã ou tarde — apoio diário sem dedicação integral',
    typicalRange: 'R$ 90 – R$ 130',
    icon: 'sun',
  },
  {
    value: 'day_shift',
    label: 'Plantão diurno (12h)',
    short: '/plantão',
    desc: '6h às 18h — cuidado diário completo',
    typicalRange: 'R$ 200 – R$ 320',
    icon: 'sun',
  },
  {
    value: 'night_shift',
    label: 'Plantão noturno (12h)',
    short: '/plantão',
    desc: '18h às 6h — adicional noturno aplicado (+30%)',
    typicalRange: 'R$ 280 – R$ 420',
    icon: 'moon',
  },
  {
    value: 'overnight',
    label: 'Pernoite',
    short: '/noite',
    desc: 'Dorme no local, disponibilidade de plantão sem trabalho ativo',
    typicalRange: 'R$ 180 – R$ 250',
    icon: 'moon',
  },
  {
    value: 'full_24h',
    label: '24 horas',
    short: '/dia',
    desc: 'Cuidador presente 24h — alta dependência ou pós-cirúrgico',
    typicalRange: 'R$ 350 – R$ 500',
    icon: 'shield',
  },
  {
    value: 'monthly',
    label: 'Mensalista 12x36',
    short: '/mês',
    desc: 'Cuidador fixo, escala 12x36, vínculo via plataforma com escrow',
    typicalRange: 'R$ 3.500 – R$ 5.500',
    icon: 'calendar',
  },
] as const

// Tipos de serviço de alto nível
export const SERVICE_CATEGORIES = [
  { value: 'home_care', label: 'Cuidado domiciliar' },
  { value: 'hospital', label: 'Acompanhamento hospitalar' },
  { value: 'post_surgery', label: 'Pós-cirúrgico / Pós-alta' },
  { value: 'specialized', label: 'Especializado (Alzheimer, AVC, paliativos)' },
  { value: 'companionship', label: 'Companhia / Day care' },
  { value: 'substitute', label: 'Folguista (substituição)' },
] as const

// Mantido para compatibilidade
export const SCHEDULES = [
  { value: 'morning', label: 'Manhã (6h–12h)' },
  { value: 'afternoon', label: 'Tarde (12h–18h)' },
  { value: 'evening', label: 'Noite (18h–22h)' },
  { value: 'nocturnal', label: 'Pernoite (22h–6h)' },
  { value: 'fulltime', label: 'Período integral' },
] as const

export type CaregiverLevel = typeof CAREGIVER_LEVELS[number]['value']
export type ServiceModality = typeof SERVICE_MODALITIES[number]['value']
export type ServiceCategory = typeof SERVICE_CATEGORIES[number]['value']
