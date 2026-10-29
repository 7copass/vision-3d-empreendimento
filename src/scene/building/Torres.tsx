/**
 * As duas torres. Planta 30 × 22 (TORRES), 20 pavimentos de FLOOR_H sobre o
 * embasamento, coroamento até ALTURA_COROAMENTO.
 *
 * Estratégia de desempenho: o pavimento tipo é UMA geometria mesclada por
 * material, instanciada 19 × 2 vezes. O pavimento 20 (cobertura duplex) e o
 * coroamento são outra geometria mesclada, instanciada 2 vezes. Assim as duas
 * torres inteiras custam menos de vinte draw calls.
 *
 * Arquitetura: concreto claro aparente, varanda de 2,3 m em todo o perímetro
 * com guarda-corpo de vidro, brises verticais de madeira nas empenas leste e
 * oeste, núcleo opaco ao centro e ático técnico no coroamento.
 */
import { useMemo } from 'react'
import type { ReactElement } from 'react'
import * as THREE from 'three'
import type { Posicao } from '../../core/types'
import {
  ALTURA_COROAMENTO,
  ALTURA_TORRE,
  ANDARES,
  ANDAR_COBERTURA,
  FLOOR_H,
  PODIUM,
  TORRES,
  baseDoPavimento,
} from '../../empreendimentos/village-one/world'
import { materiais } from './materiais'
import { Instancias } from './Instancias'
import { bloco, caixa, cilindro, emBlocos, hash, mesclar, painel, piso, recortar } from './util'
import type { Caixa3, Retangulo, Transf } from './util'

/* ------------------------------------------------------------- a planta --- */

const W = TORRES[0].largura // 30
const D = TORRES[0].profundidade // 22
const BX = W / 2 // 15
const BZ = D / 2 // 11

/** Profundidade da varanda: o vidro recua isto da linha da planta. */
const VARANDA = 2.3
const IX = BX - VARANDA // 12,7
const IZ = BZ - VARANDA // 8,7

const LAJE = 0.3
const GUARDA = 1.12
const PILAR = 0.9

/** Núcleo de circulação, opaco, no centro da planta. */
const NUCLEO = { x: 4.5, z: 4.0 } as const

interface Fachada {
  posicao: Posicao
  giro: number
  comp: number
  /** t ao longo da fachada → [x, z] na linha do caixilho. */
  ponto: (t: number) => [number, number]
  /** Vetor unitário para dentro da torre. */
  dentro: [number, number]
}

const FACHADAS: Fachada[] = [
  { posicao: 1, giro: -Math.PI / 2, comp: IZ * 2, ponto: (t) => [-IX, t], dentro: [1, 0] },
  { posicao: 2, giro: Math.PI, comp: IX * 2, ponto: (t) => [t, -IZ], dentro: [0, 1] },
  { posicao: 3, giro: Math.PI / 2, comp: IZ * 2, ponto: (t) => [IX, t], dentro: [-1, 0] },
  { posicao: 4, giro: 0, comp: IX * 2, ponto: (t) => [t, IZ], dentro: [0, -1] },
]

/** Módulos de esquadria por fachada. É o que define a janela acesa à noite. */
const MODULO_ALVO = 2.95
const modulos = (comp: number): { n: number; passo: number } => {
  const n = Math.max(3, Math.round(comp / MODULO_ALVO))
  return { n, passo: comp / n }
}

/* ----------------------------------------------------------- recipientes --- */

interface Baldes {
  concreto: THREE.BufferGeometry[]
  estrutura: THREE.BufferGeometry[]
  vidro: THREE.BufferGeometry[]
  guarda: THREE.BufferGeometry[]
  metal: THREE.BufferGeometry[]
  metalClaro: THREE.BufferGeometry[]
  madeira: THREE.BufferGeometry[]
  interior: THREE.BufferGeometry[]
  deck: THREE.BufferGeometry[]
  agua: THREE.BufferGeometry[]
}

const baldes = (): Baldes => ({
  concreto: [],
  estrutura: [],
  vidro: [],
  guarda: [],
  metal: [],
  metalClaro: [],
  madeira: [],
  interior: [],
  deck: [],
  agua: [],
})

/* ------------------------------------------------------- pavimento tipo --- */

