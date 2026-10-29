/**
 * Laje de lazer: o topo do embasamento, y = PODIUM.altura.
 *
 * As zonas seguem AMENIDADES de data/project.ts, com duas exceções medidas:
 * academia e salão de festas caem dentro da projeção das torres nos dados, e
 * foram para a faixa norte da laje — ver o comentário em Z.academia. As alas
 * laterais, onde eles estavam, são hoje jardim de porte baixo, que é o que as
 * unidades dos primeiros pavimentos precisam ver pela janela.
 */
import { useMemo } from 'react'
import type { ReactElement } from 'react'
import * as THREE from 'three'
import { PODIUM } from '../../empreendimentos/village-one/world'
import { materiais } from './materiais'
import { CANTEIROS_DECK } from './Vegetacao'
import { Instancias, Peca } from './Instancias'
import { anel, bloco, caixa, cilindro, hash, mesclar, painel, piso } from './util'
import type { Retangulo, Transf } from './util'

const Y = PODIUM.altura // 10,5

/** Cotas de acabamento. Separadas o bastante para não brigar em Z. */
const C = {
  pedra: Y + 0.06,
  quadra: Y + 0.09,
  borracha: Y + 0.11,
  grama: Y + 0.1,
  deck: Y + 0.2,
  base: Y - 0.3,
} as const

/** Zonas, em metros de mundo. */
const Z = {
  piscina: { x0: -7, x1: 7, z0: -4.5, z1: 21 },
  espelho: { x0: -24, x1: -16, z0: -6, z1: 6 },
  deckMolhado: { x0: 13, x1: 22, z0: 2, z1: 14 },
  quadra: { x0: -30, x1: -10, z0: 16, z1: 32 },
  playground: { x0: 10, x1: 30, z0: 16, z1: 30 },
  churrasco: { x0: 6, x1: 20, z0: -24, z1: -12 },
  coworking: { x0: -21, x1: -7, z0: -25, z1: -14 },
  // Academia e salão foram para a faixa norte da laje, e não para as alas
  // laterais: nas alas eles ficavam a 2–4 m da fachada das torres e tapavam
  // o eixo de vista das unidades de posição 1 (oeste) e 3 (leste) nos
  // primeiros pavimentos. Aqui nenhum dos oito eixos cardeais os atravessa.
  academia: { x0: -63, x1: -45, z0: -36, z1: -22 },
  salao: { x0: 45, x1: 63, z0: -36, z1: -22 },
  pet: { x0: 42, x1: 58, z0: 9, z1: 25 },
} as const

/**
 * Vão que a piscina abre na laje do embasamento. Podium.tsx importa isto para
 * recortar a laje de lazer e a massa da garagem — sem o recorte, o tanque de
 * 1,6 m de profundidade ficaria tapado por 60 cm de concreto.
 */
export const PISCINA_VAO: Retangulo = { x0: -9.5, x1: 6.9, z0: -4.4, z1: 20.9 }

/** Deck de madeira, já desviando da piscina, do espelho e do deck molhado. */
const DECK_MADEIRA: Array<[number, number, number, number]> = [
  [-30, -25, -11, 14],
  [-25, -15, -11, -6.8],
  [-25, -15, 6.8, 14],
  [-15, -9.8, -11, 14],
  [8, 12.4, -11, 14],
  [12.4, 23, -11, 1.6],
  [23, 30, -11, 14],
  [-9.8, 8, 21.9, 26],
  [-9.8, 8, -11, -5.4],
]

interface Geos {
  pedra: THREE.BufferGeometry
  concreto: THREE.BufferGeometry
  deck: THREE.BufferGeometry
  madeira: THREE.BufferGeometry
  grama: THREE.BufferGeometry
  agua: THREE.BufferGeometry
  espelho: THREE.BufferGeometry
  quadra: THREE.BufferGeometry
  borracha: THREE.BufferGeometry
  vidro: THREE.BufferGeometry
  metalClaro: THREE.BufferGeometry
  metalEscuro: THREE.BufferGeometry
  interior: THREE.BufferGeometry
  espreguicadeiras: Transf[]
  hastes: Transf[]
  abas: Transf[]
  bancos: Transf[]
  brises: Transf[]
}

