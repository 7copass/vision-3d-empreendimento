/**
 * Sistema de coordenadas do mundo. Metros, Y para cima.
 * Norte = -Z, Sul = +Z, Leste = +X, Oeste = -X.
 * Nenhuma frente altera este arquivo.
 */
import type { Orientacao, Posicao, TowerId } from '../../core/types'

export const TERRENO = { largura: 200, profundidade: 150 } as const

export const PODIUM = {
  largura: 150,
  profundidade: 80,
  altura: 10.5,
  centro: [0, 0, 0] as [number, number, number],
} as const

export const FLOOR_H = 3.15
/**
 * Profundidade da varanda, do guarda-corpo até o vidro. É contrato: a
 * arquitetura constrói a laje com ela e a câmera do modo "vista" pousa
 * dentro dela.
 */
export const VARANDA = 2.3
export const ANDARES = 20
/** Pavimentos existentes, na ordem. Contrato do seletor de empreendimento. */
export const PAVIMENTOS: number[] = Array.from({ length: 20 }, (_, i) => i + 1)
export const PRIMEIRO_ANDAR = 1
/** Posições por pavimento. Quatro quadrantes. */
export const POSICOES: number[] = [1, 2, 3, 4]
/** Pavimento 20 é cobertura duplex: 2 unidades em vez de 4. */
export const ANDAR_COBERTURA = 20

export interface TowerSpec {
  id: TowerId
  nome: string
  centro: [number, number, number]
  largura: number
  profundidade: number
}

export const TORRES: TowerSpec[] = [
  { id: 'A', nome: 'Torre Tapajós', centro: [-34, 0, -6], largura: 30, profundidade: 22 },
  { id: 'B', nome: 'Torre Arapiuns', centro: [34, 0, -6], largura: 30, profundidade: 22 },
]

export const torreById = (id: TowerId): TowerSpec => TORRES.find((t) => t.id === id) ?? TORRES[0]

/** Altura da base do pavimento n (1-indexado). */
export const baseDoPavimento = (andar: number): number => PODIUM.altura + (andar - 1) * FLOOR_H

export const ALTURA_TORRE = PODIUM.altura + ANDARES * FLOOR_H
export const ALTURA_COROAMENTO = ALTURA_TORRE + 4.5

/** Quadrante da unidade dentro da planta da torre, em offsets locais. */
export const OFFSET_POSICAO: Record<Posicao, [number, number]> = {
  1: [-1, -1],
  2: [1, -1],
  3: [1, 1],
  4: [-1, 1],
}

export const ORIENTACAO_POSICAO: Record<Posicao, Orientacao> = {
  1: 'oeste',
  2: 'norte',
  3: 'leste',
  4: 'sul',
}

/**
 * Normal da fachada de cada posição, no plano XZ. Bate com
 * ORIENTACAO_POSICAO: para onde a unidade olha é para onde a câmera aponta.
 */
export const NORMAL_POSICAO: Record<Posicao, [number, number]> = {
  1: [-1, 0],
  2: [0, -1],
  3: [1, 0],
  4: [0, 1],
}

/** Recuo do guarda-corpo para dentro, para a câmera cair no vão da varanda. */
export const VISTA_RECUO = 1
/** Queda do alvo em 80 m — cerca de 2°. Mais que isso bate no parapeito. */
export const VISTA_QUEDA = 2.8

/** Centro da unidade no mundo. */
export function centroDaUnidade(
  torre: TowerId,
  andar: number,
  posicao: Posicao,
): [number, number, number] {
  const t = torreById(torre)
  const [ox, oz] = OFFSET_POSICAO[posicao]
  return [
    t.centro[0] + (ox * t.largura) / 4,
    baseDoPavimento(andar) + FLOOR_H / 2,
    t.centro[2] + (oz * t.profundidade) / 4,
  ]
}

/**
 * Ponto NA varanda, de onde a câmera olha para fora.
 *
 * Duas coisas aqui foram aprendidas com a geometria construída, medindo:
 *
 * 1. A câmera fica no MEIO da fachada do quadrante, não na quina. A quina
 *    tem pilar de canto de 90 cm; mirar na diagonal de 45° punha concreto
 *    opaco a 57 cm da lente, nas 156 unidades.
 * 2. O alvo cai só ~2° em 80 m. A queda de 5,7° que havia antes encontrava
 *    o parapeito da própria varanda.
 *
 * O recuo de VISTA_RECUO a partir do guarda-corpo deixa o ponto dentro do
 * vão da varanda, entre o parapeito e o vidro.
 */
export function varandaDaUnidade(
  torre: TowerId,
  andar: number,
  posicao: Posicao,
): { pos: [number, number, number]; alvo: [number, number, number] } {
  const t = torreById(torre)
  const [ox, oz] = OFFSET_POSICAO[posicao]
  const [nx, nz] = NORMAL_POSICAO[posicao]
  const y = baseDoPavimento(andar) + 1.6

  const x =
    nx !== 0 ? t.centro[0] + nx * (t.largura / 2 - VISTA_RECUO) : t.centro[0] + (ox * t.largura) / 4
  const z =
    nz !== 0
      ? t.centro[2] + nz * (t.profundidade / 2 - VISTA_RECUO)
      : t.centro[2] + (oz * t.profundidade) / 4

  return {
    pos: [x, y, z],
    // Nos dois primeiros pavimentos a lente está logo acima do deck, e uma
    // queda de 2° em 80 m cruza a cota da laje a 45,8 m — ou seja, o cliente
    // miraria no chão de casa. O piso trava o alvo acima do próprio lazer.
    alvo: [x + nx * 80, Math.max(y - VISTA_QUEDA, PODIUM.altura + 1.6), z + nz * 80],
  }
}

/**
 * Ponto FORA da fachada, para etiquetas flutuantes. Separado da varanda de
 * propósito: um rótulo ancorado dentro do volume construído some atrás da
 * própria parede quando o teste de oclusão roda.
 */
export function ancoraDeRotulo(
  torre: TowerId,
  andar: number,
  posicao: Posicao,
): [number, number, number] {
  const t = torreById(torre)
  const [ox, oz] = OFFSET_POSICAO[posicao]
  return [
    t.centro[0] + (ox * t.largura) / 2 + ox * 1.6,
    baseDoPavimento(andar) + FLOOR_H / 2,
    t.centro[2] + (oz * t.profundidade) / 2 + oz * 1.6,
  ]
}

/** Coordenadas do empreendimento, para o sol. */
export const SITE = { lat: -2.4431, lng: -54.7083, fusoHoras: -3 } as const

/** Estado de luz em que o tour abre. Village One tem as duas faces iluminadas. */
export const ABERTURA = { hora: 12, mes: 6, preset: 'meiodia' } as const