/** Laje, fascia de borda, pilares de canto e divisórias entre varandas. */
function estruturaDoPavimento(b: Baldes, y: number, altura: number): void {
  // laje da varanda e do interior, planta cheia
  b.concreto.push(bloco(-BX, BX, y, y + LAJE, -BZ, BZ, 5))
  // fascia: a linha horizontal que dá textura à torre
  const fo = 0.14
  b.concreto.push(bloco(-BX - fo, BX + fo, y - 0.22, y + LAJE + 0.06, BZ, BZ + fo, 3))
  b.concreto.push(bloco(-BX - fo, BX + fo, y - 0.22, y + LAJE + 0.06, -BZ - fo, -BZ, 3))
  b.concreto.push(bloco(BX, BX + fo, y - 0.22, y + LAJE + 0.06, -BZ - fo, BZ + fo, 3))
  b.concreto.push(bloco(-BX - fo, -BX, y - 0.22, y + LAJE + 0.06, -BZ - fo, BZ + fo, 3))

  // pilares de canto: a esquina estrutural que fecha a varanda
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      b.estrutura.push(
        bloco(
          sx > 0 ? BX - PILAR : -BX,
          sx > 0 ? BX : -BX + PILAR,
          y,
          y + altura,
          sz > 0 ? BZ - PILAR : -BZ,
          sz > 0 ? BZ : -BZ + PILAR,
          3,
        ),
      )
    }
  }

  // divisórias entre varandas vizinhas, no limite dos quadrantes
  const hDiv = altura - 0.5
  b.concreto.push(bloco(-BX, -IX, y + LAJE, y + hDiv, -0.1, 0.1, 2))
  b.concreto.push(bloco(IX, BX, y + LAJE, y + hDiv, -0.1, 0.1, 2))
  b.concreto.push(bloco(-0.1, 0.1, y + LAJE, y + hDiv, -BZ, -IZ, 2))
  b.concreto.push(bloco(-0.1, 0.1, y + LAJE, y + hDiv, IZ, BZ, 2))
}

/** Caixilho de vidro, montantes e o volume interno opaco. */
function envoltoriaDoPavimento(b: Baldes, y: number, altura: number, vazios: Retangulo[] = []): void {
  const hv = altura - LAJE - 0.08
  const yv = y + LAJE + hv / 2

  for (const f of FACHADAS) {
    const [cx, cz] = f.ponto(0)
    b.vidro.push(painel(f.comp - 1.6, hv, [cx, yv, cz], f.giro))

    const { n, passo } = modulos(f.comp - 1.6)
    // montantes verticais
    for (let i = 0; i <= n; i++) {
      const t = -(f.comp - 1.6) / 2 + i * passo
      const [mx, mz] = f.ponto(t)
      b.metal.push(caixa(0.09, hv, 0.14, [mx, yv, mz], { ry: f.giro, uv: 1 }))
    }
    // travessas inferior, intermediária e superior
    for (const dy of [0.04, hv * 0.62, hv - 0.04]) {
      b.metal.push(
        caixa(f.comp - 1.6, 0.09, 0.12, [cx, y + LAJE + dy, cz], { ry: f.giro, uv: 1.5 }),
      )
    }
  }

  // volume interno: a torre não é transparente de lado a lado
  let miolo: Caixa3[] = [
    { x0: -IX + 0.06, x1: IX - 0.06, y0: y + LAJE + 0.02, y1: y + altura - 0.02, z0: -IZ + 0.06, z1: IZ - 0.06 },
  ]
  for (const vazio of vazios) miolo = recortar(miolo, vazio)
  for (const g of emBlocos(miolo, 5)) b.interior.push(g)
}

