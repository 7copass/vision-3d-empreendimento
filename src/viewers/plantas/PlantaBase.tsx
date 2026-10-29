/**
 * Renderizador comum das plantas. Recebe a definição geométrica (em cm) e
 * desenha, nesta ordem: pisos, paredes em corte, esquadrias, portas,
 * mobiliário (children), rótulos, cotas, norte, escala e selo.
 */
import type { ReactNode } from 'react'
import {
  Basculante,
  CotaH,
  CotaV,
  DefsPlanta,
  Esquadria,
  EscalaGrafica,
  GuardaCorpo,
  Norte,
  Piso,
  Porta,
  PortaCorrer,
  Paredes,
  Rotulo,
  Selo,
  TINTA,
  TRACO,
} from './kit'
import type { Piso as TipoPiso, Ret } from './kit'
import { DefsMobilia } from './mobilia'

export type Setor = 'social' | 'intimo' | 'servico' | 'externo'

export interface Comodo extends Ret {
  id: string
  nome: string
  piso: TipoPiso
  setor: Setor
  /** Nome em duas linhas quando o ambiente é estreito. */
  linhas?: [string, string]
  /** Desloca o rótulo do centro geométrico. */
  dx?: number
  dy?: number
  /** Soma à área impressa (ambientes em L, desenhados em dois retângulos). */
  somaArea?: number
  /** Não imprime rótulo (segundo retângulo de um ambiente em L). */
  mudo?: boolean
  corpo?: number
}

export interface Abertura {
  x: number
  y: number
  comprimento: number
  rot?: number
  espessura?: number
}

export interface PortaDef {
  x: number
  y: number
  largura: number
  rot?: number
  espelho?: boolean
  espessura?: number
}

export interface CorrerDef {
  x: number
  y: number
  largura: number
  rot?: number
  folhas?: 1 | 2
}

export interface PlantaDef {
  id: string
  /** viewBox: 0 0 largura altura, mais a margem de cotas. */
  largura: number
  altura: number
  /** Margem em volta do apartamento para cotas, norte e selo. */
  margem: { esq: number; dir: number; topo: number; base: number }
  comodos: Comodo[]
  paredes: Ret[]
  guardaCorpos?: Ret[]
  esquadrias?: Abertura[]
  basculantes?: Abertura[]
  portas?: PortaDef[]
  correr?: CorrerDef[]
  cotasH?: { x1: number; x2: number; y: number; texto?: string }[]
  cotasV?: { y1: number; y2: number; x: number; texto?: string }[]
  norte: { x: number; y: number; r?: number; rumo?: number }
  escala: { x: number; y: number; metros?: number }
  selo: { x: number; y: number; titulo: string; linhas: string[]; largura?: number }
}

export const CORES_SETOR: Record<Setor, string> = {
  social: TINTA.social,
  intimo: TINTA.intimo,
  servico: TINTA.servico,
  externo: TINTA.vegetacaoClara,
}

export const NOME_SETOR: Record<Setor, string> = {
  social: 'Social',
  intimo: 'Íntimo',
  servico: 'Serviço',
  externo: 'Externo',
}

export function areaDoComodo(c: Comodo): number {
  return (c.w * c.h) / 10000 + (c.somaArea ?? 0)
}

interface PlantaBaseProps {
  def: PlantaDef
  sufixo: string
  /** Diagrama de setorização: cores chapadas, sem mobília nem paginação. */
  setores?: boolean
  children?: ReactNode
}

