/**
 * Texturas procedurais do Flat Premium II, desenhadas em canvas. Nenhum asset
 * externo, nenhum download — o tour abre numa call de corretor, muitas vezes
 * em 4G, e esperar textura baixar é esperar demais.
 *
 * Cada textura é gerada na primeira vez que um material pede e fica em cache
 * pelo resto da sessão. As UVs são reescaladas para metros de mundo em
 * `util.ts`, então uma volta cobre 2–6 m: 256 px dão 40–120 px/m, acima do que
 * a tela resolve nesta cena.
 */
import * as THREE from 'three'

const CACHE = new Map<string, THREE.Texture>()

const RES = 256
/** Materiais de fundo — asfalto, estuque do entorno, telha — pedem menos. */
const RES_FUNDO = 128

const RES_POR_CHAVE: Record<string, number> = {
  'asfalto-mapa': RES_FUNDO,
  'asfalto-normal': RES_FUNDO,
  'terra-mapa': RES_FUNDO,
  'grama-mapa': RES_FUNDO,
  'estuque-mapa': RES_FUNDO,
  'telha-mapa': RES_FUNDO,
  'folhagem-mapa': RES_FUNDO,
  'reboco-rug': RES_FUNDO,
  'granilite-mapa': RES_FUNDO,
}

interface Opcoes {
  res?: number
  repeticao?: [number, number]
  /** Mapas de dado (normal, rugosidade, alfa) não passam por sRGB. */
  linear?: boolean
  /** Textura única, que não ladrilha (letreiro, logotipo, quadra). */
  presa?: boolean
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

function contexto(
  w: number,
  h: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
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
  const { canvas, ctx } = contexto(res, res)
  pintar(ctx, res)
  const t = new THREE.CanvasTexture(canvas)
  const envolver = op.presa ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping
  t.wrapS = envolver
  t.wrapT = envolver
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

/** Variante retangular, para o letreiro vertical. */
function texturaRet(
  chave: string,
  w: number,
  h: number,
  pintar: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  linear = false,
): THREE.Texture {
  const pronta = CACHE.get(chave)
  if (pronta) return pronta
  const { canvas, ctx } = contexto(w, h)
  pintar(ctx, w, h)
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = THREE.ClampToEdgeWrapping
  t.wrapT = THREE.ClampToEdgeWrapping
  t.colorSpace = linear ? THREE.NoColorSpace : THREE.SRGBColorSpace
  t.anisotropy = 8
  t.generateMipmaps = true
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.needsUpdate = true
  CACHE.set(chave, t)
  return t
}

/* ---------------------------------------------------------------- ruído --- */

/** Hash inteiro periódico — rápido e sem emenda na repetição. */
function latice(x: number, y: number, periodo: number, semente: number): number {
  const px = ((x % periodo) + periodo) % periodo
  const py = ((y % periodo) + periodo) % periodo
  let h =
    Math.imul(px | 0, 374761393) + Math.imul(py | 0, 668265263) + Math.imul(semente | 0, 1274126177)
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

/** Ruído fractal ladrilhável em [0,1). */
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

/** Converte um campo de altura em normal map tangente, com emenda nas bordas. */
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
          d[i] = b255(((-dx / len) * 0.5 + 0.5) * 255)
          d[i + 1] = b255(((-dy / len) * 0.5 + 0.5) * 255)
          d[i + 2] = b255(((1 / len) * 0.5 + 0.5) * 255)
          d[i + 3] = 255
        }
      }
      ctx.putImageData(img, 0, 0)
    },
    { res, linear: true },
  )
}

/* ------------------------------------------------- reboco pintado branco --- */

/**
 * A fachada inteira é reboco pintado, e é a maior área do quadro. O mapa é
 * quase branco de propósito: a cor sai do material. O que a textura entrega é
 * a mancha larga de pintura e a casca de laranja do rolo — sem elas, 34 m de
 * parede chapam e o prédio vira maquete.
 */
export const rebocoMapa = (): THREE.Texture =>
  textura('reboco-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const mancha = fbm(u, v, 3, 3, 7)
      const casca = fbm(u, v, 52, 2, 23)
      const base = 243 + (mancha - 0.5) * 9 + (casca - 0.5) * 6
      return [base, base - 0.5, base - 2]
    }),
  )

