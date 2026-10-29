/**
 * Ferramentas de geometria da cena do Flat Premium II. Sem JSX.
 *
 * Duas regras governam a frente inteira, as mesmas do Village One:
 *   1. tudo que repete vira InstancedMesh;
 *   2. tudo que não repete mas compartilha material vira geometria mesclada.
 *
 * Este módulo é próprio do empreendimento de propósito. Ele poderia importar
 * `src/scene/building/util.ts`, mas aquela frente é de outra equipe e de outro
 * prédio: acoplar as duas faria uma mudança lá quebrar a arquitetura daqui.
 * O vocabulário é o mesmo — quem leu um lê o outro — e o que é específico
 * deste prédio (o arco da quina, o cabo com flecha, a letra vertical) só
 * existe aqui.
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type Vec3 = readonly [number, number, number]

/** Marca para as outras frentes: estas malhas são cenário, não alvo de clique. */
export const cenario = (): Record<string, boolean> => ({ naoInterativo: true })

export function semRaycast(_r: THREE.Raycaster, _i: THREE.Intersection[]): void {
  /* cenário não participa de raycast */
}

/* ------------------------------------------------------------ aleatório --- */

/** Hash determinístico em [0,1). Mesma entrada, mesmo resultado, sempre. */
export function hash(...valores: number[]): number {
  let h = 2166136261
  for (const n of valores) {
    h = Math.imul(h ^ Math.round(n * 1973), 16777619)
    h ^= h >>> 15
  }
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

/** Variação simétrica determinística em [-amp, amp]. */
export const jitter = (amp: number, ...sementes: number[]): number =>
  (hash(...sementes) - 0.5) * 2 * amp

/* ------------------------------------------------------------ geometria --- */

export interface CaixaOp {
  rx?: number
  ry?: number
  rz?: number
  /** Metros que uma volta da textura cobre. Dá escala real ao mapa. */
  uv?: number
}

/**
 * Reescala as UVs de uma BoxGeometry para metros de mundo, face por face.
 * Sem isso o reboco de uma empena de 34 m teria o mesmo grão de um montante
 * de 6 cm.
 */
function uvMundo(g: THREE.BufferGeometry, w: number, h: number, d: number, esc: number): void {
  const uv = g.getAttribute('uv')
  const faces: Array<[number, number, number]> = [
    [0, d, h],
    [4, d, h],
    [8, w, d],
    [12, w, d],
    [16, w, h],
    [20, w, h],
  ]
  for (const [inicio, su, sv] of faces) {
    for (let i = inicio; i < inicio + 4; i++) {
      uv.setXY(i, uv.getX(i) * (su / esc), uv.getY(i) * (sv / esc))
    }
  }
  uv.needsUpdate = true
}

export function caixa(
  w: number,
  h: number,
  d: number,
  p: Vec3 = [0, 0, 0],
  op: CaixaOp = {},
): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d)
  if (op.uv) uvMundo(g, w, h, d, op.uv)
  if (op.rx) g.rotateX(op.rx)
  if (op.ry) g.rotateY(op.ry)
  if (op.rz) g.rotateZ(op.rz)
  g.translate(p[0], p[1], p[2])
  return g
}

/** Caixa por limites no mundo — mais legível para massas de edifício. */
export function bloco(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  uv = 4,
): THREE.BufferGeometry {
  return caixa(x1 - x0, y1 - y0, z1 - z0, [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], { uv })
}

/** Plano horizontal voltado para cima, com UVs em metros. */
export function piso(w: number, d: number, p: Vec3, esc = 4): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(w, d)
  const uv = g.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / esc), uv.getY(i) * (d / esc))
  uv.needsUpdate = true
  g.rotateX(-Math.PI / 2)
  g.translate(p[0], p[1], p[2])
  return g
}

/** Plano vertical. `giroY` = 0 olha para +Z. `esc` = 0 mantém a UV unitária. */
export function painel(
  w: number,
  h: number,
  p: Vec3,
  giroY = 0,
  esc = 0,
): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(w, h)
  if (esc) {
    const uv = g.getAttribute('uv')
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / esc), uv.getY(i) * (h / esc))
    uv.needsUpdate = true
  }
  if (giroY) g.rotateY(giroY)
  g.translate(p[0], p[1], p[2])
  return g
}

export function cilindro(
  raioTopo: number,
  raioBase: number,
  altura: number,
  lados: number,
  p: Vec3 = [0, 0, 0],
  op: CaixaOp = {},
): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(raioTopo, raioBase, altura, lados, 1, false)
  if (op.rx) g.rotateX(op.rx)
  if (op.ry) g.rotateY(op.ry)
  if (op.rz) g.rotateZ(op.rz)
  g.translate(p[0], p[1], p[2])
  return g
}

export function esferaAchatada(
  raio: number,
  achatar: number,
  segmentos: number,
  p: Vec3 = [0, 0, 0],
): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(raio, segmentos, Math.max(3, Math.round(segmentos * 0.6)))
  g.scale(1, achatar, 1)
  g.translate(p[0], p[1], p[2])
  return g
}

/* --------------------------------------------------------- a quina curva --- */

/**
 * Casca de arco vertical: um trecho de cilindro oco, usado na aleta curva da
 * quina (a que carrega o letreiro) e na marquise que a acompanha.
 *
 * `a0`/`a1` em radianos no plano XZ, medidos como `atan2(x - cx, z - cz)` —
 * mesma convenção do resto do arquivo: ângulo 0 aponta para +Z, +π/2 para +X.
 */