export function PlantaBase({ def, sufixo, setores = false, children }: PlantaBaseProps) {
  const m = def.margem
  const vb = `${-m.esq} ${-m.topo} ${def.largura + m.esq + m.dir} ${def.altura + m.topo + m.base}`

  return (
    <svg
      viewBox={vb}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={def.selo.titulo}
      style={{ display: 'block' }}
    >
      <DefsPlanta sufixo={sufixo} />
      {!setores && <DefsMobilia sufixo={sufixo} />}

      {/* folha */}
      <rect
        x={-m.esq}
        y={-m.topo}
        width={def.largura + m.esq + m.dir}
        height={def.altura + m.topo + m.base}
        fill={TINTA.papel}
      />

      {/* pisos */}
      <g>
        {def.comodos.map((c) =>
          setores ? (
            <g key={c.id}>
              <rect x={c.x} y={c.y} width={c.w} height={c.h} fill={CORES_SETOR[c.setor]} opacity={0.26} />
              <rect
                x={c.x}
                y={c.y}
                width={c.w}
                height={c.h}
                fill="none"
                stroke={CORES_SETOR[c.setor]}
                strokeWidth={TRACO.medio}
                opacity={0.85}
              />
            </g>
          ) : (
            <Piso key={c.id} x={c.x} y={c.y} w={c.w} h={c.h} piso={c.piso} sufixo={sufixo} />
          ),
        )}
      </g>

      {/* mobiliário (plantas humanizadas) ou chamadas (diagrama de setores) */}
      <g>{children}</g>

      {/* paredes em corte */}
      <Paredes trechos={def.paredes} sufixo={sufixo} />

      {/* guarda-corpos de vidro */}
      {def.guardaCorpos?.map((g, i) => (
        <GuardaCorpo key={i} x={g.x} y={g.y} w={g.w} h={g.h} />
      ))}

      {/* esquadrias e basculantes */}
      {def.esquadrias?.map((e, i) => (
        <Esquadria key={i} x={e.x} y={e.y} comprimento={e.comprimento} rot={e.rot} espessura={e.espessura} />
      ))}
      {def.basculantes?.map((e, i) => (
        <Basculante key={i} x={e.x} y={e.y} comprimento={e.comprimento} rot={e.rot} espessura={e.espessura} />
      ))}

      {/* portas */}
      {!setores &&
        def.portas?.map((p, i) => (
          <Porta key={i} x={p.x} y={p.y} largura={p.largura} rot={p.rot} espelho={p.espelho} espessura={p.espessura} />
        ))}
      {!setores &&
        def.correr?.map((p, i) => (
          <PortaCorrer key={i} x={p.x} y={p.y} largura={p.largura} rot={p.rot} folhas={p.folhas} />
        ))}

      {/* rótulos */}
      <g>
        {def.comodos
          .filter((c) => !c.mudo)
          .map((c) => (
            <Rotulo
              key={c.id}
              x={c.x + c.w / 2 + (c.dx ?? 0)}
              y={c.y + c.h / 2 + (c.dy ?? 0)}
              nome={c.nome}
              linhas={c.linhas}
              area={areaDoComodo(c)}
              corpo={c.corpo ?? 19}
              cor={setores ? CORES_SETOR[c.setor] : TINTA.texto}
            />
          ))}
      </g>

      {/* cotas */}
      {!setores && (
        <g>
          {def.cotasH?.map((c, i) => (
            <CotaH key={`h${i}`} x1={c.x1} x2={c.x2} y={c.y} texto={c.texto} />
          ))}
          {def.cotasV?.map((c, i) => (
            <CotaV key={`v${i}`} y1={c.y1} y2={c.y2} x={c.x} texto={c.texto} />
          ))}
        </g>
      )}

      {/* norte, escala e selo */}
      <Norte x={def.norte.x} y={def.norte.y} r={def.norte.r} rumo={def.norte.rumo} />
      {!setores && <EscalaGrafica x={def.escala.x} y={def.escala.y} metros={def.escala.metros} />}
      <Selo
        x={def.selo.x}
        y={def.selo.y}
        titulo={def.selo.titulo}
        linhas={def.selo.linhas}
        largura={def.selo.largura}
      />

      {setores && <LegendaSetores x={def.escala.x} y={def.escala.y - 30} />}
    </svg>
  )
}

/** Legenda do diagrama de setorização. */
export function LegendaSetores({ x, y }: { x: number; y: number }) {
  const itens: Setor[] = ['social', 'intimo', 'servico']
  return (
    <g transform={`translate(${x} ${y})`} fontFamily="Inter, sans-serif">
      {itens.map((s, i) => (
        <g key={s} transform={`translate(0 ${i * 42})`}>
          <rect width={34} height={24} fill={CORES_SETOR[s]} opacity={0.28} />
          <rect width={34} height={24} fill="none" stroke={CORES_SETOR[s]} strokeWidth={TRACO.medio} />
          <text x={48} y={17} fontSize={20} fill={TINTA.texto} letterSpacing={1.6}>
            {NOME_SETOR[s].toUpperCase()}
          </text>
        </g>
      ))}
    </g>
  )
}
