/**
 * Fachada do mundo. Reexporta, em tempo de execução, as constantes e funções
 * do empreendimento ativo.
 *
 * As frentes do motor (cena, interação, interface, visualizadores) continuam
 * importando daqui exatamente os mesmos nomes de antes — elas não precisam
 * saber que existe mais de um empreendimento. A geometria específica de cada
 * um importa do próprio mundo, nunca desta fachada.
 */
import type { Orientacao, Posicao, TowerId } from './types'
import { ATIVO } from './ativo'

const w = ATIVO.world

export type TowerSpec = {
  id: TowerId
  nome: string
  centro: [number, number, number]
  largura: number
  profundidade: number
}

export const TERRENO = w.TERRENO
export const PODIUM = w.PODIUM
export const FLOOR_H: number = w.FLOOR_H
export const VARANDA: number = w.VARANDA
export const ANDARES: number = w.ANDARES
export const PAVIMENTOS: number[] = w.PAVIMENTOS
export const PRIMEIRO_ANDAR: number = w.PRIMEIRO_ANDAR
export const ANDAR_COBERTURA: number = w.ANDAR_COBERTURA
export const POSICOES: number[] = w.POSICOES
export const TORRES: TowerSpec[] = w.TORRES as TowerSpec[]
export const OFFSET_POSICAO: Record<Posicao, [number, number]> = w.OFFSET_POSICAO
export const ORIENTACAO_POSICAO: Record<Posicao, Orientacao> = w.ORIENTACAO_POSICAO
export const NORMAL_POSICAO: Record<Posicao, [number, number]> = w.NORMAL_POSICAO
export const ALTURA_TORRE: number = w.ALTURA_TORRE
export const ALTURA_COROAMENTO: number = w.ALTURA_COROAMENTO
export const VISTA_RECUO: number = w.VISTA_RECUO
export const VISTA_QUEDA: number = w.VISTA_QUEDA
export const SITE = w.SITE

export const torreById = (id: TowerId): TowerSpec => w.torreById(id) as TowerSpec
export const baseDoPavimento = (andar: number): number => w.baseDoPavimento(andar)

export const centroDaUnidade = (
  torre: TowerId,
  andar: number,
  posicao: Posicao,
): [number, number, number] => w.centroDaUnidade(torre, andar, posicao)

export const varandaDaUnidade = (
  torre: TowerId,
  andar: number,
  posicao: Posicao,
): { pos: [number, number, number]; alvo: [number, number, number] } =>
  w.varandaDaUnidade(torre, andar, posicao)

export const ancoraDeRotulo = (
  torre: TowerId,
  andar: number,
  posicao: Posicao,
): [number, number, number] => w.ancoraDeRotulo(torre, andar, posicao)