export const rebocoNormal = (): THREE.Texture =>
  normalDeAltura('reboco-normal', (u, v) => fbm(u, v, 56, 2, 23) * 0.5 + fbm(u, v, 9, 2, 7) * 0.5, 0.9)

export const rebocoRugosidade = (): THREE.Texture =>
  textura(
    'reboco-rug',
    (ctx, r) =>
      pixels(ctx, r, (u, v) => {
        const n = fbm(u, v, 7, 3, 31)
        const t = 196 + (n - 0.5) * 34
        return [t, t, t]
      }),
    { linear: true },
  )

/* --------------------------------------------------- pedra escura da base --- */

/**
 * Faixa do térreo: pedra empilhada escura, seca, de peças estreitas e
 * irregulares — o que o render mostra sob as aberturas de garagem. É a única
 * textura do prédio com contraste forte, e é ela que dá peso à base.
 */
export const pedraEscuraMapa = (): THREE.Texture =>
  textura('pedra-escura-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const fiadas = 14
      const linha = Math.floor(v * fiadas)
      const desloca = latice(linha, 3, 29, 11) * 0.5
      const pecas = 7
      const cu = fract(u * pecas + desloca)
      const col = Math.floor(u * pecas + desloca)
      const dentro = fract(v * fiadas)
      const juntaH = dentro < 0.1 || dentro > 0.93
      const juntaV = cu < 0.035 || cu > 0.965
      const tom = latice(col, linha, 61, 17)
      const grao = fbm(u, v, 64, 2, 41)
      const veio = fbm(u * 2.2, v * 6, 11, 2, 53)
      let c = mixCor([28, 29, 31], [86, 85, 82], sat(tom * 0.72 + veio * 0.4))
      c = [c[0] + (grao - 0.5) * 18, c[1] + (grao - 0.5) * 18, c[2] + (grao - 0.5) * 16]
      if (juntaH || juntaV) c = mixCor(c, [14, 14, 15], 0.82)
      return c
    }),
  )

export const pedraEscuraNormal = (): THREE.Texture =>
  normalDeAltura(
    'pedra-escura-normal',
    (u, v) => {
      const fiadas = 14
      const linha = Math.floor(v * fiadas)
      const desloca = latice(linha, 3, 29, 11) * 0.5
      const cu = fract(u * 7 + desloca)
      const dentro = fract(v * fiadas)
      const junta = dentro < 0.1 || dentro > 0.93 || cu < 0.035 || cu > 0.965 ? -1 : 0
      return fbm(u, v, 40, 2, 41) * 0.45 + junta
    },
    2.4,
  )

/* ------------------------------------------------------------- concreto --- */

export const concretoMapa = (): THREE.Texture =>
  textura('concreto-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const n = fbm(u, v, 6, 3, 3)
      const grao = fbm(u, v, 44, 2, 9)
      const mancha = Math.pow(fbm(u, v, 2.2, 2, 21), 3.2)
      const base = 198 + (n - 0.5) * 18 + (grao - 0.5) * 10 - mancha * 26
      return [base + 3, base + 1, base - 4]
    }),
  )

export const concretoNormal = (): THREE.Texture =>
  normalDeAltura(
    'concreto-normal',
    (u, v) => fbm(u, v, 7, 3, 3) * 0.6 + fbm(u, v, 46, 2, 9) * 0.4,
    1.4,
  )

/** Granilite da varanda e do hall: fundo claro com seixo escuro e claro. */
export const graniliteMapa = (): THREE.Texture =>
  textura('granilite-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const seixo = latice(Math.floor(u * 90), Math.floor(v * 90), 211, 7)
      const fino = fbm(u, v, 70, 2, 19)
      let base = 214 + (fino - 0.5) * 10
      if (seixo > 0.88) base -= 72
      else if (seixo > 0.74) base += 22
      else if (seixo < 0.1) base -= 34
      return [base, base - 1, base - 4]
    }),
  )

/* --------------------------------------------------------- pavimentação --- */

export const asfaltoMapa = (): THREE.Texture =>
  textura('asfalto-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const n = fbm(u, v, 7, 2, 131)
      const brita = fbm(u, v, 62, 2, 137)
      const remendo = Math.pow(fbm(u, v, 2.5, 2, 139), 4) * 20
      const poeira = Math.pow(fbm(u, v, 3.6, 2, 151), 2.4) * 16
      const base = 58 + (n - 0.5) * 16 + (brita - 0.5) * 24 + remendo
      return [base + poeira * 0.9, base + poeira * 0.5, base + 2]
    }),
  )

