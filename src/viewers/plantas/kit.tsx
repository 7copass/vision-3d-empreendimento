/**
 * Primitivas de desenho arquitetônico. Todas as coordenadas em CENTÍMETROS,
 * para que o viewBox de cada planta seja a dimensão real do apartamento.
 */
import { fmtAreaNum, fmtCota } from '../shared/formato'

/* ───────────────────────── paleta do desenho ───────────────────────── */

export const TINTA = {
  papel: '#faf7f2',
  paredeFundo: '#dfd3bd',
  paredeTraco: '#1d2123',
  hachura: '#8d8375',
  movel: '#595f63',
  movelLeve: '#8e949a',
  movelFundo: '#efe9de',
  piso: '#cdbba0',
  pisoLeve: '#ded2bd',
  texto: '#23282b',
  textoFraco: '#6c7276',
  cota: '#3d7d78',
  vegetacao: '#3d7d78',
  vegetacaoClara: '#7fb3ae',
  agua: '#7fb3ae',
  louca: '#ffffff',
  social: '#b59b76',
  intimo: '#3d7d78',
  servico: '#8d7f99',
} as const

/* traços, em cm */
export const TRACO = {
  fino: 1.1,
  medio: 1.8,
  grosso: 2.8,
  parede: 2.2,
} as const

/* ───────────────────────── defs reutilizáveis ───────────────────────── */

/**
 * Hachuras de corte de parede e paginações de piso. Entra uma vez por SVG;
 * `sufixo` evita colisão de id quando duas plantas convivem na mesma página.
 */
export function DefsPlanta({ sufixo }: { sufixo: string }) {
  const id = (n: string) => `${n}-${sufixo}`
  return (
    <defs>
      {/* corte de parede: hachura a 45° */}
      <pattern
        id={id('hachura')}
        width={14}
        height={14}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width={14} height={14} fill={TINTA.paredeFundo} />
        <line x1={0} y1={0} x2={0} y2={14} stroke={TINTA.hachura} strokeWidth={1.6} />
      </pattern>

      {/* porcelanato grande 80 × 80 */}
      <pattern id={id('piso-grande')} width={80} height={80} patternUnits="userSpaceOnUse">
        <rect width={80} height={80} fill="none" />
        <path d="M0 0H80V80" fill="none" stroke={TINTA.piso} strokeWidth={1.1} opacity={0.85} />
      </pattern>

      {/* porcelanato 60 × 60 assentado na diagonal */}
      <pattern
        id={id('piso-diagonal')}
        width={60}
        height={60}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <path d="M0 0H60V60" fill="none" stroke={TINTA.piso} strokeWidth={1.1} opacity={0.8} />
      </pattern>

      {/* porcelanato pequeno 45 × 45 (molhados) */}
      <pattern id={id('piso-pequeno')} width={45} height={45} patternUnits="userSpaceOnUse">
        <path d="M0 0H45V45" fill="none" stroke={TINTA.piso} strokeWidth={1} opacity={0.9} />
      </pattern>

      {/* tábua de madeira 20 cm, juntas alternadas */}
      <pattern id={id('piso-madeira')} width={240} height={40} patternUnits="userSpaceOnUse">
        <line x1={0} y1={0} x2={240} y2={0} stroke={TINTA.piso} strokeWidth={1.1} />
        <line x1={0} y1={20} x2={240} y2={20} stroke={TINTA.piso} strokeWidth={1.1} />
        <line x1={0} y1={0} x2={0} y2={20} stroke={TINTA.piso} strokeWidth={1} opacity={0.7} />
        <line x1={120} y1={20} x2={120} y2={40} stroke={TINTA.piso} strokeWidth={1} opacity={0.7} />
      </pattern>

      {/* deck de madeira da varanda / terraço */}
      <pattern id={id('piso-deck')} width={30} height={16} patternUnits="userSpaceOnUse">
        <line x1={0} y1={0} x2={30} y2={0} stroke={TINTA.piso} strokeWidth={1.4} />
        <line x1={0} y1={8} x2={30} y2={8} stroke={TINTA.piso} strokeWidth={0.9} opacity={0.5} />
      </pattern>

      {/* pedra natural em fiada corrida */}
      <pattern id={id('piso-pedra')} width={120} height={60} patternUnits="userSpaceOnUse">
        <path d="M0 0H120M0 60H120M0 0V60" fill="none" stroke={TINTA.piso} strokeWidth={1.1} />
        <line x1={60} y1={30} x2={60} y2={60} stroke={TINTA.piso} strokeWidth={1.1} />
        <line x1={0} y1={30} x2={120} y2={30} stroke={TINTA.piso} strokeWidth={1.1} />
      </pattern>

      {/* cimento queimado: pontilhado fino */}
      <pattern id={id('piso-cimento')} width={26} height={26} patternUnits="userSpaceOnUse">
        <circle cx={6} cy={6} r={1.3} fill={TINTA.piso} />
        <circle cx={19} cy={17} r={1.3} fill={TINTA.piso} />
      </pattern>

      {/* grama da jardineira */}
      <pattern id={id('grama')} width={24} height={24} patternUnits="userSpaceOnUse">
        <path
          d="M4 24 L6 12 M12 24 L10 13 M18 24 L20 11 M8 24 L9 17 M16 24 L15 16"
          stroke={TINTA.vegetacao}
          strokeWidth={1.6}
          fill="none"
          opacity={0.55}
          strokeLinecap="round"
        />
      </pattern>

      {/* lâmina d'água */}
      <pattern id={id('agua')} width={60} height={34} patternUnits="userSpaceOnUse">
        <rect width={60} height={34} fill={TINTA.agua} opacity={0.18} />
        <path
          d="M0 10 q15 -7 30 0 t30 0 M0 26 q15 -7 30 0 t30 0"
          fill="none"
          stroke={TINTA.agua}
          strokeWidth={1.6}
          opacity={0.8}
        />
      </pattern>
    </defs>
  )
}