/** Guarda-corpo de vidro na borda da varanda, com corrimão metálico. */
function guardaCorpo(b: Baldes, y: number): void {
  const r = 0.07
  const yg = y + 0.34 + GUARDA / 2
  const px = BX - r
  const pz = BZ - r
  b.guarda.push(painel(W - PILAR * 2 - 0.2, GUARDA, [0, yg, pz]))
  b.guarda.push(painel(W - PILAR * 2 - 0.2, GUARDA, [0, yg, -pz], Math.PI))
  b.guarda.push(painel(D - PILAR * 2 - 0.2, GUARDA, [px, yg, 0], Math.PI / 2))
  b.guarda.push(painel(D - PILAR * 2 - 0.2, GUARDA, [-px, yg, 0], -Math.PI / 2))

  const topo = y + 0.34 + GUARDA
  const cap = (x0: number, x1: number, z0: number, z1: number) =>
    bloco(x0, x1, topo, topo + 0.07, z0, z1, 2)
  b.metalClaro.push(cap(-BX, BX, pz - 0.05, pz + 0.05))
  b.metalClaro.push(cap(-BX, BX, -pz - 0.05, -pz + 0.05))
  b.metalClaro.push(cap(px - 0.05, px + 0.05, -pz, pz))
  b.metalClaro.push(cap(-px - 0.05, -px + 0.05, -pz, pz))
  // sapata inferior
  const sapata = (x0: number, x1: number, z0: number, z1: number) =>
    bloco(x0, x1, y + LAJE, y + 0.42, z0, z1, 2)
  b.metalClaro.push(sapata(-BX, BX, pz - 0.07, pz + 0.07))
  b.metalClaro.push(sapata(-BX, BX, -pz - 0.07, -pz + 0.07))
  b.metalClaro.push(sapata(px - 0.07, px + 0.07, -pz, pz))
  b.metalClaro.push(sapata(-px - 0.07, -px + 0.07, -pz, pz))
}

/** Brises verticais de madeira nas empenas leste e oeste. */
function brisesDaEmpena(y: number, altura: number, alta: boolean): THREE.BufferGeometry {
  const partes: THREE.BufferGeometry[] = []
  const passo = alta ? 0.55 : 1.0
  const trechos: Array<[number, number]> = [
    [-BZ + 0.55, -IZ + 1.25],
    [IZ - 1.25, BZ - 0.55],
  ]
  for (const sx of [-1, 1]) {
    for (const [z0, z1] of trechos) {
      for (let z = z0; z <= z1 + 0.001; z += passo) {
        partes.push(
          caixa(0.36, altura - 0.5, 0.1, [sx * (BX - 0.18), y + altura / 2, z], { ry: Math.PI / 2, uv: 1.4 }),
        )
      }
    }
  }
  return mesclar(partes)
}

/* ------------------------------------------- cobertura duplex e coroamento */

const Y20 = baseDoPavimento(ANDAR_COBERTURA) // 70,35
const TERRACO = ALTURA_TORRE // 73,5
const ATICO_TOPO = 77.2
const CROWN_BASE = 77.4

/** Piscinas privativas das coberturas, uma por duplex. */
const PISCINAS_PRIVATIVAS: Retangulo[] = [
  { x0: -12, x1: -5, z0: 2, z1: 7 },
  { x0: 5, x1: 12, z0: 2, z1: 7 },
]
/** Vão que cada piscina abre na laje do terraço e no miolo do pavimento 20. */
const VAO_PISCINAS: Retangulo[] = PISCINAS_PRIVATIVAS.map((r) => ({
  x0: r.x0 + 0.1,
  x1: r.x1 - 0.1,
  z0: r.z0 + 0.1,
  z1: r.z1 - 0.1,
}))
const VOLUMES_SUPERIORES: Array<[number, number, number, number]> = [
  [-13.5, -5.5, -10.4, -0.6],
  [5.5, 13.5, -10.4, -0.6],
]

