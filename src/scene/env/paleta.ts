/**
 * Paleta do céu por altitude solar.
 *
 * Tudo aqui é função de UMA variável: a altitude aparente do sol em graus.
 * É o que mantém a transição contínua quando o usuário arrasta a régua de
 * hora — não há degrau, não há `if (noite)`, só interpolação entre
 * quadros-chave ordenados por altitude.
 *
 * Santarém fica a 2° do Equador: ao meio-dia a altitude passa de 80° quase
 * todo o ano, então o topo do céu é azul profundo e as sombras encurtam até
 * quase desaparecer. Em compensação, nascer e poente acontecem rápido e com
 * o sol passando perto do zênite do horizonte.
 *
 * NEBLINA E AMBIENTE DE DIA: a primeira calibragem punha névoa de 0,0010 e
 * luz hemisférica de 0,95 ao meio-dia. Somadas, lavavam a cena — o campo
 * distante virava cinza-azulado e a face na sombra ficava quase tão clara
 * quanto a face ao sol, então o conjunto perdia profundidade justo no
 * horário em que o sol a pino já não dá sombra nenhuma. Agora a névoa de
 * meio-dia é metade e o ambiente caiu para 0,74: a razão sol/ambiente sobe de
 * 4,6 para 5,9 e as fachadas voltam a ter lado claro e lado escuro. A névoa
 * forte continua valendo de sol baixo para baixo, onde ela é verdadeira e é o
 * que dá a perspectiva aérea do poente.
 *
 * A faixa quente vai até ~22° de altitude, não até 10°, porque os presets do
 * store caem nela: 'manha' (7h30) dá 11°–14° e 'portaldosol' (17h36) dá
 * 13°–18° em Santarém. Clicar 'Portal do Sol' tem que entregar fim de tarde,
 * e a 14° a massa de ar já é ~4× a do zênite — luz quente é o correto, não um
 * favor. É também onde a sombra das torres chega a 300 m e varre o pódio.
 */

export interface CoresDoCeu {
  /** Cor do zênite. */
  topo: string
  /** Cor da faixa do horizonte. */
  horizonte: string
  /** Cor da luz direta — o sol, ou a lua depois que ele se põe. */
  sol: string
  /** Cor da neblina/perspectiva aérea. */
  neblina: string
  /** Intensidade da luz direcional do sol. */
  intensidadeSol: number
  /** Intensidade da luz hemisférica (céu + rebatimento do chão). */
  intensidadeAmbiente: number
}

export interface ParametrosDoCeu {
  /** Densidade do `fogExp2`. */
  densidadeNeblina: number
  /** `gl.toneMappingExposure` — mantém dia e noite na mesma faixa. */
  exposicao: number
  /** Multiplicador do disco e do halo do sol no shader do domo. */
  brilhoDoSol: number
  /** 0 → sem estrelas, 1 → céu estrelado cheio. */
  intensidadeEstrelas: number
  /** Rampa de noite, 0 (dia) → 1 (noite fechada). */
  noite: number
  /** Intensidade da luz direcional da lua. */
  intensidadeLua: number
  /** Multiplicador da iluminação cênica do conjunto (postes, piscina, base). */
  intensidadeCenica: number
}

