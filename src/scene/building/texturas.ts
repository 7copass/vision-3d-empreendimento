/**
 * Texturas procedurais desenhadas em canvas. Nenhum asset externo, nenhum download.
 * Cada textura é gerada na primeira vez que um material pede e fica em cache
 * pelo resto da sessão — as malhas do complexo compartilham as mesmas instâncias.
 */
import * as THREE from 'three'

const CACHE = new Map<string, THREE.Texture>()

/**
 * Resolução padrão. Baixa de propósito: as UVs são reescaladas para metros de
 * mundo, então uma volta da textura cobre 2–6 m — 256 px dão 40–120 px/m, mais
 * do que a tela resolve. Gerar tudo custa ~0,2 s uma única vez por sessão.
 */
const RES = 256
const RES_FINA = 256
/** Materiais de fundo — grama, asfalto, estuque do entorno — pedem menos. */
const RES_FUNDO = 128

/**
 * Resolução por textura. Fica aqui, e não espalhada nos geradores, porque é
 * uma decisão de orçamento: gerar tudo acontece uma vez por sessão e o custo
 * total precisa caber no tempo entre o primeiro paint e o primeiro frame 3D.
 */
const RES_POR_CHAVE: Record<string, number> = {
  'concreto-rug': RES_FUNDO,
  'concreto-escuro': RES_FUNDO,
  'grama-mapa': RES_FUNDO,
  'terra-mapa': RES_FUNDO,
  'folhagem-mapa': RES_FUNDO,
  'asfalto-mapa': RES_FUNDO,
  'asfalto-normal': RES_FUNDO,
  'calcada-mapa': RES_FUNDO,
  'borracha-mapa': RES_FUNDO,
  'estuque-mapa': RES_FUNDO,
  'telhado-mapa': RES_FUNDO,
  'pedra-normal': RES_FUNDO,
  'deck-normal': RES_FUNDO,
  'agua-normal': RES_FUNDO,
}

interface Opcoes {
  res?: number
  repeticao?: [number, number]
  /** Mapas de dado (normal, rugosidade, alfa) não passam por sRGB. */
  linear?: boolean
}

const b255 = (n: number): number => (n < 0 ? 0 : n > 255 ? 255 : Math.round(n))
const fract = (n: number): number => n - Math.floor(n)
const mix = (a: number, b: number, t: number): number => a + (b - a) * t
const sat = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n)

type Cor3 = [number, number, number]

const mixCor = (a: Cor3, b: Cor3, t: number): Cor3 => [
  mix(a[0], b[0], t),
  mix(a[1], b[1], t),
  mix(a[2], b[2], t),
]

function contexto(res: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = res
  canvas.height = res
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('contexto 2d indisponível')
  return { canvas, ctx }
}

function textura(
  chave: string,
  pintar: (ctx: CanvasRenderingContext2D, res: number) => void,
  op: Opcoes = {},
): THREE.Texture {
  const pronta = CACHE.get(chave)
  if (pronta) return pronta
  const res = RES_POR_CHAVE[chave] ?? op.res ?? RES
  const { canvas, ctx } = contexto(res)
  pintar(ctx, res)
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  const [rx, ry] = op.repeticao ?? [1, 1]
  t.repeat.set(rx, ry)
  t.colorSpace = op.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace
  t.anisotropy = 8
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.needsUpdate = true
  CACHE.set(chave, t)
  return t
}

/* ---------------------------------------------------------------- ruído --- */