function coberturaDuplex(b: Baldes, alta: boolean): void {
  /* nível inferior do duplex: mesmo vocabulário do tipo, sem brise */
  estruturaDoPavimento(b, Y20, FLOOR_H)
  envoltoriaDoPavimento(b, Y20, FLOOR_H, VAO_PISCINAS)
  guardaCorpo(b, Y20)

  /* laje do terraço, aberta sob as piscinas privativas */
  let lajeTerraco: Caixa3[] = [
    { x0: -BX, x1: BX, y0: TERRACO - LAJE, y1: TERRACO, z0: -BZ, z1: BZ },
  ]
  for (const vazio of VAO_PISCINAS) lajeTerraco = recortar(lajeTerraco, vazio)
  for (const g of emBlocos(lajeTerraco, 5)) b.concreto.push(g)
  const fo = 0.14
  b.concreto.push(bloco(-BX - fo, BX + fo, TERRACO - 0.52, TERRACO, BZ, BZ + fo, 3))
  b.concreto.push(bloco(-BX - fo, BX + fo, TERRACO - 0.52, TERRACO, -BZ - fo, -BZ, 3))
  b.concreto.push(bloco(BX, BX + fo, TERRACO - 0.52, TERRACO, -BZ - fo, BZ + fo, 3))
  b.concreto.push(bloco(-BX - fo, -BX, TERRACO - 0.52, TERRACO, -BZ - fo, BZ + fo, 3))

  /* piso do terraço: deck de madeira ao sul, pedra ao norte */
  let deckTerraco: Caixa3[] = [
    { x0: -14.4, x1: 14.4, y0: TERRACO - 0.1, y1: TERRACO + 0.1, z0: -0.4, z1: 10.4 },
  ]
  for (const vazio of PISCINAS_PRIVATIVAS) {
    deckTerraco = recortar(deckTerraco, { x0: vazio.x0 - 0.45, x1: vazio.x1 + 0.45, z0: vazio.z0 - 0.45, z1: vazio.z1 + 0.45 })
  }
  for (const g of emBlocos(deckTerraco, 1.8)) b.deck.push(g)
  b.concreto.push(bloco(-14.4, 14.4, TERRACO - 0.1, TERRACO + 0.06, -10.4, -0.4, 4))

  /* piscinas privativas, uma por cobertura */
  for (const { x0, x1, z0, z1 } of PISCINAS_PRIVATIVAS) {
    const agua = TERRACO + 0.3
    const fundo = TERRACO - 1.1
    const topo = TERRACO + 0.5
    const e = 0.45
    // fundo claro e mureta em quatro faces
    b.concreto.push(bloco(x0 - e, x1 + e, fundo - 0.3, fundo, z0 - e, z1 + e, 2))
    b.concreto.push(bloco(x0 - e, x1 + e, fundo, topo, z0 - e, z0, 2))
    b.concreto.push(bloco(x0 - e, x1 + e, fundo, topo, z1, z1 + e, 2))
    b.concreto.push(bloco(x0 - e, x0, fundo, topo, z0, z1, 2))
    b.concreto.push(bloco(x1, x1 + e, fundo, topo, z0, z1, 2))
    b.agua.push(piso(x1 - x0 + 0.1, z1 - z0 + 0.1, [(x0 + x1) / 2, agua, (z0 + z1) / 2], 4))
  }

  /* guarda-corpo do terraço */
  const yg = TERRACO + 0.1 + GUARDA / 2
  b.guarda.push(painel(W - 1.6, GUARDA, [0, yg, BZ - 0.1]))
  b.guarda.push(painel(D - 1.6, GUARDA, [BX - 0.1, yg, 0], Math.PI / 2))
  b.guarda.push(painel(D - 1.6, GUARDA, [-BX + 0.1, yg, 0], -Math.PI / 2))
  const topo = TERRACO + 0.1 + GUARDA
  b.metalClaro.push(bloco(-BX, BX, topo, topo + 0.07, BZ - 0.16, BZ - 0.04, 2))
  b.metalClaro.push(bloco(BX - 0.16, BX - 0.04, topo, topo + 0.07, -BZ, BZ, 2))
  b.metalClaro.push(bloco(-BX + 0.04, -BX + 0.16, topo, topo + 0.07, -BZ, BZ, 2))

  /* pergolados de madeira sobre o terraço */
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? 6 : -13
    const x1 = sx > 0 ? 13 : -6
    const z0 = 8.2
    const z1 = 10.2
    for (const x of [x0, x1]) {
      for (const z of [z0, z1]) {
        b.madeira.push(caixa(0.2, 2.7, 0.2, [x, TERRACO + 1.45, z], { uv: 1.4 }))
      }
    }
    for (const z of [z0, z1]) {
      b.madeira.push(bloco(x0 - 0.25, x1 + 0.25, TERRACO + 2.8, TERRACO + 3.05, z - 0.11, z + 0.11, 1.4))
    }
    for (let x = x0; x <= x1 + 0.01; x += 0.62) {
      b.madeira.push(bloco(x - 0.06, x + 0.06, TERRACO + 3.05, TERRACO + 3.18, z0 - 0.3, z1 + 0.3, 1.4))
    }
  }

  /* volumes superiores do duplex, recuados e envidraçados para o terraço */
  for (const [x0, x1, z0, z1] of VOLUMES_SUPERIORES) {
    const cx = (x0 + x1) / 2
    const cz = (z0 + z1) / 2
    const base = TERRACO + 0.1
    const h = ATICO_TOPO - 0.4 - base
    b.interior.push(bloco(x0 + 0.2, x1 - 0.2, base, base + h, z0 + 0.2, z1 - 0.2, 4))
    b.vidro.push(painel(x1 - x0 - 0.6, h - 0.4, [cx, base + h / 2, z1 - 0.02]))
    b.vidro.push(painel(z1 - z0 - 0.6, h - 0.4, [x1 - 0.02, base + h / 2, cz], Math.PI / 2))
    b.vidro.push(painel(z1 - z0 - 0.6, h - 0.4, [x0 + 0.02, base + h / 2, cz], -Math.PI / 2))
    b.vidro.push(painel(x1 - x0 - 0.6, h - 0.4, [cx, base + h / 2, z0 + 0.02], Math.PI))
    // montantes de canto e laje de cobertura do volume
    for (const x of [x0, x1]) {
      for (const z of [z0, z1]) {
        b.estrutura.push(caixa(0.4, h, 0.4, [x, base + h / 2, z], { uv: 2 }))
      }
    }
    b.concreto.push(bloco(x0 - 0.5, x1 + 0.5, base + h, base + h + 0.4, z0 - 0.5, z1 + 0.5, 4))
    // brises de madeira na face externa
    const passo = alta ? 0.55 : 1.0
    const faceX = x0 < 0 ? x0 - 0.3 : x1 + 0.3
    for (let z = z0 + 0.5; z < z1; z += passo) {
      b.madeira.push(caixa(0.34, h - 0.5, 0.1, [faceX, base + h / 2, z], { ry: Math.PI / 2, uv: 1.4 }))
    }
  }

  /* ático técnico: o núcleo que continua acima do terraço */
  b.estrutura.push(bloco(-NUCLEO.x, NUCLEO.x, TERRACO, ATICO_TOPO, -NUCLEO.z, NUCLEO.z, 4))
  // respiro da casa de máquinas, na face sul do ático
  b.metal.push(bloco(-3.4, 3.4, TERRACO + 1.3, ATICO_TOPO - 0.7, NUCLEO.z, NUCLEO.z + 0.09, 2))

  /* coroamento: laje flutuante sobre o terço norte, projetada além da planta */
  b.concreto.push(bloco(-BX - 1.4, BX + 1.4, CROWN_BASE, ALTURA_COROAMENTO, -BZ - 1.4, 1.0, 6))
  // lâminas verticais penduradas no coroamento
  const passoLamina = alta ? 1.1 : 2.0
  const yLamina = (75.0 + CROWN_BASE) / 2
  const hLamina = CROWN_BASE - 75.0
  for (let x = -BX - 1.2; x <= BX + 1.2; x += passoLamina) {
    b.concreto.push(caixa(0.16, hLamina, 0.3, [x, yLamina, -BZ - 1.25], { uv: 1.5 }))
  }
  for (let z = -BZ - 1.2; z <= 0.8; z += passoLamina) {
    b.concreto.push(caixa(0.3, hLamina, 0.16, [BX + 1.25, yLamina, z], { uv: 1.5 }))
    b.concreto.push(caixa(0.3, hLamina, 0.16, [-BX - 1.25, yLamina, z], { uv: 1.5 }))
  }
}