export const asfaltoNormal = (): THREE.Texture =>
  normalDeAltura('asfalto-normal', (u, v) => fbm(u, v, 58, 2, 137), 1.3)

/** Calçada de placa de concreto, com junta serrada. */
export const calcadaMapa = (): THREE.Texture =>
  textura('calcada-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const n = 4
      const cu = fract(u * n)
      const cv = fract(v * n)
      const tom = latice(Math.floor(u * n), Math.floor(v * n), 71, 7)
      const poro = fbm(u, v, 50, 2, 149)
      const junta = cu < 0.025 || cu > 0.975 || cv < 0.025 || cv > 0.975
      let base = 188 + (tom - 0.5) * 14 + (poro - 0.5) * 12
      if (junta) base -= 40
      return [base + 2, base + 1, base - 3]
    }),
  )

/** Terra batida avermelhada do lote e dos quintais — o chão de Santarém. */
export const terraMapa = (): THREE.Texture =>
  textura('terra-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const n = fbm(u, v, 5, 3, 101)
      const f = fbm(u, v, 46, 2, 103)
      const c = mixCor([132, 76, 48], [178, 122, 84], sat(n * 0.68 + f * 0.32))
      return c
    }),
  )

export const gramaMapa = (): THREE.Texture =>
  textura('grama-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const largo = fbm(u, v, 4, 2, 77)
      const fino = fbm(u, v, 54, 2, 83)
      const tufo = fbm(u, v, 17, 2, 89)
      const t = sat(largo * 0.45 + fino * 0.33 + tufo * 0.22)
      const c = mixCor([76, 98, 50], [124, 146, 74], t)
      return [c[0], c[1], c[2] + (fino - 0.5) * 8]
    }),
  )

/* ------------------------------------------------------------- entorno --- */

/** Reboco das casas vizinhas: mais quente, mais sujo, com escorrido de chuva. */
export const estuqueMapa = (): THREE.Texture =>
  textura('estuque-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const n = fbm(u, v, 5, 2, 191)
      const f = fbm(u, v, 42, 2, 193)
      const escorrido = Math.pow(fbm(u * 10, v * 0.4, 6, 2, 197), 2.2) * Math.pow(v, 1.6) * 44
      const base = 214 + (n - 0.5) * 26 + (f - 0.5) * 12 - escorrido
      return [base, base - 3, base - 10]
    }),
  )

/** Telha cerâmica: as canaletas e o barro desbotado dos telhados em volta. */
export const telhaMapa = (): THREE.Texture =>
  textura('telha-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const fileiras = 8
      const cv = fract(v * fileiras)
      const onda = Math.sin(fract(u * 22) * Math.PI)
      const tom = latice(Math.floor(u * 22), Math.floor(v * fileiras), 83, 23)
      const limo = Math.pow(fbm(u, v, 4, 2, 211), 3) * 40
      let c = mixCor([128, 64, 44], [186, 112, 76], sat(onda * 0.55 + tom * 0.45))
      c = [c[0] - limo, c[1] - limo * 0.5, c[2] - limo * 0.8]
      if (cv < 0.07) c = mixCor(c, [66, 36, 26], 0.6)
      return c
    }),
  )

export const folhagemMapa = (): THREE.Texture =>
  textura('folhagem-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const n = fbm(u, v, 9, 2, 113)
      const f = fbm(u, v, 34, 2, 127)
      return mixCor([34, 66, 34], [96, 132, 58], sat(n * 0.65 + f * 0.35))
    }),
  )

export const madeiraMapa = (): THREE.Texture =>
  textura('madeira-mapa', (ctx, r) =>
    pixels(ctx, r, (u, v) => {
      const deriva = fbm(u, v * 0.18, 4, 2, 41)
      const anel = 0.5 + 0.5 * Math.sin((u * 11 + deriva * 5) * Math.PI * 2)
      const fibra = fbm(u * 1.4, v, 68, 2, 47)
      const t = sat(anel * 0.6 + fibra * 0.24)
      const c = mixCor([176, 132, 86], [124, 82, 48], t)
      return [c[0] + (fibra - 0.5) * 10, c[1] + (fibra - 0.5) * 8, c[2] + (fibra - 0.5) * 6]
    }),
  )