interface Baldes {
  pedra: THREE.BufferGeometry[]
  concreto: THREE.BufferGeometry[]
  deck: THREE.BufferGeometry[]
  madeira: THREE.BufferGeometry[]
  grama: THREE.BufferGeometry[]
  agua: THREE.BufferGeometry[]
  espelho: THREE.BufferGeometry[]
  quadra: THREE.BufferGeometry[]
  borracha: THREE.BufferGeometry[]
  vidro: THREE.BufferGeometry[]
  metalClaro: THREE.BufferGeometry[]
  metalEscuro: THREE.BufferGeometry[]
  interior: THREE.BufferGeometry[]
  brises: Transf[]
}

/* -------------------------------------------------------------- piscina --- */

function piscina(b: Baldes): void {
  const p = Z.piscina
  const agua = Y + 0.3 // 10,8 — a cota que AMENIDADES informa
  const fundo = Y - 1.3 // tanque de 1,6 m
  const parede = 0.3
  const lipo = agua + 0.02

  // fundo do tanque
  b.pedra.push(bloco(p.x0 - 0.3, p.x1, fundo - 0.3, fundo, p.z0, p.z1, 3))
  // paredes norte, sul e leste
  b.pedra.push(bloco(p.x0, p.x1, fundo, lipo, p.z0, p.z0 + parede, 3))
  b.pedra.push(bloco(p.x0, p.x1, fundo, lipo, p.z1 - parede, p.z1, 3))
  b.pedra.push(bloco(p.x1 - parede, p.x1, fundo, lipo, p.z0, p.z1, 3))
  // a oeste, o lábio da borda infinita: para exatamente na linha da água
  b.pedra.push(bloco(p.x0 - 0.12, p.x0 + 0.18, fundo, agua, p.z0, p.z1, 3))

  // prainha ao norte: degrau que deixa a lâmina com 35 cm
  b.pedra.push(bloco(p.x0 + 0.18, p.x1 - parede, fundo, agua - 0.35, 16, p.z1 - parede, 3))
  // degraus de entrada ao sul
  for (let i = 0; i < 3; i++) {
    b.pedra.push(
      bloco(p.x0 + 0.18, p.x0 + 3.6, fundo, agua - 0.25 - i * 0.3, p.z0 + parede + i * 0.42, p.z0 + parede + (i + 1) * 0.5, 2),
    )
  }

  // borda em pedra nos três lados fechados
  const borda = 0.9
  b.pedra.push(bloco(p.x0 - 0.12, p.x1 + borda, C.base, Y + 0.45, p.z0 - borda, p.z0, 2))
  b.pedra.push(bloco(p.x0 - 0.12, p.x1 + borda, C.base, Y + 0.45, p.z1, p.z1 + borda, 2))
  b.pedra.push(bloco(p.x1, p.x1 + borda, C.base, Y + 0.45, p.z0, p.z1, 2))

  // calha de recolhimento da borda infinita, mais baixa que a lâmina
  const calha = Y - 0.15
  b.pedra.push(bloco(p.x0 - 2.3, p.x0 - 0.12, C.base, calha, p.z0 - borda, p.z1 + borda, 2))
  b.pedra.push(bloco(p.x0 - 2.6, p.x0 - 2.3, C.base, Y + 0.12, p.z0 - borda, p.z1 + borda, 2))

  // lâminas: a principal e a da calha
  b.agua.push(piso(p.x1 - p.x0 - 0.24, p.z1 - p.z0 - parede * 2 + 0.3, [(p.x0 + p.x1) / 2 + 0.06, agua, (p.z0 + p.z1) / 2], 6))
  b.espelho.push(piso(2.0, p.z1 - p.z0 + borda, [p.x0 - 1.2, calha + 0.05, (p.z0 + p.z1) / 2], 4))

  // raias pintadas no fundo
  for (const x of [-4.4, -1.5, 1.4, 4.3]) {
    b.metalEscuro.push(bloco(x - 0.12, x + 0.12, fundo, fundo + 0.015, p.z0 + 1.2, 15.8, 4))
  }
  // escadas de acesso
  for (const z of [-1.2, 6.4]) {
    for (const dx of [-0.35, 0.35]) {
      b.metalClaro.push(cilindro(0.045, 0.045, 1.7, 6, [p.x1 - 0.55, agua - 0.35, z + dx]))
    }
    b.metalClaro.push(cilindro(0.045, 0.045, 0.78, 6, [p.x1 - 0.55, agua + 0.4, z], { rx: Math.PI / 2 }))
  }
}