/* --------------------------------------------------------- janelas acesas --- */

/**
 * À noite as janelas acendem por unidade, não por vidro: o apartamento inteiro
 * tem luz, com alguns ambientes apagados. Tudo determinístico pela posição —
 * a mesma torre, o mesmo desenho de luzes a cada abertura do tour.
 *
 * `acende` é o limiar de noite de cada unidade: o apartamento começa a
 * aparecer quando o fator de noite da atmosfera passa dele. Como o limiar é
 * por unidade e não por esquadria, o apartamento acende inteiro, e os vizinhos
 * acendem em momentos diferentes ao longo do crepúsculo.
 */
function janelasAcesas(alta: boolean): { itens: Transf[]; acende: Float32Array } {
  const itens: Transf[] = []
  const limiares: number[] = []
  const recuo = 0.22

  for (let t = 0; t < TORRES.length; t++) {
    const torre = TORRES[t]
    for (let andar = 1; andar <= ANDARES; andar++) {
      const y = baseDoPavimento(andar)
      const cobertura = andar === ANDAR_COBERTURA
      for (const f of FACHADAS) {
        const comp = f.comp - 1.6
        const { n, passo } = modulos(comp)
        // a unidade de uma fachada é única no tipo; na cobertura o duplex divide
        // a torre em metade oeste e metade leste
        for (let i = 0; i < n; i++) {
          const tt = -comp / 2 + (i + 0.5) * passo
          const [lx, lz] = f.ponto(tt)
          const unidade = cobertura ? (lx < 0 ? 1 : 3) : f.posicao
          const acesa = hash(t, andar, unidade, 1) < 0.56
          if (!acesa) continue
          if (hash(t, andar, unidade, i, 2) < 0.28) continue
          const brilho = 0.72 + hash(t, andar, i, 3) * 0.55
          limiares.push(0.06 + hash(t, andar, unidade, 5) * 0.46)
          itens.push({
            p: [
              torre.centro[0] + lx + f.dentro[0] * recuo,
              y + 0.34 + (FLOOR_H - 0.5) / 2,
              torre.centro[2] + lz + f.dentro[1] * recuo,
            ],
            r: [0, f.giro, 0],
            s: [(passo - 0.18) / 2.8, 1, 1],
            cor: new THREE.Color(1, 0.84, 0.64).multiplyScalar(brilho),
          })
        }
      }
      // volumes superiores do duplex
      if (cobertura && alta) {
        for (const [x0, x1, , z1] of VOLUMES_SUPERIORES) {
          if (hash(t, x0, 9) > 0.7) continue
          limiares.push(0.06 + hash(t, x0, 5) * 0.4)
          itens.push({
            p: [torre.centro[0] + (x0 + x1) / 2, TERRACO + 1.8, torre.centro[2] + z1 - 0.3],
            s: [(x1 - x0 - 1.2) / 2.8, 0.85, 1],
            cor: new THREE.Color(1, 0.86, 0.68),
          })
        }
      }
    }
  }
  return { itens, acende: new Float32Array(limiares) }
}

