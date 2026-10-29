/**
 * Camada de colisão da frente de interação.
 *
 * Esta frente NÃO depende da geometria construída em `src/scene/building/`:
 * ela deriva suas próprias caixas a partir do contrato de `src/core/world.ts`.
 * Se a arquitetura mudar de linguagem formal, a interação continua alinhada,
 * porque as duas leem as mesmas medidas.
 *
 * Uma caixa por unidade (156 = 2 torres × (19 pavimentos × 4 + 1 cobertura × 2)).
 */
import { Color } from 'three'
import type { Filtros, TowerId, UnitStatus, Unidade } from '../../core/types'
import {
  ANDARES,
  ANDAR_COBERTURA,
  FLOOR_H,
  OFFSET_POSICAO,
  TORRES,
  ancoraDeRotulo,
  baseDoPavimento,
  centroDaUnidade,
  torreById,
} from '../../core/world'
import { UNIDADES } from '../../data/inventory'

/** Encolhe a caixa de colisão para que vizinhas não disputem o mesmo plano. */
export const FOLGA_COLISAO = 0.96
/** A caixa de tinta cresce um fio para vencer a fachada coplanar. */
export const SOBRA_TINTA = 1.015
/** Quanto da altura do pavimento o volume tingido ocupa. */
export const ALTURA_TINTA = 0.86

export interface CaixaDaUnidade {
  unidade: Unidade
  /** Centro do quadrante, de `centroDaUnidade`. */
  centro: [number, number, number]
  /** Largura × altura × profundidade do quadrante, em metros. */
  tamanho: [number, number, number]
  /** Direção horizontal unitária apontando para fora da torre. */
  fora: [number, number]
  /** Ponto de ancoragem do rótulo: `ancoraDeRotulo`, fora do volume construído. */
  ancora: [number, number, number]
}

function montarCaixa(u: Unidade): CaixaDaUnidade {
  const t = torreById(u.torre)
  const [ox, oz] = OFFSET_POSICAO[u.posicao]
  const centro = centroDaUnidade(u.torre, u.andar, u.posicao)
  const cobertura = u.andar === ANDAR_COBERTURA

  // Pavimento tipo: a unidade ocupa um quadrante da planta (largura/2 × profundidade/2).
  // Cobertura: só existem duas unidades (posições 1 e 3), então cada uma toma
  // metade da planta no eixo X e a profundidade inteira. O centro no eixo Z
  // volta para o eixo da torre; o ponto de `centroDaUnidade` segue sendo a âncora.
  const tamanho: [number, number, number] = cobertura
    ? [t.largura / 2, FLOOR_H, t.profundidade]
    : [t.largura / 2, FLOOR_H, t.profundidade / 2]
  const centroCaixa: [number, number, number] = cobertura
    ? [centro[0], centro[1], t.centro[2]]
    : centro

  const fora: [number, number] = cobertura ? [ox, 0] : [ox / Math.SQRT2, oz / Math.SQRT2]

  // O rótulo mora fora da fachada, por conta de `ancoraDeRotulo`: a varanda é
  // ponto de câmera, e um rótulo ancorado lá dentro sumiria atrás da parede
  // quando o teste de oclusão do `Html` rodasse.
  const ancora = ancoraDeRotulo(u.torre, u.andar, u.posicao)

  return { unidade: u, centro: centroCaixa, tamanho, fora, ancora }
}

/** Caixas agrupadas por torre: dois alvos de raycast em vez de 156 objetos. */
export const CAIXAS_POR_TORRE: Record<TowerId, CaixaDaUnidade[]> = {
  A: UNIDADES.filter((u) => u.torre === 'A').map(montarCaixa),
  B: UNIDADES.filter((u) => u.torre === 'B').map(montarCaixa),
}

/** id da unidade → torre e índice da instância dentro daquela torre. */
export const INDICE_DA_CAIXA = new Map<string, { torre: TowerId; i: number }>()
for (const torre of ['A', 'B'] as TowerId[]) {
  CAIXAS_POR_TORRE[torre].forEach((c, i) => INDICE_DA_CAIXA.set(c.unidade.id, { torre, i }))
}

export function caixaDaUnidade(id: string | null): CaixaDaUnidade | null {
  if (!id) return null
  const ref = INDICE_DA_CAIXA.get(id)
  return ref ? CAIXAS_POR_TORRE[ref.torre][ref.i] : null
}

const numeroDaUnidade = (andar: number, posicao: number) =>
  `${String(andar).padStart(2, '0')}${String(posicao).padStart(2, '0')}`

/**
 * Âncoras padrão dos rótulos: a cobertura e uma unidade de meia altura em cada
 * torre. Quatro etiquetas — o bastante para dar escala sem virar poluição.
 */
export function ancorasPadrao(): string[] {
  const meio = Math.max(1, Math.round(ANDARES / 2))
  const ids: string[] = []
  for (const t of TORRES) {
    ids.push(`${t.id}-${numeroDaUnidade(ANDAR_COBERTURA, 1)}`)
    ids.push(`${t.id}-${numeroDaUnidade(meio, 2)}`)
  }
  return ids.filter((id) => INDICE_DA_CAIXA.has(id))
}