/* ------------------------------------------------- espelho e deck molhado --- */

function aguasDeApoio(b: Baldes): void {
  // espelho d'água: bacia rasa, elevada 18 cm acima da pedra
  const e = Z.espelho
  const rim = Y + 0.24
  b.pedra.push(bloco(e.x0 - 0.5, e.x1 + 0.5, C.base, rim, e.z0 - 0.5, e.z0, 2))
  b.pedra.push(bloco(e.x0 - 0.5, e.x1 + 0.5, C.base, rim, e.z1, e.z1 + 0.5, 2))
  b.pedra.push(bloco(e.x0 - 0.5, e.x0, C.base, rim, e.z0, e.z1, 2))
  b.pedra.push(bloco(e.x1, e.x1 + 0.5, C.base, rim, e.z0, e.z1, 2))
  b.interior.push(bloco(e.x0, e.x1, C.base, Y + 0.08, e.z0, e.z1, 3))
  b.espelho.push(piso(e.x1 - e.x0, e.z1 - e.z0, [(e.x0 + e.x1) / 2, Y + 0.17, (e.z0 + e.z1) / 2], 5))
  // pedras de passagem
  for (let i = 0; i < 5; i++) {
    const z = e.z0 + 2 + i * 2.1
    b.pedra.push(bloco(-21.6, -19.6, Y + 0.08, Y + 0.3, z, z + 1.4, 1.5))
  }

  // deck molhado: plinto de pedra, lâmina de 4 cm e ilhas secas de madeira
  const d = Z.deckMolhado
  b.pedra.push(bloco(d.x0 - 0.4, d.x1 + 0.4, C.base, Y + 0.1, d.z0 - 0.4, d.z1 + 0.4, 2))
  b.espelho.push(piso(d.x1 - d.x0, d.z1 - d.z0, [(d.x0 + d.x1) / 2, Y + 0.14, (d.z0 + d.z1) / 2], 5))
  for (let i = 0; i < 3; i++) {
    const z = d.z0 + 1 + i * 4
    b.deck.push(bloco(d.x0 + 0.6, d.x1 - 0.6, C.base, Y + 0.3, z, z + 2.6, 1.6))
  }
}

/* ------------------------------------------------------------ pergolado --- */

function pergolado(
  b: Baldes,
  x0: number,
  x1: number,
  z0: number,
  z1: number,
  altura: number,
  passo: number,
): void {
  for (const x of [x0, x1]) {
    for (const z of [z0, z1]) {
      b.madeira.push(caixa(0.26, altura, 0.26, [x, Y + altura / 2, z], { uv: 1.5 }))
    }
  }
  // vigas longitudinais
  for (const z of [z0, z1]) {
    b.madeira.push(bloco(x0 - 0.3, x1 + 0.3, Y + altura, Y + altura + 0.3, z - 0.13, z + 0.13, 1.5))
  }
  // ripas transversais
  for (let x = x0; x <= x1 + 0.01; x += passo) {
    b.madeira.push(bloco(x - 0.07, x + 0.07, Y + altura + 0.3, Y + altura + 0.46, z0 - 0.4, z1 + 0.4, 1.5))
  }
}

/* ------------------------------------------------------------- pavilhão --- */

type Face = 'oeste' | 'leste' | 'norte' | 'sul'