export type Piso =
  | 'piso-grande'
  | 'piso-diagonal'
  | 'piso-pequeno'
  | 'piso-madeira'
  | 'piso-deck'
  | 'piso-pedra'
  | 'piso-cimento'
  | 'grama'
  | 'agua'

export const url = (nome: string, sufixo: string) => `url(#${nome}-${sufixo})`

/* ───────────────────────── paredes ───────────────────────── */

export interface Ret {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Trechos de parede em corte. Cada retângulo recebe hachura e contorno pesado;
 * as aberturas aparecem como ausência de retângulo.
 */
export function Paredes({ trechos, sufixo }: { trechos: Ret[]; sufixo: string }) {
  return (
    <g>
      {trechos.map((t, i) => (
        <rect
          key={i}
          x={t.x}
          y={t.y}
          width={t.w}
          height={t.h}
          fill={url('hachura', sufixo)}
          stroke={TINTA.paredeTraco}
          strokeWidth={TRACO.parede}
          strokeLinejoin="miter"
        />
      ))}
    </g>
  )
}

/** Guarda-corpo de vidro da varanda: dois fios finos. */
export function GuardaCorpo({ x, y, w, h }: Ret) {
  const vertical = h > w
  return (
    <g stroke={TINTA.movel} fill="none">
      <rect x={x} y={y} width={w} height={h} fill={TINTA.agua} opacity={0.1} stroke="none" />
      <rect x={x} y={y} width={w} height={h} strokeWidth={TRACO.fino} />
      {vertical ? (
        <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} strokeWidth={0.9} opacity={0.6} />
      ) : (
        <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} strokeWidth={0.9} opacity={0.6} />
      )}
    </g>
  )
}

/* ───────────────────────── portas ───────────────────────── */