export function arcoVertical(
  centro: [number, number],
  raio: number,
  espessura: number,
  y0: number,
  y1: number,
  a0: number,
  a1: number,
  segmentos: number,
): THREE.BufferGeometry {
  const re = raio + espessura / 2
  const ri = raio - espessura / 2
  const pos: number[] = []
  const nor: number[] = []
  const uv: number[] = []
  const idx: number[] = []

  const ponto = (r: number, a: number): [number, number] => [
    centro[0] + Math.sin(a) * r,
    centro[1] + Math.cos(a) * r,
  ]

  // 4 faixas: externa, interna, topo e base. Cada uma é um quad strip.
  const faixas: Array<{ r: number; sinal: number; tipo: 'lateral' | 'horizontal'; y: number }> = [
    { r: re, sinal: 1, tipo: 'lateral', y: 0 },
    { r: ri, sinal: -1, tipo: 'lateral', y: 0 },
    { r: 0, sinal: 1, tipo: 'horizontal', y: y1 },
    { r: 0, sinal: -1, tipo: 'horizontal', y: y0 },
  ]

  for (const f of faixas) {
    const base = pos.length / 3
    for (let i = 0; i <= segmentos; i++) {
      const t = i / segmentos
      const a = a0 + (a1 - a0) * t
      const compr = raio * Math.abs(a1 - a0) * t
      if (f.tipo === 'lateral') {
        const [x, z] = ponto(f.r, a)
        const nx = Math.sin(a) * f.sinal
        const nz = Math.cos(a) * f.sinal
        pos.push(x, y0, z, x, y1, z)
        nor.push(nx, 0, nz, nx, 0, nz)
        uv.push(compr, 0, compr, y1 - y0)
      } else {
        const [xe, ze] = ponto(re, a)
        const [xi, zi] = ponto(ri, a)
        pos.push(xi, f.y, zi, xe, f.y, ze)
        nor.push(0, f.sinal, 0, 0, f.sinal, 0)
        uv.push(compr, 0, compr, espessura)
      }
      if (i < segmentos) {
        const k = base + i * 2
        if (f.sinal > 0) idx.push(k, k + 1, k + 3, k, k + 3, k + 2)
        else idx.push(k, k + 3, k + 1, k, k + 2, k + 3)
      }
    }
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  return g
}

/** Anel horizontal (marquise em planta curva): só a face de baixo e a de cima. */
export function arcoHorizontal(
  centro: [number, number],
  r0: number,
  r1: number,
  y0: number,
  y1: number,
  a0: number,
  a1: number,
  segmentos: number,
): THREE.BufferGeometry {
  return arcoVertical(centro, (r0 + r1) / 2, r1 - r0, y0, y1, a0, a1, segmentos)
}

/* ----------------------------------------------------------------- cabo --- */

/**
 * Cabo aéreo entre dois pontos, com flecha (a barriga que o peso faz). É o
 * que mais depressa diz "bairro baixo brasileiro" na silhueta — por isso
 * ganha uma função própria em vez de virar um segmento reto.
 */
export function cabo(
  a: Vec3,
  b: Vec3,
  flecha: number,
  raio: number,
  segmentos: number,
): THREE.BufferGeometry[] {
  const partes: THREE.BufferGeometry[] = []
  let ax = a[0]
  let ay = a[1]
  let az = a[2]
  for (let i = 1; i <= segmentos; i++) {
    const t = i / segmentos
    const bx = a[0] + (b[0] - a[0]) * t
    const bz = a[2] + (b[2] - a[2]) * t
    // parábola normalizada: 0 nas pontas, 1 no meio
    const by = a[1] + (b[1] - a[1]) * t - flecha * 4 * t * (1 - t)
    const dx = bx - ax
    const dy = by - ay
    const dz = bz - az
    const comp = Math.hypot(dx, dy, dz)
    const g = new THREE.CylinderGeometry(raio, raio, comp, 4, 1, true)
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(dx, dy, dz).normalize(),
    )
    g.applyQuaternion(q)
    g.translate((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2)
    partes.push(g)
    ax = bx
    ay = by
    az = bz
  }
  return partes
}

/* -------------------------------------------------------------- mesclar --- */

/** Mescla e descarta as partes. Lança se as geometrias não forem compatíveis. */
export function mesclar(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geos.length === 1) {
    geos[0].computeBoundingSphere()
    return geos[0]
  }
  const g = mergeGeometries(geos, false)
  for (const parte of geos) parte.dispose()
  if (!g) throw new Error('mesclagem de geometrias falhou: atributos incompatíveis')
  g.computeBoundingSphere()
  return g
}

/** Mescla, mas aceita lista vazia: devolve um ponto invisível. */
export const mesclarOuVazio = (geos: THREE.BufferGeometry[]): THREE.BufferGeometry =>
  mesclar(geos.length ? geos : [caixa(0.001, 0.001, 0.001)])

/** Transformação de uma instância. Escala e cor são opcionais. */
export interface Transf {
  p: Vec3
  r?: Vec3
  s?: Vec3
  cor?: THREE.ColorRepresentation
}

/* -------------------------------------------------------------- intervalo --- */

export interface Intervalo {
  a: number
  b: number
}

/** Complemento de uma lista de intervalos dentro de [min, max]. */
export function complemento(vaos: Intervalo[], min: number, max: number): Intervalo[] {
  const ordem = [...vaos].sort((p, q) => p.a - q.a)
  const saida: Intervalo[] = []
  let cursor = min
  for (const v of ordem) {
    if (v.a > cursor + 1e-6) saida.push({ a: cursor, b: v.a })
    cursor = Math.max(cursor, v.b)
  }
  if (max > cursor + 1e-6) saida.push({ a: cursor, b: max })
  return saida
}