function pavilhao(
  b: Baldes,
  r: { x0: number; x1: number; z0: number; z1: number },
  altura: number,
  brise: Face | null,
  alta: boolean,
): void {
  const { x0, x1, z0, z1 } = r
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const base = Y + 0.18

  // embasamento e piso
  b.pedra.push(bloco(x0 - 0.7, x1 + 0.7, C.base, base, z0 - 0.7, z1 + 0.7, 2.5))
  b.interior.push(bloco(x0 + 0.15, x1 - 0.15, base, base + altura - 0.2, z0 + 0.15, z1 - 0.15, 4))

  // caixilhos de vidro nas quatro faces
  const h = altura - 0.5
  const yv = base + 0.25 + h / 2
  b.vidro.push(painel(x1 - x0 - 0.5, h, [cx, yv, z1 - 0.02]))
  b.vidro.push(painel(x1 - x0 - 0.5, h, [cx, yv, z0 + 0.02], Math.PI))
  b.vidro.push(painel(z1 - z0 - 0.5, h, [x1 - 0.02, yv, cz], Math.PI / 2))
  b.vidro.push(painel(z1 - z0 - 0.5, h, [x0 + 0.02, yv, cz], -Math.PI / 2))

  // montantes de canto e laje de cobertura em bandeja
  for (const x of [x0, x1]) {
    for (const z of [z0, z1]) {
      b.concreto.push(caixa(0.38, altura, 0.38, [x, base + altura / 2, z], { uv: 2 }))
    }
  }
  b.concreto.push(bloco(x0 - 1.1, x1 + 1.1, base + altura, base + altura + 0.42, z0 - 1.1, z1 + 1.1, 4))
  b.concreto.push(bloco(x0 - 0.6, x1 + 0.6, base + altura - 0.18, base + altura, z0 - 0.6, z1 + 0.6, 4))

  // brises verticais de madeira na face mais castigada de sol
  if (brise) {
    const passo = alta ? 0.52 : 0.95
    const vertical = brise === 'leste' || brise === 'oeste'
    const inicio = vertical ? z0 : x0
    const fim = vertical ? z1 : x1
    const fixo = brise === 'oeste' ? x0 - 0.45 : brise === 'leste' ? x1 + 0.45 : brise === 'norte' ? z0 - 0.45 : z1 + 0.45
    for (let t = inicio + 0.3; t < fim; t += passo) {
      b.brises.push({
        p: vertical ? [fixo, base + 0.25 + h / 2, t] : [t, base + 0.25 + h / 2, fixo],
        r: vertical ? [0, Math.PI / 2, 0] : [0, 0, 0],
        s: [1, h / 3.2, 1],
      })
    }
  }
}

/* ------------------------------------------------------- quadra e brinquedos */

function quadra(b: Baldes): void {
  const q = Z.quadra
  b.pedra.push(bloco(q.x0 - 1, q.x1 + 1, C.base, Y + 0.04, q.z0 - 1, q.z1 + 1, 3))
  b.quadra.push(piso(q.x1 - q.x0, q.z1 - q.z0, [(q.x0 + q.x1) / 2, C.quadra, (q.z0 + q.z1) / 2], q.x1 - q.x0))

  // alambrado: postes e travessas
  const h = 4.2
  const postes: number[] = []
  for (let x = q.x0; x <= q.x1 + 0.01; x += 4) postes.push(x)
  for (const x of postes) {
    for (const z of [q.z0, q.z1]) {
      b.metalEscuro.push(cilindro(0.06, 0.06, h, 6, [x, Y + h / 2, z]))
    }
  }
  for (let z = q.z0; z <= q.z1 + 0.01; z += 4) {
    for (const x of [q.x0, q.x1]) {
      b.metalEscuro.push(cilindro(0.06, 0.06, h, 6, [x, Y + h / 2, z]))
    }
  }
  for (const y of [Y + 1.4, Y + h]) {
    b.metalEscuro.push(bloco(q.x0, q.x1, y - 0.04, y + 0.04, q.z0 - 0.04, q.z0 + 0.04, 3))
    b.metalEscuro.push(bloco(q.x0, q.x1, y - 0.04, y + 0.04, q.z1 - 0.04, q.z1 + 0.04, 3))
    b.metalEscuro.push(bloco(q.x0 - 0.04, q.x0 + 0.04, y - 0.04, y + 0.04, q.z0, q.z1, 3))
    b.metalEscuro.push(bloco(q.x1 - 0.04, q.x1 + 0.04, y - 0.04, y + 0.04, q.z0, q.z1, 3))
  }
  // tabelas de basquete
  for (const z of [q.z0 + 1.6, q.z1 - 1.6]) {
    const sentido = z < (q.z0 + q.z1) / 2 ? 1 : -1
    const cx = (q.x0 + q.x1) / 2
    b.metalEscuro.push(cilindro(0.08, 0.1, 3.6, 8, [cx, Y + 1.8, z]))
    b.metalEscuro.push(cilindro(0.07, 0.07, 1.3, 6, [cx, Y + 3.5, z + sentido * 0.65], { rx: Math.PI / 2 }))
    b.metalClaro.push(bloco(cx - 0.9, cx + 0.9, Y + 2.9, Y + 4.0, z + sentido * 1.3, z + sentido * 1.36, 1.8))
  }
}