/** Hash inteiro periódico — rápido e sem seams na repetição. */
function latice(x: number, y: number, periodo: number, semente: number): number {
  const px = ((x % periodo) + periodo) % periodo
  const py = ((y % periodo) + periodo) % periodo
  let h = Math.imul(px | 0, 374761393) + Math.imul(py | 0, 668265263) + Math.imul(semente | 0, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967295
}

const suavizar = (t: number): number => t * t * (3 - 2 * t)

function valor(x: number, y: number, periodo: number, semente: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const u = suavizar(x - xi)
  const v = suavizar(y - yi)
  const a = latice(xi, yi, periodo, semente)
  const b = latice(xi + 1, yi, periodo, semente)
  const c = latice(xi, yi + 1, periodo, semente)
  const d = latice(xi + 1, yi + 1, periodo, semente)
  return mix(mix(a, b, u), mix(c, d, u), v)
}

/** Ruído fractal tileável no intervalo [0,1). */
export function fbm(u: number, v: number, celulas: number, oitavas = 3, semente = 1): number {
  let soma = 0
  let amp = 0.5
  let f = 1
  let norma = 0
  for (let i = 0; i < oitavas; i++) {
    soma += amp * valor(u * celulas * f, v * celulas * f, celulas * f, semente + i * 97)
    norma += amp
    f *= 2
    amp *= 0.5
  }
  return soma / norma
}

function pixels(
  ctx: CanvasRenderingContext2D,
  res: number,
  cor: (u: number, v: number) => Cor3,
): void {
  const img = ctx.createImageData(res, res)
  const d = img.data
  for (let y = 0; y < res; y++) {
    const v = y / res
    for (let x = 0; x < res; x++) {
      const i = (y * res + x) * 4
      const c = cor(x / res, v)
      d[i] = b255(c[0])
      d[i + 1] = b255(c[1])
      d[i + 2] = b255(c[2])
      d[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
}

/** Converte um campo de altura em normal map tangente, com wrap nas bordas. */
function normalDeAltura(
  chave: string,
  altura: (u: number, v: number) => number,
  forca: number,
  res = RES,
): THREE.Texture {
  return textura(
    chave,
    (ctx, r) => {
      const h = new Float32Array(r * r)
      for (let y = 0; y < r; y++) {
        for (let x = 0; x < r; x++) h[y * r + x] = altura(x / r, y / r)
      }
      const img = ctx.createImageData(r, r)
      const d = img.data
      for (let y = 0; y < r; y++) {
        const ym = (y - 1 + r) % r
        const yp = (y + 1) % r
        for (let x = 0; x < r; x++) {
          const xm = (x - 1 + r) % r
          const xp = (x + 1) % r
          const dx = (h[y * r + xp] - h[y * r + xm]) * forca
          const dy = (h[yp * r + x] - h[ym * r + x]) * forca
          const len = Math.hypot(dx, dy, 1)
          const i = (y * r + x) * 4
          d[i] = b255((-dx / len * 0.5 + 0.5) * 255)
          d[i + 1] = b255((-dy / len * 0.5 + 0.5) * 255)
          d[i + 2] = b255((1 / len * 0.5 + 0.5) * 255)
          d[i + 3] = 255
        }
      }
      ctx.putImageData(img, 0, 0)
    },
    { res, linear: true },
  )
}

/* ------------------------------------------------------------ concreto --- */

const alturaConcreto = (u: number, v: number): number => {
  const n = fbm(u, v, 7, 3, 3)
  const grao = fbm(u, v, 46, 2, 9)
  const formas = Math.abs(fract(v * 6) - 0.5) < 0.03 ? -0.45 : 0
  return n * 0.6 + grao * 0.3 + formas
}

export const concretoMapa = (): THREE.Texture =>
  textura(
    'concreto-mapa',
    (ctx, r) =>
      pixels(ctx, r, (u, v) => {
        const n = fbm(u, v, 6, 3, 3)
        const grao = fbm(u, v, 44, 2, 9)
        const mancha = Math.pow(fbm(u, v, 2.2, 2, 21), 3.2)
        const junta = Math.abs(fract(v * 6) - 0.5) < 0.028 ? -10 : 0
        const base = 205 + (n - 0.5) * 20 + (grao - 0.5) * 11 - mancha * 30 + junta
        return [base + 4, base + 1, base - 5]
      }),
    { res: RES_FINA },
  )

export const concretoNormal = (): THREE.Texture =>
  normalDeAltura('concreto-normal', alturaConcreto, 1.6)

export const concretoRugosidade = (): THREE.Texture =>
  textura(
    'concreto-rug',
    (ctx, r) =>
      pixels(ctx, r, (u, v) => {
        const n = fbm(u, v, 9, 3, 31)
        const g = fbm(u, v, 40, 2, 13)
        const t = 186 + (n - 0.5) * 52 + (g - 0.5) * 24
        return [t, t, t]
      }),
    { linear: true },
  )

/** Concreto aparente escuro do embasamento e do núcleo. */
export const concretoEscuroMapa = (): THREE.Texture =>
  textura('concreto-escuro', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const n = fbm(u, v, 6, 3, 55)
      const grao = fbm(u, v, 40, 2, 71)
      const base = 104 + (n - 0.5) * 26 + (grao - 0.5) * 12
      return [base + 2, base + 1, base - 2]
    }),
  )

/* ---------------------------------------------------------------- pedra --- */

export const pedraMapa = (): THREE.Texture =>
  textura(
    'pedra-mapa',
    (ctx, r) =>
      pixels(ctx, r, (u, v) => {
        const colunas = 3
        const linhas = 6
        const cu = fract(u * colunas)
        const cv = fract(v * linhas)
        const tom = latice(Math.floor(u * colunas), Math.floor(v * linhas), 97, 5)
        const veio = fbm(u * 0.9, v * 4.5, 10, 3, 17)
        const poro = fbm(u, v, 60, 2, 29)
        const juntaU = cu < 0.012 || cu > 0.988
        const juntaV = cv < 0.02 || cv > 0.98
        const claro: Cor3 = [222, 213, 196]
        const escuro: Cor3 = [189, 176, 154]
        let c = mixCor(claro, escuro, sat(veio * 0.9 + tom * 0.25))
        c = [c[0] + (poro - 0.5) * 9, c[1] + (poro - 0.5) * 9, c[2] + (poro - 0.5) * 8]
        if (juntaU || juntaV) c = mixCor(c, [132, 124, 110], 0.75)
        return c
      }),
    { res: RES_FINA },
  )

export const pedraNormal = (): THREE.Texture =>
  normalDeAltura(
    'pedra-normal',
    (u, v) => {
      const cu = fract(u * 3)
      const cv = fract(v * 6)
      const junta = cu < 0.012 || cu > 0.988 || cv < 0.02 || cv > 0.98 ? -0.7 : 0
      return fbm(u, v, 42, 2, 29) * 0.35 + junta
    },
    1.4,
  )

/* -------------------------------------------------------------- madeira --- */

const CLARA: Cor3 = [147, 102, 62]
const ESCURA: Cor3 = [96, 59, 33]

export const madeiraMapa = (): THREE.Texture =>
  textura('madeira-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const deriva = fbm(u, v * 0.18, 4, 2, 41)
      const anel = 0.5 + 0.5 * Math.sin((u * 13 + deriva * 5) * Math.PI * 2)
      const fibra = fbm(u * 1.4, v, 70, 2, 47)
      const no = Math.pow(fbm(u, v, 3, 2, 59), 7) * 2.4
      const t = sat(anel * 0.62 + fibra * 0.22 + no)
      const c = mixCor(CLARA, ESCURA, t)
      return [c[0] + (fibra - 0.5) * 10, c[1] + (fibra - 0.5) * 8, c[2] + (fibra - 0.5) * 6]
    }),
  )

