/** Formatação pt-BR usada por todo o chrome. Nada aqui toca o store. */

const NUM = new Intl.NumberFormat('pt-BR')
const NUM1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const NUM2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

/** R$ 1.234.000 */
export const moeda = (v: number): string => MOEDA.format(v)

/** R$ 820 mil · R$ 1,98 mi — para réguas e rótulos curtos. */
export function moedaCurta(v: number): string {
  if (v >= 1_000_000) return `R$ ${NUM2.format(v / 1_000_000)} mi`
  return `R$ ${NUM.format(Math.round(v / 1000))} mil`
}

/** 111 m² */
export const area = (v: number): string => `${NUM.format(v)} m²`

/** 148 m */
export const metros = (v: number): string => `${NUM.format(v)} m`

/** 3,6 km */
export const km = (v: number): string => `${NUM1.format(v)} km`

/** 12 min */
export const minutos = (v: number): string => `${NUM.format(v)} min`

/** 17h36 — hora decimal do store virando relógio. */
export function horaLegivel(h: number): string {
  const total = Math.round(Math.max(0, Math.min(24, h)) * 60)
  const hh = Math.floor(total / 60)
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}h${String(mm).padStart(2, '0')}`
}

export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

export const MESES_CURTOS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const

export const mesLegivel = (m: number): string => MESES[Math.max(1, Math.min(12, m)) - 1]