/* ------------------------------------------------------------- montagem --- */

interface Montagem {
  tipo: Record<keyof Baldes, THREE.BufferGeometry>
  brises: THREE.BufferGeometry
  cob: Record<keyof Baldes, THREE.BufferGeometry>
  nucleo: THREE.BufferGeometry
  coluna: THREE.BufferGeometry
}

const fechar = (b: Baldes): Record<keyof Baldes, THREE.BufferGeometry> => ({
  concreto: mesclar(b.concreto.length ? b.concreto : [caixa(0.001, 0.001, 0.001)]),
  estrutura: mesclar(b.estrutura.length ? b.estrutura : [caixa(0.001, 0.001, 0.001)]),
  vidro: mesclar(b.vidro.length ? b.vidro : [caixa(0.001, 0.001, 0.001)]),
  guarda: mesclar(b.guarda.length ? b.guarda : [caixa(0.001, 0.001, 0.001)]),
  metal: mesclar(b.metal.length ? b.metal : [caixa(0.001, 0.001, 0.001)]),
  metalClaro: mesclar(b.metalClaro.length ? b.metalClaro : [caixa(0.001, 0.001, 0.001)]),
  madeira: mesclar(b.madeira.length ? b.madeira : [caixa(0.001, 0.001, 0.001)]),
  interior: mesclar(b.interior.length ? b.interior : [caixa(0.001, 0.001, 0.001)]),
  deck: mesclar(b.deck.length ? b.deck : [caixa(0.001, 0.001, 0.001)]),
  agua: mesclar(b.agua.length ? b.agua : [caixa(0.001, 0.001, 0.001)]),
})

function montar(alta: boolean): Montagem {
  const bt = baldes()
  estruturaDoPavimento(bt, 0, FLOOR_H)
  envoltoriaDoPavimento(bt, 0, FLOOR_H)
  guardaCorpo(bt, 0)

  const bc = baldes()
  coberturaDuplex(bc, alta)

  return {
    tipo: fechar(bt),
    brises: brisesDaEmpena(0, FLOOR_H, alta),
    cob: fechar(bc),
    nucleo: mesclar([
      bloco(-NUCLEO.x, NUCLEO.x, PODIUM.altura, ALTURA_TORRE, -NUCLEO.z, NUCLEO.z, 4),
    ]),
    coluna: mesclar([
      cilindro(0.3, 0.34, ALTURA_TORRE - PODIUM.altura, 12, [0, (PODIUM.altura + ALTURA_TORRE) / 2, 0]),
    ]),
  }
}

/* ------------------------------------------------------------ componente --- */