export const madeiraNormal = (): THREE.Texture =>
  normalDeAltura(
    'madeira-normal',
    (u, v) => {
      const deriva = fbm(u, v * 0.18, 4, 2, 41)
      const anel = 0.5 + 0.5 * Math.sin((u * 13 + deriva * 5) * Math.PI * 2)
      return anel * 0.4 + fbm(u * 1.4, v, 64, 2, 47) * 0.6
    },
    1.1,
  )

/** Deck de madeira: réguas com junta seca. */
export const deckMapa = (): THREE.Texture =>
  textura('deck-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const reguas = 7
      const idx = Math.floor(v * reguas)
      const dentro = fract(v * reguas)
      const junta = dentro < 0.055 || dentro > 0.945
      const tom = latice(idx, 3, 53, 11)
      const deriva = fbm(u, idx * 0.37, 5, 2, 61)
      const anel = 0.5 + 0.5 * Math.sin((u * 9 + deriva * 4) * Math.PI * 2)
      const t = sat(anel * 0.5 + tom * 0.4)
      let c = mixCor([158, 116, 74], [107, 70, 42], t)
      if (junta) c = mixCor(c, [44, 30, 20], 0.82)
      return c
    }),
  )

export const deckNormal = (): THREE.Texture =>
  normalDeAltura(
    'deck-normal',
    (u, v) => {
      const dentro = fract(v * 7)
      const junta = dentro < 0.055 || dentro > 0.945 ? -1 : 0
      return fbm(u, v, 30, 2, 61) * 0.3 + junta
    },
    2.2,
  )

/* ----------------------------------------------------------- paisagismo --- */

export const gramaMapa = (): THREE.Texture =>
  textura('grama-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const largo = fbm(u, v, 4, 2, 77)
      const fino = fbm(u, v, 56, 2, 83)
      const tufo = fbm(u, v, 18, 2, 89)
      const t = sat(largo * 0.45 + fino * 0.35 + tufo * 0.2)
      const c = mixCor([74, 104, 52], [112, 142, 72], t)
      return [c[0], c[1], c[2] + (fino - 0.5) * 8]
    }),
  )