/* ------------------------------------------------------------------ cores */

const COR_PADRAO: Record<UnitStatus, string> = {
  disponivel: '#6fbf8e',
  reservada: '#e0b765',
  vendida: '#b4595b',
}
/** Grafite dos tokens: para onde a cor caminha quando a unidade é esmaecida. */
const COR_APAGADA = '#1d2123'

let cache: Record<UnitStatus, Color> | null = null

function lerToken(nome: string, padrao: string): string {
  if (typeof document === 'undefined') return padrao
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--color-${nome}`).trim()
  return v || padrao
}

/** Cor do status, lida dos tokens de `src/index.css` com recuo para o hex do design. */
export function corDoStatus(status: UnitStatus): Color {
  if (!cache) {
    cache = {
      disponivel: new Color(lerToken('disponivel', COR_PADRAO.disponivel)),
      reservada: new Color(lerToken('reservada', COR_PADRAO.reservada)),
      vendida: new Color(lerToken('vendida', COR_PADRAO.vendida)),
    }
  }
  return cache[status]
}

export const COR_ESMAECIDA = new Color(COR_APAGADA)
export const COR_SELECAO = new Color('#faf7f2')
export const COR_FRISO = new Color('#e2d7c5')

/* ---------------------------------------------------------------- realces */

/**
 * O que desenhar sobre cada unidade.
 * - `nenhum`    — não existe no 3D. Estado de repouso de todas as 156.
 * - `esmaecido` — volume quase apagado: continua lá, mas sai de cena.
 * - `status`    — volume tingido pela cor do estoque.
 * - `destaque`  — unidade sob o cursor ou selecionada: tinta forte + contorno.
 */
export type Realce = 'nenhum' | 'esmaecido' | 'status' | 'destaque'

export function filtrosAtivos(f: Filtros): boolean {
  return (
    f.tipologias.length > 0 ||
    f.status.length > 0 ||
    f.orientacoes.length > 0 ||
    f.andarMin > 1 ||
    f.precoMax !== null
  )
}

export interface EstadoDeRealce {
  filtros: Filtros
  passa: (u: Unidade) => boolean
  hover: string | null
  selecionada: string | null
  torreAtiva: TowerId | null
  andarAtivo: number | null
}

/**
 * Política de poluição visual, num só lugar para poder ser discutida:
 *
 * 1. Em repouso (sem filtro, sem pavimento ativo, sem hover, sem seleção)
 *    nada é desenhado — o 3D fica com a arquitetura e mais nada.
 * 2. Filtro ativo é pedido explícito de ver o estoque: todas as 156 aparecem,
 *    as que passam tingidas pelo status, as que não passam esmaecidas.
 * 3. Pavimento ativo sem filtro: só aquele pavimento (4 unidades, ou 8 se as
 *    duas torres estiverem em jogo).
 * 4. Seleção: a unidade ganha destaque e o resto do que estava visível
 *    esmaece. Se nada estava visível, entram as vizinhas do mesmo pavimento
 *    como contexto esmaecido — um punhado de marcadores, não 156.
 * 5. Hover sempre vira destaque, por cima de qualquer regra anterior.
 */
export function planoDeRealce(e: EstadoDeRealce): Map<string, Realce> {
  const plano = new Map<string, Realce>()
  const porFiltro = filtrosAtivos(e.filtros)

  if (porFiltro) {
    for (const u of UNIDADES) plano.set(u.id, e.passa(u) ? 'status' : 'esmaecido')
  } else if (e.andarAtivo !== null) {
    for (const u of UNIDADES) {
      if (u.andar !== e.andarAtivo) continue
      if (e.torreAtiva && u.torre !== e.torreAtiva) continue
      plano.set(u.id, 'status')
    }
  }

  if (e.selecionada) {
    const sel = caixaDaUnidade(e.selecionada)?.unidade
    if (sel) {
      // o resto do que estava visível recua
      for (const [id, r] of plano) if (r === 'status') plano.set(id, 'esmaecido')
      if (plano.size === 0) {
        for (const u of UNIDADES) {
          if (u.torre === sel.torre && u.andar === sel.andar) plano.set(u.id, 'esmaecido')
        }
      }
      plano.set(sel.id, 'destaque')
    }
  }

  if (e.hover) plano.set(e.hover, 'destaque')

  return plano
}

/** Friso do pavimento: contorno da planta inteira da torre naquele andar. */
export function frisosDoPavimento(
  andar: number | null,
  torreAtiva: TowerId | null,
): { torre: TowerId; centro: [number, number, number]; tamanho: [number, number, number] }[] {
  if (andar === null) return []
  return TORRES.filter((t) => !torreAtiva || t.id === torreAtiva).map((t) => ({
    torre: t.id,
    centro: [t.centro[0], baseDoPavimento(andar) + FLOOR_H / 2, t.centro[2]],
    tamanho: [t.largura * 1.02, FLOOR_H * 0.96, t.profundidade * 1.02],
  }))
}