/** [altitude em graus, cores] — tem que ficar em ordem crescente de altitude. */
const QUADROS_COR: Array<[number, CoresDoCeu]> = [
  [-90,  { topo: '#050b16', horizonte: '#0a1326', sol: '#aec4e8', neblina: '#0b1020', intensidadeSol: 0,    intensidadeAmbiente: 0.07 }],
  [-14,  { topo: '#0a1830', horizonte: '#16233f', sol: '#aec4e8', neblina: '#121b31', intensidadeSol: 0,    intensidadeAmbiente: 0.08 }],
  [-6,   { topo: '#122747', horizonte: '#6e4a66', sol: '#b7c6e2', neblina: '#3c4260', intensidadeSol: 0,    intensidadeAmbiente: 0.15 }],
  [-1.5, { topo: '#22416f', horizonte: '#c4593f', sol: '#b7c6e2', neblina: '#7a4f55', intensidadeSol: 0,    intensidadeAmbiente: 0.26 }],
  [0,    { topo: '#2a5288', horizonte: '#f2683a', sol: '#f4642e', neblina: '#c4714f', intensidadeSol: 0.55, intensidadeAmbiente: 0.31 }],
  [2,    { topo: '#2f5f9e', horizonte: '#ff7e34', sol: '#ff7836', neblina: '#e8865a', intensidadeSol: 1.15, intensidadeAmbiente: 0.36 }],
  [6,    { topo: '#3a79bd', horizonte: '#ff9f55', sol: '#ffa050', neblina: '#efae7c', intensidadeSol: 1.90, intensidadeAmbiente: 0.42 }],
  [14,   { topo: '#3a7cc0', horizonte: '#ffb871', sol: '#ffb765', neblina: '#eabf93', intensidadeSol: 2.80, intensidadeAmbiente: 0.52 }],
  [22,   { topo: '#337ac6', horizonte: '#ebcfa8', sol: '#ffd79c', neblina: '#dcd5bc', intensidadeSol: 3.30, intensidadeAmbiente: 0.60 }],
  [38,   { topo: '#2468c4', horizonte: '#c2d6ec', sol: '#fff0d4', neblina: '#c4d7ea', intensidadeSol: 3.90, intensidadeAmbiente: 0.68 }],
  [90,   { topo: '#1552b8', horizonte: '#a9c9ea', sol: '#fff6e8', neblina: '#b9d2ea', intensidadeSol: 4.40, intensidadeAmbiente: 0.74 }],
]

const QUADROS_PARAM: Array<[number, ParametrosDoCeu]> = [
  [-90,  { densidadeNeblina: 0.0013, exposicao: 1.26, brilhoDoSol: 0,    intensidadeEstrelas: 1,    noite: 1,    intensidadeLua: 1,    intensidadeCenica: 1 }],
  [-14,  { densidadeNeblina: 0.0015, exposicao: 1.24, brilhoDoSol: 0,    intensidadeEstrelas: 1,    noite: 1,    intensidadeLua: 1,    intensidadeCenica: 1 }],
  [-6,   { densidadeNeblina: 0.0020, exposicao: 1.20, brilhoDoSol: 0.22, intensidadeEstrelas: 0.55, noite: 0.62, intensidadeLua: 0.62, intensidadeCenica: 0.88 }],
  [-1.5, { densidadeNeblina: 0.0025, exposicao: 1.14, brilhoDoSol: 0.85, intensidadeEstrelas: 0.08, noite: 0.20, intensidadeLua: 0.20, intensidadeCenica: 0.45 }],
  [0,    { densidadeNeblina: 0.0026, exposicao: 1.10, brilhoDoSol: 1.35, intensidadeEstrelas: 0,    noite: 0.10, intensidadeLua: 0.10, intensidadeCenica: 0.30 }],
  [2,    { densidadeNeblina: 0.0025, exposicao: 1.06, brilhoDoSol: 1.35, intensidadeEstrelas: 0,    noite: 0.03, intensidadeLua: 0,    intensidadeCenica: 0.15 }],
  [6,    { densidadeNeblina: 0.00195, exposicao: 1.03, brilhoDoSol: 1.25, intensidadeEstrelas: 0,    noite: 0,    intensidadeLua: 0,    intensidadeCenica: 0 }],
  [14,   { densidadeNeblina: 0.00140, exposicao: 1.00, brilhoDoSol: 1.14, intensidadeEstrelas: 0,    noite: 0,    intensidadeLua: 0,    intensidadeCenica: 0 }],
  [22,   { densidadeNeblina: 0.00100, exposicao: 0.98, brilhoDoSol: 1.05, intensidadeEstrelas: 0,    noite: 0,    intensidadeLua: 0,    intensidadeCenica: 0 }],
  [38,   { densidadeNeblina: 0.00070, exposicao: 0.95, brilhoDoSol: 1.00, intensidadeEstrelas: 0,    noite: 0,    intensidadeLua: 0,    intensidadeCenica: 0 }],
  [90,   { densidadeNeblina: 0.00050, exposicao: 0.92, brilhoDoSol: 1.00, intensidadeEstrelas: 0,    noite: 0,    intensidadeLua: 0,    intensidadeCenica: 0 }],
]