function playground(b: Baldes): void {
  const p = Z.playground
  b.pedra.push(bloco(p.x0 - 0.8, p.x1 + 0.8, C.base, Y + 0.05, p.z0 - 0.8, p.z1 + 0.8, 3))
  b.borracha.push(piso(p.x1 - p.x0, p.z1 - p.z0, [(p.x0 + p.x1) / 2, C.borracha, (p.z0 + p.z1) / 2], 6))

  // torre de brinquedo com escorregador
  const tx = p.x0 + 5
  const tz = p.z0 + 5
  for (const dx of [-1.4, 1.4]) {
    for (const dz of [-1.4, 1.4]) {
      b.madeira.push(caixa(0.2, 2.6, 0.2, [tx + dx, Y + 1.3, tz + dz], { uv: 1.2 }))
    }
  }
  b.madeira.push(bloco(tx - 1.6, tx + 1.6, Y + 1.5, Y + 1.66, tz - 1.6, tz + 1.6, 1.4))
  b.madeira.push(
    caixa(3.4, 0.16, 3.4, [tx, Y + 3.3, tz], { rx: 0, uv: 1.4 }),
  )
  for (const dx of [-1.5, 1.5]) {
    b.madeira.push(caixa(0.16, 1.9, 0.16, [tx + dx, Y + 2.4, tz - 1.5], { uv: 1.2 }))
    b.madeira.push(caixa(0.16, 1.9, 0.16, [tx + dx, Y + 2.4, tz + 1.5], { uv: 1.2 }))
  }
  // escorregador
  b.metalClaro.push(
    caixa(1.1, 0.1, 4.6, [tx + 3.1, Y + 0.95, tz], { rx: 0.42, uv: 2 }),
  )
  for (const dx of [-0.52, 0.52]) {
    b.metalClaro.push(caixa(0.07, 0.42, 4.6, [tx + 3.1 + dx, Y + 1.14, tz], { rx: 0.42, uv: 2 }))
  }
  // balanço
  const sx = p.x1 - 7
  const sz = p.z0 + 5
  for (const dz of [-2.2, 2.2]) {
    b.madeira.push(caixa(0.2, 2.8, 0.2, [sx - 1.6, Y + 1.4, sz + dz], { rz: 0.2, uv: 1.2 }))
    b.madeira.push(caixa(0.2, 2.8, 0.2, [sx + 1.6, Y + 1.4, sz + dz], { rz: -0.2, uv: 1.2 }))
  }
  b.madeira.push(bloco(sx - 0.14, sx + 0.14, Y + 2.74, Y + 2.96, sz - 2.4, sz + 2.4, 1.4))
  for (const dz of [-1.2, 1.2]) {
    for (const dx of [-0.5, 0.5]) {
      b.metalClaro.push(cilindro(0.025, 0.025, 2.0, 5, [sx + dx, Y + 1.75, sz + dz]))
    }
    b.madeira.push(bloco(sx - 0.6, sx + 0.6, Y + 0.72, Y + 0.8, sz + dz - 0.22, sz + dz + 0.22, 1))
  }
}