export function Torres({ alta, acesas }: { alta: boolean; acesas: boolean }): ReactElement {
  const m = materiais()
  const g = useMemo(() => montar(alta), [alta])

  /** 19 pavimentos tipo × 2 torres. */
  const pavimentos = useMemo<Transf[]>(() => {
    const itens: Transf[] = []
    for (const torre of TORRES) {
      for (let andar = 1; andar < ANDAR_COBERTURA; andar++) {
        itens.push({ p: [torre.centro[0], baseDoPavimento(andar), torre.centro[2]] })
      }
    }
    return itens
  }, [])

  /** A cobertura e o coroamento já vêm em cota absoluta. */
  const torresBase = useMemo<Transf[]>(
    () => TORRES.map((t) => ({ p: [t.centro[0], 0, t.centro[2]] as const })),
    [],
  )

  /** Pilares no meio de cada empena: a esquina já é pilar de concreto. */
  const colunas = useMemo<Transf[]>(() => {
    const itens: Transf[] = []
    const pontos: Array<[number, number]> = [
      [0, -(BZ - 0.7)],
      [0, BZ - 0.7],
      [-(BX - 0.7), 0],
      [BX - 0.7, 0],
    ]
    for (const torre of TORRES) {
      for (const [x, z] of pontos) itens.push({ p: [torre.centro[0] + x, 0, torre.centro[2] + z] })
    }
    return itens
  }, [])

  const luzes = useMemo(() => janelasAcesas(alta), [alta])
  const atributosDeLuz = useMemo(() => ({ aAcende: luzes.acende }), [luzes])
  const painelAceso = useMemo(() => painel(2.8, FLOOR_H - 0.5, [0, 0, 0]), [])

  return (
    <group name="torres">
      {/* pavimento tipo, instanciado */}
      <Instancias geometria={g.tipo.concreto} material={m.concretoClaro} itens={pavimentos} />
      <Instancias geometria={g.tipo.estrutura} material={m.concretoEstrutural} itens={pavimentos} />
      <Instancias geometria={g.tipo.interior} material={m.interior} itens={pavimentos} />
      <Instancias geometria={g.tipo.metal} material={m.metalEscuro} itens={pavimentos} sombra={alta} />
      <Instancias geometria={g.tipo.metalClaro} material={m.metalClaro} itens={pavimentos} sombra={alta} />
      <Instancias geometria={g.brises} material={m.madeira} itens={pavimentos} />
      <Instancias geometria={g.tipo.vidro} material={m.vidro} itens={pavimentos} sombra={false} />
      <Instancias geometria={g.tipo.guarda} material={m.vidroGuarda} itens={pavimentos} sombra={false} />

      {/* núcleo e pilares, contínuos de cima a baixo */}
      <Instancias geometria={g.nucleo} material={m.concretoEstrutural} itens={torresBase} />
      <Instancias geometria={g.coluna} material={m.concretoEstrutural} itens={colunas} />

      {/* cobertura duplex e coroamento */}
      <Instancias geometria={g.cob.concreto} material={m.concretoClaro} itens={torresBase} />
      <Instancias geometria={g.cob.estrutura} material={m.concretoEstrutural} itens={torresBase} />
      <Instancias geometria={g.cob.interior} material={m.interior} itens={torresBase} />
      <Instancias geometria={g.cob.deck} material={m.deck} itens={torresBase} />
      <Instancias geometria={g.cob.madeira} material={m.madeira} itens={torresBase} />
      <Instancias geometria={g.cob.metal} material={m.metalEscuro} itens={torresBase} sombra={alta} />
      <Instancias geometria={g.cob.metalClaro} material={m.metalClaro} itens={torresBase} sombra={alta} />
      <Instancias geometria={g.cob.agua} material={m.agua} itens={torresBase} sombra={false} />
      <Instancias geometria={g.cob.vidro} material={m.vidro} itens={torresBase} sombra={false} />
      <Instancias geometria={g.cob.guarda} material={m.vidroGuarda} itens={torresBase} sombra={false} />

      {/* janelas acesas: aditivas e desenhadas DEPOIS do vidro, senão a pele
          escura da fachada come dois terços da luz de cada apartamento */}
      <Instancias
        geometria={painelAceso}
        material={m.janelaAcesa}
        itens={luzes.itens}
        atributos={atributosDeLuz}
        sombra={false}
        recebe={false}
        inerte
        visivel={acesas}
        ordem={12}
      />
    </group>
  )
}
