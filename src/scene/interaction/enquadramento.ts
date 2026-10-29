/**
 * Matemática de enquadramento e o barramento imperativo da câmera.
 *
 * O `<Camera />` registra um ouvinte aqui no mount; a UI chama
 * `enquadrarConjunto()` / `enquadrarUnidade(id)` de fora do Canvas sem
 * precisar de ref nem de contexto. Pedido feito antes do mount fica guardado
 * e é entregue quando a câmera aparece.
 */
import { MathUtils, Vector3 } from 'three'
import { ALTURA_COROAMENTO, PODIUM, TORRES, varandaDaUnidade } from '../../core/world'
import { caixaDaUnidade } from './caixas'

export interface Pose {
  pos: Vector3
  alvo: Vector3
}

/** O que a câmera precisa saber da ótica para caber o assunto no quadro. */
export interface Otica {
  fov: number
  aspecto: number
}

/** Órbita: vista 3/4 de sudeste, pouco acima da linha de coroamento. */
const AZIMUTE_CONJUNTO = MathUtils.degToRad(35)
const ELEVACAO_CONJUNTO = MathUtils.degToRad(15)
/** Unidade: olhar quase horizontal, pela diagonal da própria unidade. */
const ELEVACAO_UNIDADE = MathUtils.degToRad(10)

/** Distância para que uma esfera de raio `raio` caiba no quadro. */
export function distanciaParaRaio(raio: number, otica: Otica, margem = 1): number {
  const vertical = MathUtils.degToRad(otica.fov)
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * Math.max(otica.aspecto, 0.3))
  const menor = Math.min(vertical, horizontal)
  return (raio / Math.sin(menor / 2)) * margem
}

/** Caixa que contém pódio e as duas torres inteiras. */
function extremosDoConjunto(): { x: number; y: number; z: number } {
  let x = PODIUM.largura / 2
  let z = PODIUM.profundidade / 2
  for (const t of TORRES) {
    x = Math.max(x, Math.abs(t.centro[0]) + t.largura / 2)
    z = Math.max(z, Math.abs(t.centro[2]) + t.profundidade / 2)
  }
  return { x, y: ALTURA_COROAMENTO, z }
}

function direcao(azimute: number, elevacao: number): Vector3 {
  const c = Math.cos(elevacao)
  return new Vector3(Math.sin(azimute) * c, Math.sin(elevacao), Math.cos(azimute) * c)
}

/**
 * Enquadramento do conjunto inteiro. Responde a fov e proporção de tela.
 * `limite` é o `maxDistance` do OrbitControls: em tela muito estreita a
 * distância ideal passa do limite, e aí é melhor recortar as pontas do pódio
 * do que deixar o controle grampear a câmera num ponto diferente do pedido.
 */
export function poseDoConjunto(otica: Otica, margem = 1, limite = Infinity): Pose {
  const e = extremosDoConjunto()
  // Alvo abaixo do meio geométrico: as torres sobem no quadro, como em foto de arquitetura.
  const alvo = new Vector3(0, e.y * 0.36, 0)
  let raio = 0
  for (const sx of [-1, 1]) {
    for (const sy of [0, 1]) {
      for (const sz of [-1, 1]) {
        raio = Math.max(raio, new Vector3(sx * e.x, sy * e.y, sz * e.z).distanceTo(alvo))
      }
    }
  }
  const dist = Math.min(distanciaParaRaio(raio, otica, margem), limite)
  return { pos: alvo.clone().addScaledVector(direcao(AZIMUTE_CONJUNTO, ELEVACAO_CONJUNTO), dist), alvo }
}

/**
 * Enquadramento de uma unidade: aproxima pela diagonal da própria unidade,
 * com raio folgado para que vários pavimentos continuem no quadro.
 */
export function poseDaUnidade(id: string, otica: Otica, margem = 1, distanciaMin = 0): Pose | null {
  const c = caixaDaUnidade(id)
  if (!c) return null
  const alvo = new Vector3(c.centro[0], c.centro[1], c.centro[2])
  const raio = (Math.max(c.tamanho[0], c.tamanho[2]) / 2) * 2.4
  const dist = Math.max(distanciaMin + 6, distanciaParaRaio(raio, otica, margem))
  const cos = Math.cos(ELEVACAO_UNIDADE)
  const dir = new Vector3(c.fora[0] * cos, Math.sin(ELEVACAO_UNIDADE), c.fora[1] * cos).normalize()
  const pos = alvo.clone().addScaledVector(dir, dist)
  pos.y = Math.max(pos.y, PODIUM.altura * 0.6)
  return { pos, alvo }
}

/** Vista da janela: o contrato de `varandaDaUnidade` manda, sem reinterpretação. */
export function poseDaVista(id: string): Pose | null {
  const c = caixaDaUnidade(id)
  if (!c) return null
  const u = c.unidade
  const v = varandaDaUnidade(u.torre, u.andar, u.posicao)
  return { pos: new Vector3(...v.pos), alvo: new Vector3(...v.alvo) }
}

/** Aproximação exponencial, independente do frame rate. */
export function damp3(atual: Vector3, destino: Vector3, meiaVida: number, dt: number): void {
  const k = 1 - Math.pow(2, -dt / Math.max(meiaVida, 1e-4))
  atual.lerp(destino, Math.min(k, 1))
}

/* ------------------------------------------------- barramento imperativo */

export type PedidoDeCamera = { tipo: 'conjunto' } | { tipo: 'unidade'; id: string }

let ouvinte: ((p: PedidoDeCamera) => void) | null = null
let pendente: PedidoDeCamera | null = null

/** Chamado pelo `<Camera />`. Devolve a função de baixa. */
export function registrarCamera(fn: (p: PedidoDeCamera) => void): () => void {
  ouvinte = fn
  if (pendente) {
    const p = pendente
    pendente = null
    fn(p)
  }
  return () => {
    if (ouvinte === fn) ouvinte = null
  }
}

function pedir(p: PedidoDeCamera): void {
  if (ouvinte) ouvinte(p)
  else pendente = p
}

/** Volta ao enquadramento do conjunto e rearma a rotação ociosa. */
export function enquadrarConjunto(): void {
  pedir({ tipo: 'conjunto' })
}

/** Aproxima e enquadra uma unidade. Não mexe na seleção — isso é da UI. */
export function enquadrarUnidade(id: string): void {
  pedir({ tipo: 'unidade', id })
}