/* ------------------------------------------------------- churrasqueiras --- */

function churrasqueiras(b: Baldes): void {
  const c = Z.churrasco
  b.pedra.push(bloco(c.x0 - 1, c.x1 + 1, C.base, Y + 0.08, c.z0 - 1, c.z1 + 1, 3))
  for (let i = 0; i < 4; i++) {
    const x = c.x0 + 1.9 + i * 3.4
    // bancada em quartzo
    b.pedra.push(bloco(x - 1.5, x + 1.5, Y + 0.08, Y + 1.0, c.z0 + 1.2, c.z0 + 2.1, 1.6))
    b.pedra.push(bloco(x - 1.6, x + 1.6, Y + 1.0, Y + 1.08, c.z0 + 1.1, c.z0 + 2.2, 1.6))
    // coifa e chaminé
    b.concreto.push(bloco(x - 0.75, x + 0.75, Y + 1.08, Y + 2.1, c.z0 + 1.3, c.z0 + 2.0, 2))
    b.concreto.push(bloco(x - 0.38, x + 0.38, Y + 2.1, Y + 3.3, c.z0 + 1.5, c.z0 + 1.85, 2))
    // forno de pizza, um por par de módulos
    if (i % 2 === 0) {
      b.pedra.push(bloco(x - 0.7, x + 0.7, Y + 1.08, Y + 1.9, c.z0 + 2.2, c.z0 + 3.1, 1.6))
    }
  }
  pergolado(b, c.x0 + 0.6, c.x1 - 0.6, c.z0 + 3.6, c.z1 - 0.6, 2.9, 0.75)
}

/* ------------------------------------------------------------ pet place --- */

function petPlace(b: Baldes): void {
  const p = Z.pet
  b.grama.push(bloco(p.x0, p.x1, C.base, C.grama, p.z0, p.z1, 6))
  b.pedra.push(bloco(p.x0 - 0.35, p.x1 + 0.35, C.base, Y + 0.2, p.z0 - 0.35, p.z1 + 0.35, 2))
  // cerca baixa em tela, postes a cada 3 m
  const h = 1.5
  for (let x = p.x0; x <= p.x1 + 0.01; x += 3) {
    b.metalEscuro.push(cilindro(0.05, 0.05, h, 6, [x, Y + h / 2, p.z0]))
    b.metalEscuro.push(cilindro(0.05, 0.05, h, 6, [x, Y + h / 2, p.z1]))
  }
  for (let z = p.z0; z <= p.z1 + 0.01; z += 3) {
    b.metalEscuro.push(cilindro(0.05, 0.05, h, 6, [p.x0, Y + h / 2, z]))
    b.metalEscuro.push(cilindro(0.05, 0.05, h, 6, [p.x1, Y + h / 2, z]))
  }
  for (const y of [Y + 0.5, Y + h]) {
    b.metalEscuro.push(bloco(p.x0, p.x1, y - 0.03, y + 0.03, p.z0 - 0.03, p.z0 + 0.03, 3))
    b.metalEscuro.push(bloco(p.x0, p.x1, y - 0.03, y + 0.03, p.z1 - 0.03, p.z1 + 0.03, 3))
    b.metalEscuro.push(bloco(p.x0 - 0.03, p.x0 + 0.03, y - 0.03, y + 0.03, p.z0, p.z1, 3))
    b.metalEscuro.push(bloco(p.x1 - 0.03, p.x1 + 0.03, y - 0.03, y + 0.03, p.z0, p.z1, 3))
  }
  // abrigo de sombra e bebedouro
  pergolado(b, p.x0 + 2, p.x0 + 6, p.z1 - 5, p.z1 - 1.5, 2.6, 0.8)
  b.pedra.push(bloco(p.x1 - 3.4, p.x1 - 2, Y + 0.1, Y + 0.75, p.z0 + 2, p.z0 + 3.2, 1.5))
}