interface PortaProps {
  /** Dobradiça. A folha gira do eixo +x para o eixo +y. */
  x: number
  y: number
  /** Vão livre, em cm. */
  largura: number
  /** Giro do conjunto em torno da dobradiça, em graus. */
  rot?: number
  /** Espelha o sentido de abertura. */
  espelho?: boolean
  espessura?: number
}

/** Porta de giro: folha aberta a 90° e arco de varredura. */
export function Porta({ x, y, largura: L, rot = 0, espelho = false, espessura = 15 }: PortaProps) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})${espelho ? ' scale(1 -1)' : ''}`}>
      {/* batente */}
      <line
        x1={0}
        y1={-espessura / 2}
        x2={0}
        y2={espessura / 2}
        stroke={TINTA.paredeTraco}
        strokeWidth={TRACO.medio}
      />
      <line
        x1={L}
        y1={-espessura / 2}
        x2={L}
        y2={espessura / 2}
        stroke={TINTA.paredeTraco}
        strokeWidth={TRACO.medio}
      />
      {/* arco de abertura */}
      <path
        d={`M ${L} 0 A ${L} ${L} 0 0 1 0 ${L}`}
        fill="none"
        stroke={TINTA.movelLeve}
        strokeWidth={TRACO.fino}
        strokeDasharray="7 6"
      />
      {/* folha */}
      <rect x={-2} y={0} width={4.5} height={L} fill={TINTA.movelFundo} stroke={TINTA.movel} strokeWidth={TRACO.fino} />
    </g>
  )
}

/** Porta de correr: folha deslizante sobre o rasgo, com seta de sentido. */
export function PortaCorrer({
  x,
  y,
  largura: L,
  rot = 0,
  folhas = 2,
}: {
  x: number
  y: number
  largura: number
  rot?: number
  folhas?: 1 | 2
}) {
  const l = L / folhas
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <line x1={0} y1={0} x2={L} y2={0} stroke={TINTA.movelLeve} strokeWidth={0.9} strokeDasharray="5 5" />
      <rect x={0} y={-6} width={l} height={5} fill={TINTA.movelFundo} stroke={TINTA.movel} strokeWidth={TRACO.fino} />
      {folhas === 2 && (
        <rect x={l} y={1} width={l} height={5} fill={TINTA.movelFundo} stroke={TINTA.movel} strokeWidth={TRACO.fino} />
      )}
    </g>
  )
}

/** Caixilho de alumínio com vidro: duas folhas de correr de piso a teto. */
export function Esquadria({
  x,
  y,
  comprimento: L,
  rot = 0,
  espessura = 20,
}: {
  x: number
  y: number
  comprimento: number
  rot?: number
  espessura?: number
}) {
  const t = espessura
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={0} y={0} width={L} height={t} fill={TINTA.papel} stroke="none" />
      <line x1={0} y1={0} x2={L} y2={0} stroke={TINTA.paredeTraco} strokeWidth={TRACO.medio} />
      <line x1={0} y1={t} x2={L} y2={t} stroke={TINTA.paredeTraco} strokeWidth={TRACO.medio} />
      {/* vidros */}
      <line x1={0} y1={t * 0.36} x2={L} y2={t * 0.36} stroke={TINTA.agua} strokeWidth={1.6} />
      <line x1={0} y1={t * 0.64} x2={L} y2={t * 0.64} stroke={TINTA.agua} strokeWidth={1.6} />
      {/* montante central */}
      <line x1={L / 2} y1={t * 0.2} x2={L / 2} y2={t * 0.8} stroke={TINTA.movel} strokeWidth={TRACO.fino} />
      <line x1={0} y1={t * 0.2} x2={0} y2={t * 0.8} stroke={TINTA.movel} strokeWidth={TRACO.fino} />
      <line x1={L} y1={t * 0.2} x2={L} y2={t * 0.8} stroke={TINTA.movel} strokeWidth={TRACO.fino} />
    </g>
  )
}

/** Janela alta de banheiro / serviço: basculante, com peitoril. */
export function Basculante({
  x,
  y,
  comprimento: L,
  rot = 0,
  espessura = 15,
}: {
  x: number
  y: number
  comprimento: number
  rot?: number
  espessura?: number
}) {
  const t = espessura
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={0} y={0} width={L} height={t} fill={TINTA.papel} stroke={TINTA.paredeTraco} strokeWidth={TRACO.fino} />
      <line x1={0} y1={t / 2} x2={L} y2={t / 2} stroke={TINTA.agua} strokeWidth={1.8} />
      <line x1={L / 2} y1={0} x2={L / 2} y2={t} stroke={TINTA.movel} strokeWidth={0.9} />
    </g>
  )
}

/* ───────────────────────── cotas ───────────────────────── */

function tick(x: number, y: number, rot: number) {
  return (
    <line
      x1={-9}
      y1={9}
      x2={9}
      y2={-9}
      transform={`translate(${x} ${y}) rotate(${rot})`}
      stroke={TINTA.cota}
      strokeWidth={TRACO.fino}
    />
  )
}

/** Cota horizontal: linha, ticks a 45°, texto em metros. */
export function CotaH({
  x1,
  x2,
  y,
  texto,
  altura = 16,
}: {
  x1: number
  x2: number
  y: number
  texto?: string
  altura?: number
}) {
  const meio = (x1 + x2) / 2
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={TINTA.cota} strokeWidth={TRACO.fino} />
      {tick(x1, y, 0)}
      {tick(x2, y, 0)}
      <text
        x={meio}
        y={y - altura * 0.45}
        textAnchor="middle"
        fontSize={altura}
        fill={TINTA.cota}
        fontFamily="Inter, sans-serif"
        letterSpacing={0.6}
      >
        {texto ?? fmtCota(Math.abs(x2 - x1))}
      </text>
    </g>
  )
}

/** Cota vertical: texto girado 90°, lendo de baixo para cima. */
export function CotaV({
  y1,
  y2,
  x,
  texto,
  altura = 16,
}: {
  y1: number
  y2: number
  x: number
  texto?: string
  altura?: number
}) {
  const meio = (y1 + y2) / 2
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2} stroke={TINTA.cota} strokeWidth={TRACO.fino} />
      {tick(x, y1, 90)}
      {tick(x, y2, 90)}
      <text
        transform={`translate(${x - altura * 0.45} ${meio}) rotate(-90)`}
        textAnchor="middle"
        fontSize={altura}
        fill={TINTA.cota}
        fontFamily="Inter, sans-serif"
        letterSpacing={0.6}
      >
        {texto ?? fmtCota(Math.abs(y2 - y1))}
      </text>
    </g>
  )
}

/* ───────────────────────── rótulos ───────────────────────── */

/** Rótulo de ambiente: nome em caixa alta espaçada e área em m². */
export function Rotulo({
  x,
  y,
  nome,
  area,
  corpo = 19,
  cor = TINTA.texto,
  linhas,
}: {
  x: number
  y: number
  nome: string
  /** Área em m². Omitida, imprime só o nome. */
  area?: number
  corpo?: number
  cor?: string
  /** Nome em duas linhas, quando o ambiente é estreito. */
  linhas?: [string, string]
}) {
  return (
    <g textAnchor="middle" fontFamily="Inter, sans-serif" pointerEvents="none">
      {linhas ? (
        <>
          <text x={x} y={y - corpo * 0.55} fontSize={corpo} fill={cor} letterSpacing={corpo * 0.1}>
            {linhas[0].toUpperCase()}
          </text>
          <text x={x} y={y + corpo * 0.5} fontSize={corpo} fill={cor} letterSpacing={corpo * 0.1}>
            {linhas[1].toUpperCase()}
          </text>
        </>
      ) : (
        <text x={x} y={y} fontSize={corpo} fill={cor} letterSpacing={corpo * 0.1}>
          {nome.toUpperCase()}
        </text>
      )}
      {area !== undefined && (
        <text
          x={x}
          y={y + (linhas ? corpo * 1.75 : corpo * 1.25)}
          fontSize={corpo * 0.82}
          fill={TINTA.textoFraco}
          letterSpacing={corpo * 0.04}
        >
          {fmtAreaNum(area)} m²
        </text>
      )}
    </g>
  )
}

/* ───────────────────────── norte e escala ───────────────────────── */

/** Rosa do norte simplificada: agulha cheia ao norte, vazia ao sul. */
export function Norte({ x, y, r = 46, rumo = 0 }: { x: number; y: number; r?: number; rumo?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={0} cy={0} r={r} fill="none" stroke={TINTA.cota} strokeWidth={TRACO.fino} opacity={0.5} />
      <g transform={`rotate(${rumo})`}>
        <path d={`M 0 ${-r * 0.82} L ${r * 0.22} ${r * 0.3} L 0 ${r * 0.08} Z`} fill={TINTA.cota} />
        <path
          d={`M 0 ${-r * 0.82} L ${-r * 0.22} ${r * 0.3} L 0 ${r * 0.08} Z`}
          fill="none"
          stroke={TINTA.cota}
          strokeWidth={TRACO.fino}
        />
      </g>
      <text
        x={0}
        y={-r - 10}
        textAnchor="middle"
        fontSize={r * 0.44}
        fill={TINTA.cota}
        fontFamily="Inter, sans-serif"
        letterSpacing={1}
      >
        N
      </text>
    </g>
  )
}

/** Escala gráfica 0–1–2–5 m, em barras alternadas. */
export function EscalaGrafica({ x, y, metros = 5 }: { x: number; y: number; metros?: number }) {
  const passo = 100
  return (
    <g transform={`translate(${x} ${y})`} fontFamily="Inter, sans-serif">
      {Array.from({ length: metros }, (_, i) => (
        <rect
          key={i}
          x={i * passo}
          y={0}
          width={passo}
          height={13}
          fill={i % 2 === 0 ? TINTA.cota : TINTA.papel}
          stroke={TINTA.cota}
          strokeWidth={TRACO.fino}
        />
      ))}
      {[0, 1, 2, 5].filter((m) => m <= metros).map((m) => (
        <text key={m} x={m * passo} y={30} textAnchor="middle" fontSize={15} fill={TINTA.cota}>
          {m}
        </text>
      ))}
      <text x={metros * passo + 22} y={30} fontSize={15} fill={TINTA.cota}>
        m
      </text>
    </g>
  )
}

/** Selo do desenho, canto inferior. */
export function Selo({
  x,
  y,
  titulo,
  linhas,
  largura = 520,
}: {
  x: number
  y: number
  titulo: string
  linhas: string[]
  largura?: number
}) {
  return (
    <g transform={`translate(${x} ${y})`} fontFamily="Inter, sans-serif">
      <line x1={0} y1={0} x2={largura} y2={0} stroke={TINTA.cota} strokeWidth={TRACO.medio} />
      <text x={0} y={34} fontSize={26} fill={TINTA.texto} letterSpacing={2.4} fontFamily="Cormorant Garamond, Georgia, serif">
        {titulo.toUpperCase()}
      </text>
      {linhas.map((l, i) => (
        <text key={i} x={0} y={60 + i * 22} fontSize={15} fill={TINTA.textoFraco} letterSpacing={0.5}>
          {l}
        </text>
      ))}
    </g>
  )
}

/** Piso de um ambiente: fundo claro + paginação. */
export function Piso({ x, y, w, h, piso, sufixo }: Ret & { piso: Piso; sufixo: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={TINTA.papel} />
      <rect x={x} y={y} width={w} height={h} fill={url(piso, sufixo)} />
    </g>
  )
}

/** Degrau / soleira entre dois níveis. */
export function Soleira({ x, y, w, h }: Ret) {
  return <rect x={x} y={y} width={w} height={h} fill={TINTA.pisoLeve} stroke={TINTA.movelLeve} strokeWidth={TRACO.fino} />
}