/* --------------------------------------------------------- alfas e sinais --- */

/**
 * Alfa das lâminas do portão de garagem e do brise do térreo: brancas são
 * cheias, pretas vazadas. O render mostra lâminas horizontais com fresta
 * estreita — é por elas que a luz da garagem escapa à noite.
 */
export const lamelaAlfa = (): THREE.Texture =>
  textura(
    'lamela-alfa',
    (ctx, r) => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, r, r)
      ctx.fillStyle = '#000000'
      const n = 16
      const passo = r / n
      for (let i = 0; i < n; i++) ctx.fillRect(0, i * passo + passo * 0.72, r, passo * 0.2)
    },
    { linear: true },
  )

/**
 * Letreiro vertical da quina. Letras em pé, empilhadas de cima para baixo,
 * como no render — não é texto girado 90°, é uma letra por linha.
 *
 * Devolve ALFA: quem pinta é o material, que de dia é alumínio escovado e de
 * noite é emissivo. Assim a mesma textura serve aos dois estados.
 */
export const letreiroAlfa = (): THREE.Texture =>
  texturaRet(
    'letreiro-alfa',
    128,
    2048,
    (ctx, w, h) => {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const linhas = [...'FLAT', ...'PREMIUM']
      const passo = h / (linhas.length + 3.1)
      ctx.font = `600 ${Math.round(passo * 0.78)}px Georgia, "Times New Roman", serif`
      linhas.forEach((ch, i) => {
        if (ch === ' ') return
        ctx.fillText(ch, w / 2, passo * (i + 1.1))
      })
      // o "II" do nome é desenhado como dois traços, que é como o render mostra
      const yII = passo * (linhas.length + 1.9)
      const barra = passo * 0.42
      ctx.fillRect(w / 2 - passo * 0.2, yII - barra / 2, passo * 0.09, barra)
      ctx.fillRect(w / 2 + passo * 0.11, yII - barra / 2, passo * 0.09, barra)
    },
    true,
  )

/**
 * Monograma do coroamento. Marca gráfica genérica — um "S" vazado num anel —
 * no lugar do logotipo da construtora, que não veio em vetor. Mesmo papel na
 * composição: o ponto de brilho no alto da empena escura.
 */
export const logoAlfa = (): THREE.Texture =>
  textura(
    'logo-alfa',
    (ctx, r) => {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, r, r)
      ctx.strokeStyle = '#ffffff'
      ctx.lineCap = 'round'
      ctx.lineWidth = r * 0.055
      // anel aberto
      ctx.beginPath()
      ctx.arc(r / 2, r / 2, r * 0.33, Math.PI * 0.18, Math.PI * 1.72)
      ctx.stroke()
      // "S" inscrito
      ctx.lineWidth = r * 0.085
      ctx.beginPath()
      ctx.arc(r * 0.5, r * 0.41, r * 0.13, Math.PI * 0.1, Math.PI * 1.15)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(r * 0.5, r * 0.62, r * 0.13, Math.PI * 1.1, Math.PI * 2.15)
      ctx.stroke()
    },
    { linear: true, presa: true },
  )

/* ------------------------------------------------------- céu de reflexo --- */

/**
 * Mapa equirretangular de reflexo, só para o vidro, o granito e os metais.
 * É um gradiente — zênite, horizonte, chão — parametrizado pelo fator de
 * noite, e não tem sol marcado de propósito: o sol de verdade é da frente de
 * luz, e um sol pintado aqui brigaria com ele. Sem isto, `envMapIntensity`
 * não reflete nada e as esquadrias e o guarda-corpo ficam chapados.
 */
export function ceuReflexo(noite: number): THREE.Texture {
  const n = Math.max(0, Math.min(1, noite))
  const passo = Math.round(n * 4) / 4

  const ceu = mixCor([78, 122, 186], [10, 16, 30], passo)
  const horizonte = mixCor([206, 224, 234], [30, 40, 56], passo)
  const brilhoUrbano = mixCor([222, 230, 232], [58, 44, 30], passo)
  const chao = mixCor([116, 94, 76], [12, 12, 14], passo)

  const t = textura(
    `ceu-reflexo-${passo}`,
    (ctx, r) =>
      pixels(ctx, r, (_u, v) => {
        if (v < 0.5) {
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