/* ------------------------------------------------------------ montagem --- */

function montar(alta: boolean): Geos {
  const b: Baldes = {
    pedra: [],
    concreto: [],
    deck: [],
    madeira: [],
    grama: [],
    agua: [],
    espelho: [],
    quadra: [],
    borracha: [],
    vidro: [],
    metalClaro: [],
    metalEscuro: [],
    interior: [],
    brises: [],
  }

  /* piso geral de pedra, sob tudo, com o vão da piscina aberto */
  for (const parte of anel(-73.5, 73.5, C.base, C.pedra, -38.5, 38.5, PISCINA_VAO, 3)) {
    b.pedra.push(parte)
  }

  /* decks de madeira */
  for (const [x0, x1, z0, z1] of DECK_MADEIRA) {
    b.deck.push(bloco(x0, x1, C.base, C.deck, z0, z1, 1.8))
  }

  /* canteiros: grama com borda de pedra */
  for (const c of CANTEIROS_DECK) {
    b.grama.push(bloco(c.x0, c.x1, C.base, C.grama, c.z0, c.z1, 5))
    b.pedra.push(bloco(c.x0 - 0.28, c.x1 + 0.28, C.base, C.grama + 0.14, c.z0 - 0.28, c.z1 + 0.28, 1.5))
  }

  piscina(b)
  aguasDeApoio(b)
  pergolado(b, Z.deckMolhado.x0 + 0.6, Z.deckMolhado.x1 - 0.6, Z.deckMolhado.z0 + 0.6, Z.deckMolhado.z1 - 0.6, 3.1, 0.7)
  quadra(b)
  playground(b)
  churrasqueiras(b)
  petPlace(b)

  pavilhao(b, Z.coworking, 3.7, 'oeste', alta)
  pavilhao(b, Z.academia, 4.4, 'oeste', alta)
  pavilhao(b, Z.salao, 4.6, 'leste', alta)

  /* --------------------------------------------------------- mobiliário --- */
  const espreguicadeiras: Transf[] = []
  const hastes: Transf[] = []
  const abas: Transf[] = []
  const bancos: Transf[] = []

  // espreguiçadeiras em duas fileiras ao lado da raia
  const fileiras: Array<[number, number]> = [
    [Z.piscina.x1 + 2.5, 0],
    [Z.piscina.x0 - 4.4, Math.PI],
  ]
  const quantas = alta ? 7 : 4
  for (const [x, giro] of fileiras) {
    for (let i = 0; i < quantas; i++) {
      const z = 1.5 + (i * 12) / (quantas - 1)
      espreguicadeiras.push({ p: [x, C.deck, z], r: [0, giro, 0] })
    }
  }
  // espreguiçadeiras do deck molhado
  for (let i = 0; i < 3; i++) {
    espreguicadeiras.push({
      p: [Z.deckMolhado.x0 + 2.2, Y + 0.3, Z.deckMolhado.z0 + 2.3 + i * 4],
      r: [0, -Math.PI / 2, 0],
    })
  }
  // ombrelones
  const sombras = alta ? 5 : 3
  for (let i = 0; i < sombras; i++) {
    const z = 1.8 + (i * 11) / Math.max(1, sombras - 1)
    const x = Z.piscina.x1 + 4.5
    hastes.push({ p: [x, C.deck, z] })
    abas.push({ p: [x, C.deck, z], r: [0, hash(i, 31) * 1.2, 0] })
  }
  // bancos na circulação
  const pontos: Array<[number, number, number]> = [
    [-40, 14, 0],
    [-30, 14, 0],
    [30, 14, 0],
    [40, 14, 0],
    [-40, -27, Math.PI],
    [40, -27, Math.PI],
    [0, 28, 0],
    [-10, 34, 0],
    [10, 34, 0],
    [-62, 8, Math.PI / 2],
    [62, 8, -Math.PI / 2],
    [-24, -30, 0],
  ]
  for (const [x, z, giro] of pontos) bancos.push({ p: [x, C.pedra, z], r: [0, giro, 0] })

  return {
    pedra: mesclar(b.pedra),
    concreto: mesclar(b.concreto),
    deck: mesclar(b.deck),
    madeira: mesclar(b.madeira),
    grama: mesclar(b.grama),
    agua: mesclar(b.agua),
    espelho: mesclar(b.espelho),
    quadra: mesclar(b.quadra),
    borracha: mesclar(b.borracha),
    vidro: mesclar(b.vidro),
    metalClaro: mesclar(b.metalClaro),
    metalEscuro: mesclar(b.metalEscuro),
    interior: mesclar(b.interior),
    espreguicadeiras,
    hastes,
    abas,
    bancos,
    brises: b.brises,
  }
}