export const terraMapa = (): THREE.Texture =>
  textura('terra-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const n = fbm(u, v, 5, 2, 101)
      const f = fbm(u, v, 48, 2, 103)
      const c = mixCor([128, 110, 88], [158, 140, 112], sat(n * 0.7 + f * 0.3))
      return c
    }),
  )

export const folhagemMapa = (): THREE.Texture =>
  textura('folhagem-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const n = fbm(u, v, 9, 2, 113)
      const f = fbm(u, v, 34, 2, 127)
      const c = mixCor([38, 72, 40], [92, 130, 62], sat(n * 0.65 + f * 0.35))
      return c
    }),
  )

/* --------------------------------------------------------- pavimentação --- */

export const asfaltoMapa = (): THREE.Texture =>
  textura('asfalto-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const n = fbm(u, v, 7, 2, 131)
      const brita = fbm(u, v, 62, 2, 137)
      const remendo = Math.pow(fbm(u, v, 2.5, 2, 139), 4) * 18
      const base = 54 + (n - 0.5) * 16 + (brita - 0.5) * 26 + remendo
      return [base, base + 1, base + 3]
    }),
  )

export const asfaltoNormal = (): THREE.Texture =>
  normalDeAltura('asfalto-normal', (u, v) => fbm(u, v, 58, 2, 137), 1.3)

export const calcadaMapa = (): THREE.Texture =>
  textura('calcada-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const n = 5
      const cu = fract(u * n)
      const cv = fract(v * n)
      const tom = latice(Math.floor(u * n), Math.floor(v * n), 71, 7)
      const poro = fbm(u, v, 50, 2, 149)
      const junta = cu < 0.03 || cu > 0.97 || cv < 0.03 || cv > 0.97
      let base = 176 + (tom - 0.5) * 18 + (poro - 0.5) * 14
      if (junta) base -= 34
      return [base + 2, base + 1, base - 3]
    }),
  )

/* ------------------------------------------------------ cobogó e brises --- */

/** Alfa do cobogó: branco é cheio, preto é vazado. */
export const cobogoAlfa = (): THREE.Texture =>
  textura(
    'cobogo-alfa',
    (ctx, r) => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, r, r)
      ctx.fillStyle = '#000000'
      const n = 5
      const passo = r / n
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const cx = (i + 0.5) * passo
          const cy = (j + 0.5) * passo
          ctx.beginPath()
          ctx.ellipse(cx, cy, passo * 0.31, passo * 0.31, 0, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    },
    { linear: true },
  )

/** Alfa da veneziana: lâminas horizontais com fresta. */
export const venezianaAlfa = (): THREE.Texture =>
  textura(
    'veneziana-alfa',
    (ctx, r) => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, r, r)
      ctx.fillStyle = '#000000'
      const n = 12
      const passo = r / n
      for (let i = 0; i < n; i++) ctx.fillRect(0, i * passo + passo * 0.62, r, passo * 0.3)
    },
    { linear: true },
  )

/* ----------------------------------------------------------------- água --- */

const alturaAgua = (u: number, v: number): number =>
  0.5 +
  0.22 * Math.sin((u * 11 + Math.sin(v * 7 * Math.PI * 2) * 0.35) * Math.PI * 2) +
  0.16 * Math.sin((v * 9 - u * 3) * Math.PI * 2) +
  0.12 * fbm(u, v, 14, 2, 151)

export const aguaNormal = (): THREE.Texture => normalDeAltura('agua-normal', alturaAgua, 1.1)

/* ------------------------------------------------------------- esportes --- */

