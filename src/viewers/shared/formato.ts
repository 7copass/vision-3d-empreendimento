/** Formatação pt-BR usada pelos visualizadores 2D. */

const nf = (min: number, max: number) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: min, maximumFractionDigits: max })

const n0 = nf(0, 0)
const n1 = nf(0, 1)
const n2 = nf(0, 2)

/** 111 → "111 m²" · 14,06 → "14,1 m²" */
export const fmtArea = (m2: number): string => `${n1.format(m2)} m²`

/** Apenas o número da área, sem unidade (para rótulos de planta). */
export const fmtAreaNum = (m2: number): string => n1.format(m2)

/** 2.4 → "2,4 km" · 32 → "32 km" */
export const fmtKm = (km: number): string => `${km >= 10 ? n0.format(km) : n1.format(km)} km`

/** 7 → "7 min" */
export const fmtMin = (min: number): string => `${n0.format(min)} min`

/** 820000 → "R$ 820.000" */
export const fmtPreco = (v: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v)

/** 1500 → "1,50 m" (cotas de planta, em centímetros na entrada) */
export const fmtCota = (cm: number): string => n2.format(cm / 100)

/** 6, 15 → "6 / 15" */
export const fmtContador = (i: number, total: number): string =>
  `${n0.format(i)} / ${n0.format(total)}`

/** 240 → "4:00" */
export const fmtTempo = (segundos: number): string => {
  const s = Math.max(0, Math.round(segundos))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}