/* ---------------------------------------------------- peças instanciadas --- */

function geoEspreguicadeira(): THREE.BufferGeometry {
  const partes: THREE.BufferGeometry[] = [
    caixa(0.76, 0.1, 1.9, [0, 0.42, 0], { uv: 1 }),
    caixa(0.72, 0.09, 0.84, [0, 0.66, -0.78], { rx: -0.62, uv: 1 }),
  ]
  for (const dx of [-0.33, 0.33]) {
    for (const dz of [-0.8, 0.8]) {
      partes.push(caixa(0.07, 0.4, 0.07, [dx, 0.2, dz]))
    }
  }
  return mesclar(partes)
}

function geoBanco(): THREE.BufferGeometry {
  const partes: THREE.BufferGeometry[] = [caixa(2.0, 0.12, 0.52, [0, 0.46, 0], { uv: 1 })]
  for (const dx of [-0.75, 0.75]) partes.push(caixa(0.16, 0.4, 0.46, [dx, 0.2, 0], { uv: 1 }))
  partes.push(caixa(2.0, 0.5, 0.1, [0, 0.74, -0.24], { rx: -0.14, uv: 1 }))
  return mesclar(partes)
}

export function LajeLazer({ alta }: { alta: boolean }): ReactElement {
  const m = materiais()
  const g = useMemo(() => montar(alta), [alta])
  const inst = useMemo(
    () => ({
      espreguicadeira: geoEspreguicadeira(),
      banco: geoBanco(),
      haste: cilindro(0.05, 0.05, 2.6, 6, [0, 1.3, 0]),
      aba: cilindro(0.08, 2.1, 0.5, 10, [0, 2.65, 0]),
      brise: caixa(0.1, 3.2, 0.3, [0, 0, 0], { uv: 1.2 }),
    }),
    [],
  )

  return (
    <group name="laje-de-lazer">
      <Peca geometria={g.pedra} material={m.pedra} />
      <Peca geometria={g.concreto} material={m.concretoClaro} />
      <Peca geometria={g.deck} material={m.deck} />
      <Peca geometria={g.madeira} material={m.madeira} />
      <Peca geometria={g.grama} material={m.grama} sombra={false} />
      <Peca geometria={g.quadra} material={m.quadra} sombra={false} />
      <Peca geometria={g.borracha} material={m.borracha} sombra={false} />
      <Peca geometria={g.interior} material={m.interior} />
      <Peca geometria={g.metalEscuro} material={m.metalEscuro} />
      <Peca geometria={g.metalClaro} material={m.metalClaro} />
      <Peca geometria={g.agua} material={m.agua} sombra={false} />
      <Peca geometria={g.espelho} material={m.espelhoAgua} sombra={false} />
      <Peca geometria={g.vidro} material={m.vidro} sombra={false} />
      <Instancias geometria={inst.brise} material={m.madeira} itens={g.brises} inerte />
      <Instancias
        geometria={inst.espreguicadeira}
        material={m.deck}
        itens={g.espreguicadeiras}
        inerte
      />
      <Instancias geometria={inst.banco} material={m.madeira} itens={g.bancos} inerte />
      <Instancias geometria={inst.haste} material={m.metalClaro} itens={g.hastes} inerte />
      <Instancias geometria={inst.aba} material={m.faixa} itens={g.abas} inerte />
    </group>
  )
}
