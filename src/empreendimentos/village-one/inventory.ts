/**
 * Estoque gerado. Ficção verossímil desta fase de demonstração:
 * 2 torres × 19 pavimentos tipo × 4 unidades + 2 coberturas por torre = 160 unidades.
 * Na fase de venda real, este arquivo é substituído pelos números oficiais.
 */
import type { Orientacao, Posicao, TowerId, UnitStatus, Unidade } from '../../core/types'
import { AMENIDADES } from './project'
import {
  ANDARES,
  ANDAR_COBERTURA,
  ORIENTACAO_POSICAO,
  TORRES,
  centroDaUnidade,
} from './world'
import { tipologiaById } from './project'

/** Gerador determinístico — o estoque não muda a cada reload. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

const VISTAS: Record<Orientacao, string> = {
  norte: 'Orla e Rio Tapajós',
  leste: 'Nascente sobre a cidade',
  sul: 'Mata e Av. Fernando Guilhon',
  oeste: 'Poente sobre o Tapajós',
}

function statusDe(r: number, andar: number): UnitStatus {
  // Andares altos vendem primeiro: a procura cresce com a altura.
  const pressao = 0.22 + (andar / ANDARES) * 0.4
  if (r < pressao) return 'vendida'
  if (r < pressao + 0.14) return 'reservada'
  return 'disponivel'
}

/** Preço cresce com o andar e com a orientação para o rio. */
function precoDe(base: number, andar: number, orientacao: Orientacao): number {
  const porAndar = 1 + (andar - 1) * 0.0115
  const porVista = orientacao === 'norte' ? 1.08 : orientacao === 'oeste' ? 1.05 : 1
  return Math.round((base * porAndar * porVista) / 1000) * 1000
}

function distanciasDe(centro: [number, number, number]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const a of AMENIDADES) {
    const dx = centro[0] - a.posicao[0]
    const dy = centro[1] - a.posicao[1]
    const dz = centro[2] - a.posicao[2]
    out[a.id] = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz))
  }
  return out
}

function montar(): Unidade[] {
  const lista: Unidade[] = []
  for (const torre of TORRES) {
    const rand = rng(torre.id === 'A' ? 20260101 : 20260202)
    for (let andar = 1; andar <= ANDARES; andar++) {
      const cobertura = andar === ANDAR_COBERTURA
      const posicoes: Posicao[] = cobertura ? [1, 3] : [1, 2, 3, 4]
      for (const posicao of posicoes) {
        const orientacao = ORIENTACAO_POSICAO[posicao]
        const tipologiaId = cobertura ? 'cobertura' : posicao <= 2 ? 'tipo-1' : 'tipo-2'
        const tip = tipologiaById(tipologiaId)
        const centro = centroDaUnidade(torre.id as TowerId, andar, posicao)
        const numero = `${String(andar).padStart(2, '0')}${String(posicao).padStart(2, '0')}`
        lista.push({
          id: `${torre.id}-${numero}`,
          torre: torre.id as TowerId,
          andar,
          posicao,
          numero,
          tipologiaId,
          status: statusDe(rand(), andar),
          preco: precoDe(tip.precoBase, andar, orientacao),
          orientacao,
          vista: VISTAS[orientacao],
          distancias: distanciasDe(centro),
        })
      }
    }
  }
  return lista
}

export const UNIDADES: Unidade[] = montar()

export const unidadeById = (id: string): Unidade | undefined => UNIDADES.find((u) => u.id === id)

export const unidadesDaTorre = (t: TowerId): Unidade[] => UNIDADES.filter((u) => u.torre === t)

export const unidadesDoPavimento = (t: TowerId, andar: number): Unidade[] =>
  UNIDADES.filter((u) => u.torre === t && u.andar === andar)

export const resumoEstoque = () => {
  const total = UNIDADES.length
  const disponivel = UNIDADES.filter((u) => u.status === 'disponivel').length
  const reservada = UNIDADES.filter((u) => u.status === 'reservada').length
  return { total, disponivel, reservada, vendida: total - disponivel - reservada }
}