/** Hex '#rrggbb' → [r, g, b] em 0–255. */
function lerHex(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const paraHex = (r: number, g: number, b: number): string =>
  '#' +
  ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b))
    .toString(16)
    .slice(1)

/**
 * Mistura duas cores no quadrado do valor (γ ≈ 2) em vez de direto em sRGB.
 * Sem isso o meio do caminho entre o laranja do poente e o azul do zênite sai
 * cinza-barro; com isso, a transição mantém saturação.
 */
function misturarCor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = lerHex(a)
  const [br, bg, bb] = lerHex(b)
  const mix = (x: number, y: number) => Math.sqrt(x * x + (y * y - x * x) * t)
  return paraHex(mix(ar, br), mix(ag, bg), mix(ab, bb))
}

const misturar = (a: number, b: number, t: number): number => a + (b - a) * t

/** Índice e fator de interpolação do par de quadros que cerca `altitude`. */
function fatia(quadros: Array<[number, unknown]>, altitude: number): { i: number; t: number } {
  if (altitude <= quadros[0][0]) return { i: 0, t: 0 }
  const ultimo = quadros.length - 1
  if (altitude >= quadros[ultimo][0]) return { i: ultimo - 1, t: 1 }
  let i = 0
  while (i < ultimo - 1 && altitude > quadros[i + 1][0]) i += 1
  const a = quadros[i][0]
  const b = quadros[i + 1][0]
  return { i, t: (altitude - a) / (b - a) }
}

/**
 * Paleta do céu para uma altitude solar em graus: do azul profundo do
 * meio-dia equatorial ao laranja do poente e ao azul-noite.
 */
export function coresDoCeu(altitude: number): CoresDoCeu {
  const { i, t } = fatia(QUADROS_COR, altitude)
  const a = QUADROS_COR[i][1]
  const b = QUADROS_COR[i + 1][1]
  return {
    topo: misturarCor(a.topo, b.topo, t),
    horizonte: misturarCor(a.horizonte, b.horizonte, t),
    sol: misturarCor(a.sol, b.sol, t),
    neblina: misturarCor(a.neblina, b.neblina, t),
    intensidadeSol: misturar(a.intensidadeSol, b.intensidadeSol, t),
    intensidadeAmbiente: misturar(a.intensidadeAmbiente, b.intensidadeAmbiente, t),
  }
}

/** Neblina, exposição, estrelas, lua e luz cênica para a mesma altitude. */
export function parametrosDoCeu(altitude: number): ParametrosDoCeu {
  const { i, t } = fatia(QUADROS_PARAM, altitude)
  const a = QUADROS_PARAM[i][1]
  const b = QUADROS_PARAM[i + 1][1]
  return {
    densidadeNeblina: misturar(a.densidadeNeblina, b.densidadeNeblina, t),
    exposicao: misturar(a.exposicao, b.exposicao, t),
    brilhoDoSol: misturar(a.brilhoDoSol, b.brilhoDoSol, t),
    intensidadeEstrelas: misturar(a.intensidadeEstrelas, b.intensidadeEstrelas, t),
    noite: misturar(a.noite, b.noite, t),
    intensidadeLua: misturar(a.intensidadeLua, b.intensidadeLua, t),
    intensidadeCenica: misturar(a.intensidadeCenica, b.intensidadeCenica, t),
  }
}

/** Cor do rebatimento do terreno/pódio — entra no chão da luz hemisférica. */
export const COR_DO_CHAO = '#6f6454'
