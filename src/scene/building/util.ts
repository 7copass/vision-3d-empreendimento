/**
 * Ferramentas de geometria, sem JSX. Duas regras governam a frente inteira:
 * 1. tudo que repete vira InstancedMesh;
 * 2. tudo que não repete mas compartilha material vira uma geometria mesclada.
 * É assim que o complexo inteiro fica na casa das poucas dezenas de draw calls.
 *
 * Os componentes que consomem isto estão em Instancias.tsx.
 */
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export type Vec3 = readonly [number, number, number]

/**
 * Marca para as outras frentes: estas malhas são cenário, não alvo de clique.
 * Objeto novo por malha de propósito — se alguma frente escrever em userData,
 * a escrita não deve vazar para o resto da cena.
 */
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
 * Sem isso a textura esticaria conforme o tamanho da caixa, e o concreto de
 * uma laje de 30 m ficaria com o mesmo grão de um pilar de 60 cm.
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

/** Caixa definida por limites no mundo — mais legível para massas de edifício. */
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

export interface Retangulo {
  x0: number
  x1: number
  z0: number
  z1: number
}

export interface Caixa3 {
  x0: number
  x1: number
  y0: number
  y1: number
  z0: number
  z1: number
}

/**
 * Subtrai um retângulo (em planta) de uma lista de caixas, devolvendo caixas.
 * Não existe booleana aqui: um vazio é a ausência de bloco. É o que deixa a
 * piscina atravessar a laje do embasamento até o fundo de 1,6 m, e a piscina
 * privativa da cobertura descer abaixo da laje do terraço.
 */
export function recortar(caixas: Caixa3[], vazio: Retangulo): Caixa3[] {
  const saida: Caixa3[] = []
  for (const c of caixas) {
    const vx0 = Math.max(c.x0, vazio.x0)
    const vx1 = Math.min(c.x1, vazio.x1)
    const vz0 = Math.max(c.z0, vazio.z0)
    const vz1 = Math.min(c.z1, vazio.z1)
    if (vx0 >= vx1 || vz0 >= vz1) {
      saida.push(c)
      continue
    }
    if (c.x0 < vx0) saida.push({ ...c, x1: vx0 })
    if (vx1 < c.x1) saida.push({ ...c, x0: vx1 })
    if (c.z0 < vz0) saida.push({ ...c, x0: vx0, x1: vx1, z1: vz0 })
    if (vz1 < c.z1) saida.push({ ...c, x0: vx0, x1: vx1, z0: vz1 })
  }
  return saida
}

export const emBlocos = (caixas: Caixa3[], uv = 4): THREE.BufferGeometry[] =>
  caixas.map((c) => bloco(c.x0, c.x1, c.y0, c.y1, c.z0, c.z1, uv))

/** Atalho: uma caixa só, com um vazio. */
export function anel(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  vazio: Retangulo,
  uv = 4,
): THREE.BufferGeometry[] {
  return emBlocos(recortar([{ x0, x1, y0, y1, z0, z1 }], vazio), uv)
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

/** Plano vertical. `giroY` = 0 olha para +Z. */
export function painel(w: number, h: number, p: Vec3, giroY = 0, esc = 0): THREE.BufferGeometry {
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

/** Transformação de uma instância. Escala e cor são opcionais. */
export interface Transf {
  p: Vec3
  r?: Vec3
  s?: Vec3
  cor?: THREE.ColorRepresentation
}
