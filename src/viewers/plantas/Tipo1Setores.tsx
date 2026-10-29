/**
 * Tipo 1 — diagrama de setorização. Mesma geometria da planta humanizada,
 * em cores chapadas por setor, com legenda e as faixas de uso anotadas.
 */
import { PlantaBase, CORES_SETOR } from './PlantaBase'
import type { PlantaDef } from './PlantaBase'
import { defTipo1 } from './Tipo1'
import { TINTA, TRACO } from './kit'

export const defTipo1Setores: PlantaDef = {
  ...defTipo1,
  id: 'tipo-1-setores',
  margem: { esq: 160, dir: 190, topo: 140, base: 430 },
  cotasH: undefined,
  cotasV: undefined,
  escala: { x: 0, y: 1046 },
  selo: {
    x: 0,
    y: 1150,
    titulo: 'Tipo 1 · Setorização',
    linhas: [
      'Social 40,9 m²  ·  Íntimo 41,4 m²  ·  Serviço 13,0 m²',
      'O setor social ocupa a esquina Norte–Oeste, onde a varanda e o living recebem o poente.',
      'O setor íntimo fica no lado silencioso, atrás de uma única circulação de 5,8 m².',
      'O setor de serviço se agrupa junto à entrada, com acesso independente à cozinha.',
    ],
    largura: 700,
  },
}

/** Chamadas gráficas dos três setores sobre o diagrama. */
function ChamadasSetor() {
  const linhas: { x1: number; y1: number; x2: number; y2: number; texto: string; cor: string }[] = [
    { x1: 300, y1: 130, x2: -120, y2: 60, texto: 'SOCIAL', cor: CORES_SETOR.social },
    { x1: 1090, y1: 220, x2: 1400, y2: 150, texto: 'ÍNTIMO', cor: CORES_SETOR.intimo },
    { x1: 1120, y1: 790, x2: 1400, y2: 900, texto: 'SERVIÇO', cor: CORES_SETOR.servico },
  ]
  return (
    <g fontFamily="Inter, sans-serif">
      {linhas.map((l) => (
        <g key={l.texto}>
          <circle cx={l.x1} cy={l.y1} r={7} fill={l.cor} />
          <path
            d={`M${l.x1} ${l.y1} L${l.x2} ${l.y2}`}
            stroke={l.cor}
            strokeWidth={TRACO.fino}
            fill="none"
            opacity={0.7}
          />
          <text
            x={l.x2}
            y={l.y2 - 12}
            textAnchor={l.x2 < l.x1 ? 'start' : 'end'}
            fontSize={24}
            letterSpacing={3}
            fill={l.cor}
          >
            {l.texto}
          </text>
        </g>
      ))}
      <text x={0} y={1004} fontSize={17} fill={TINTA.textoFraco} letterSpacing={0.6}>
        Diagrama de uso — sem mobiliário, sem cotas.
      </text>
    </g>
  )
}

export function PlantaTipo1Setores() {
  return (
    <PlantaBase def={defTipo1Setores} sufixo="t1s" setores>
      <ChamadasSetor />
    </PlantaBase>
  )
}
