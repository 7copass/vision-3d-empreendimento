/**
 * Mundo do Flat Premium II. Metros, Y para cima.
 * Norte = -Z, Sul = +Z, Leste = +X, Oeste = -X.
 *
 * Não há projeto executivo: o vendedor informou em áudio que a construtora
 * ainda não liberou o arquitetônico. A geometria abaixo é interpretada dos
 * renders comerciais de fachada, como foi feito no Village One.
 */
import type { Orientacao, TowerId } from '../../core/types'

export const TERRENO = { largura: 120, profundidade: 110 } as const

/** Térreo com garagem e lobby, sob os seis pavimentos residenciais. */
export const PODIUM = {
  largura: 34,
  profundidade: 20,
  altura: 3.9,
  centro: [0, 0, 0] as [number, number, number],
} as const

export const FLOOR_H = 2.95
export const VARANDA = 1.6

/** Pavimentos residenciais: a numeração comercial começa no 2º. */
export const PAVIMENTOS: number[] = [2, 3, 4, 5, 6, 7]
export const ANDARES = PAVIMENTOS.length
export const PRIMEIRO_ANDAR = PAVIMENTOS[0]
/** Não há cobertura diferenciada; 0 nunca casa com um pavimento real. */
export const ANDAR_COBERTURA = 0

/** Onze flats por pavimento, numerados 01 a 11. */
export const POSICOES: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

/** Ímpares dão para o rio (norte), pares para a rua (sul) — convenção do quadro comercial. */
export const ORIENTACAO_POSICAO: Record<number, Orientacao> = Object.fromEntries(
  POSICOES.map((p) => [p, p % 2 === 1 ? 'norte' : 'sul']),
) as Record<number, Orientacao>

export const NORMAL_POSICAO: Record<number, [number, number]> = Object.fromEntries(
  POSICOES.map((p) => [p, p % 2 === 1 ? [0, -1] : [0, 1]]),
) as Record<number, [number, number]>

export interface TowerSpec {
  id: TowerId
  nome: string
  centro: [number, number, number]
  largura: number
  profundidade: number
}

export const TORRES: TowerSpec[] = [
  { id: 'A', nome: 'Flat Premium II', centro: [0, 0, 0], largura: 34, profundidade: 20 },
]

export const torreById = (): TowerSpec => TORRES[0]

/** Altura da base do pavimento n, contando a partir do térreo. */
export const baseDoPavimento = (andar: number): number =>
  PODIUM.altura + (andar - PRIMEIRO_ANDAR) * FLOOR_H

export const ALTURA_TORRE = baseDoPavimento(PAVIMENTOS[ANDARES - 1]) + FLOOR_H
export const ALTURA_COROAMENTO = ALTURA_TORRE + 3.2

/** Flats da face norte (ímpares) e da face sul (pares), em fileira. */
const IMPARES = POSICOES.filter((p) => p % 2 === 1)
const PARES = POSICOES.filter((p) => p % 2 === 0)

function faixaNaFachada(posicao: number): number {
  const fila = posicao % 2 === 1 ? IMPARES : PARES
  const i = fila.indexOf(posicao)
  const passo = TORRES[0].largura / fila.length
  return -TORRES[0].largura / 2 + passo * (i + 0.5)
}

export const OFFSET_POSICAO: Record<number, [number, number]> = Object.fromEntries(
  POSICOES.map((p) => [p, [faixaNaFachada(p) / (TORRES[0].largura / 4), p % 2 === 1 ? -1 : 1]]),
) as Record<number, [number, number]>

export function centroDaUnidade(
  _torre: TowerId,
  andar: number,
  posicao: number,
): [number, number, number] {
  const t = TORRES[0]
  const [, nz] = NORMAL_POSICAO[posicao]
  return [
    t.centro[0] + faixaNaFachada(posicao),
    baseDoPavimento(andar) + FLOOR_H / 2,
    t.centro[2] + (nz * t.profundidade) / 4,
  ]
}

/**
 * Ponto NA varanda. Mesma regra do Village One: a câmera recua para dentro da
 * linha do guarda-corpo e olha na normal cardeal, com queda de 2°, travada
 * acima da laje do térreo para os pavimentos baixos não mirarem na calçada.
 */
export const VISTA_RECUO = 0.7
export const VISTA_QUEDA = 2.8

export function varandaDaUnidade(
  _torre: TowerId,
  andar: number,
  posicao: number,
): { pos: [number, number, number]; alvo: [number, number, number] } {
  const t = TORRES[0]
  const [, nz] = NORMAL_POSICAO[posicao]
  const y = baseDoPavimento(andar) + 1.6
  const x = t.centro[0] + faixaNaFachada(posicao)
  const fz = t.centro[2] + (nz * t.profundidade) / 2
  const z = fz - nz * VISTA_RECUO
  return {
    pos: [x, y, z],
    alvo: [x, Math.max(y - VISTA_QUEDA, PODIUM.altura + 1.6), z + nz * 80],
  }
}

export function ancoraDeRotulo(
  _torre: TowerId,
  andar: number,
  posicao: number,
): [number, number, number] {
  const t = TORRES[0]
  const [, nz] = NORMAL_POSICAO[posicao]
  return [
    t.centro[0] + faixaNaFachada(posicao),
    baseDoPavimento(andar) + FLOOR_H / 2,
    t.centro[2] + (nz * t.profundidade) / 2 + nz * 1.2,
  ]
}

/** Rua Magnólia com Alameda Trinta e Três, Santarém/PA. */
export const SITE = { lat: -2.4431, lng: -54.7083, fusoHoras: -3 } as const