/** Quadra poliesportiva com marcação. Textura única, não repete. */
export const quadraMapa = (): THREE.Texture =>
  textura(
    'quadra-mapa',
    (ctx, r) => {
      const g = ctx.createLinearGradient(0, 0, 0, r)
      g.addColorStop(0, '#2f6b63')
      g.addColorStop(1, '#27584f')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, r, r)
      // granulado do piso esportivo
      const img = ctx.getImageData(0, 0, r, r)
      const d = img.data
      for (let y = 0; y < r; y++) {
        for (let x = 0; x < r; x++) {
          const i = (y * r + x) * 4
          const n = (latice(x, y, 211, 17) - 0.5) * 18
          d[i] = b255(d[i] + n)
          d[i + 1] = b255(d[i + 1] + n)
          d[i + 2] = b255(d[i + 2] + n)
        }
      }
      ctx.putImageData(img, 0, 0)
      ctx.strokeStyle = 'rgba(240,238,230,0.88)'
      ctx.lineWidth = Math.max(2, r / 150)
      const m = r * 0.07
      ctx.strokeRect(m, m, r - m * 2, r - m * 2)
      ctx.beginPath()
      ctx.moveTo(m, r / 2)
      ctx.lineTo(r - m, r / 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(r / 2, r / 2, r * 0.16, r * 0.16, 0, 0, Math.PI * 2)
      ctx.stroke()
      for (const y of [m, r - m]) {
        ctx.beginPath()
        ctx.ellipse(r / 2, y, r * 0.2, r * 0.2, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.strokeRect(r * 0.3, m, r * 0.4, r * 0.16)
      ctx.strokeRect(r * 0.3, r - m - r * 0.16, r * 0.4, r * 0.16)
    },
    { res: RES_FINA },
  )

/** Piso amortecedor do playground. */
export const pisoBorrachaMapa = (): THREE.Texture =>
  textura('borracha-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const n = fbm(u, v, 40, 2, 173)
      const campo = fbm(u, v, 3, 2, 179)
      const c = mixCor([150, 86, 62], [176, 118, 84], sat(campo * 0.6 + n * 0.4))
      return c
    }),
  )

/* ------------------------------------------------------------- entorno --- */

export const estuqueMapa = (): THREE.Texture =>
  textura('estuque-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const n = fbm(u, v, 5, 2, 191)
      const f = fbm(u, v, 44, 2, 193)
      const sujeira = Math.pow(v, 3) * 22
      const base = 206 + (n - 0.5) * 24 + (f - 0.5) * 12 - sujeira
      return [base, base - 2, base - 7]
    }),
  )

export const telhadoMapa = (): THREE.Texture =>
  textura('telhado-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const fileiras = 9
      const cv = fract(v * fileiras)
      const onda = Math.sin(fract(u * 26) * Math.PI)
      const tom = latice(Math.floor(u * 26), Math.floor(v * fileiras), 83, 23)
      let c = mixCor([132, 70, 48], [172, 100, 68], sat(onda * 0.55 + tom * 0.45))
      if (cv < 0.06) c = mixCor(c, [70, 40, 30], 0.6)
      return c
    }),
  )

/* ------------------------------------------------------- céu de reflexo --- */

/**
 * Mapa equirretangular de reflexo, só para o vidro, a água e os metais.
 * É um gradiente — zênite, horizonte, chão — parametrizado pelo fator de noite
 * (0 = dia, 1 = noite fechada), e não tem sol marcado de propósito: o sol de
 * verdade é da frente de luz, e um sol pintado aqui brigaria com ele. Sem isto, `envMapIntensity` não reflete nada e a cortina
 * de vidro das torres fica chapada. Se a frente de luz publicar um
 * `scene.environment`, `aplicarReflexo(null)` devolve o comando para ela.
 */
export function ceuReflexo(noite: number): THREE.Texture {
  // cinco degraus bastam: a intensidade do reflexo varia continuamente por
  // cima disto, e no crepúsculo o vidro já está escuro quando o degrau troca
  const n = Math.max(0, Math.min(1, noite))
  const passo = Math.round(n * 4) / 4

  const ceu = mixCor([78, 122, 186], [10, 16, 30], passo)
  const horizonte = mixCor([206, 224, 234], [30, 40, 56], passo)
  const brilhoUrbano = mixCor([222, 230, 232], [52, 40, 28], passo)
  const chao = mixCor([104, 106, 92], [10, 12, 14], passo)

  const t = textura(
    `ceu-reflexo-${passo}`,
    (ctx, r) =>
      pixels(ctx, r, (_u, v) => {
        if (v < 0.5) {
          // do zênite ao horizonte, com a faixa quente logo acima da linha
          const k = v / 0.5
          const base = mixCor(ceu, horizonte, Math.pow(k, 1.5))
          return mixCor(base, brilhoUrbano, Math.pow(k, 7))
        }
        const k = (v - 0.5) / 0.5
        return mixCor(mixCor(horizonte, chao, 0.55), chao, Math.pow(k, 0.6))
      }),
    { res: 128 },
  )
  t.mapping = THREE.EquirectangularReflectionMapping
  return t
}

/** Libera tudo. Só o integrador chamaria, ao desmontar a cena de vez. */
export function descartarTexturas(): void {
  for (const t of CACHE.values()) t.dispose()
  CACHE.clear()
}
