import { CARE_TAGS, SCHEDULES } from '@/constants/care-tags'

/**
 * Como um pedido anônimo é apresentado ao cuidador.
 *
 * O cuidador não sabe QUEM é a família — só região, tipo de serviço e sexo do
 * idoso. Estas funções são a única fonte desses rótulos, para que nenhuma tela
 * invente um nome ou deixe escapar um dado identificável.
 */

// Map<string, string> explícito: CARE_TAGS/SCHEDULES são `as const`, e sem a
// anotação o Map herdaria a união literal das chaves — mas os valores chegam
// do banco como string solta.
const CARE_LABEL: Map<string, string> = new Map(CARE_TAGS.map((t) => [t.value, t.label]))
const SCHEDULE_LABEL: Map<string, string> = new Map(SCHEDULES.map((s) => [s.value, s.label]))

export function careNeedLabel(value: string): string {
  return CARE_LABEL.get(value) ?? value
}

export function scheduleLabel(value: string): string {
  return SCHEDULE_LABEL.get(value) ?? value
}

/** 'M' | 'F' | 'outro' → como aparece para o cuidador. */
export function sexLabel(sex: string | null | undefined): string | null {
  if (sex === 'M') return 'Homem'
  if (sex === 'F') return 'Mulher'
  if (sex === 'outro') return 'Outro'
  return null
}

/** "Pinheiros, São Paulo" — sem rua, sem número, sem CEP. */
export function regionLabel(
  neighborhood: string | null | undefined,
  city: string | null | undefined
): string | null {
  const parts = [neighborhood, city].filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

/**
 * O título que substitui o nome da família na lista e no cabeçalho do chat.
 * Sempre derivado da região — nunca de pessoa nenhuma.
 */
export function requestTitle(
  neighborhood: string | null | undefined,
  city: string | null | undefined
): string {
  const region = regionLabel(neighborhood, city)
  return region ? `Atendimento em ${region}` : 'Atendimento'
}

/** Linha secundária: sexo + primeiras necessidades, sem identificar ninguém. */
export function requestSummary(
  sex: string | null | undefined,
  careNeeds: string[] | null | undefined,
  max = 2
): string | null {
  const parts: string[] = []

  const sexo = sexLabel(sex)
  if (sexo) parts.push(sexo)

  const needs = (careNeeds ?? []).slice(0, max).map(careNeedLabel)
  if (needs.length) parts.push(needs.join(', '))

  const extra = (careNeeds?.length ?? 0) - max
  if (extra > 0) parts.push(`+${extra}`)

  return parts.length ? parts.join(' · ') : null
}
