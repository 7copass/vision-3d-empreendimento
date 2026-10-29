/**
 * O edifício: térreo com garagem, seis pavimentos de flats, empena do
 * logotipo, aleta da quina com o letreiro e coroamento.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * DE ONDE VEM A ARQUITETURA
 * ──────────────────────────────────────────────────────────────────────────
 * Não há projeto executivo. Tudo abaixo é lido dos renders comerciais em
 * `public/img/flat-premium-ii/` — fachada de dia, de entardecer e de noite,
 * mais o detalhe da varanda e o da garagem — e encaixado nas medidas que
 * `../world.ts` fixa: 34 × 20 m em planta, térreo de 3,90 m, seis pavimentos
 * de 2,95 m, varanda de 1,60 m, coroamento a 24,80 m.
 *
 * O que os renders mandam, e que esta geometria reproduz:
 *
 * · RITMO DE FACHADA alternado — prumada de varanda recuada, prumada de
 *   janela avançada. É o que dá relevo às duas faces longas: as varandas
 *   ficam no plano interno (z = ±8,4) e os cheios de janela avançam até o
 *   plano da planta (z = ±10). As varandas caem exatamente em
 *   `centroDaUnidade`, então o rótulo de cada flat aponta para a varanda dele.
 * · GUARDA-CORPO de tubo horizontal escuro com montante esbelto e uma
 *   grelha baixa na borda da laje — o detalhe do render da varanda.
 * · ESQUADRIA BRANCA, folha dupla nos cheios largos e báscula estreita nos
 *   cantos.
 * · BASE EM PEDRA empilhada quase preta, sob a faixa de aberturas de garagem,
 *   entre pilastras brancas.
 * · LÂMINAS VERTICAIS marrom-grafite correndo do térreo à cornija.
 * · EMPENA do logotipo no topo da ponta oeste, com o pórtico branco vazado
 *   que o render mostra recortando o céu.
 * · QUINA ARREDONDADA (raio 1,60 m, que é exatamente a sobra entre a última
 *   varanda da face sul, em x = 15,4, e a esquina em x = 17) com a aleta
 *   escura curva, o letreiro vertical e a marquise que a contorna.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * ESTRATÉGIA DE DESEMPENHO
 * ──────────────────────────────────────────────────────────────────────────
 * O pavimento tipo é UMA geometria mesclada por material, instanciada seis
 * vezes. Tudo que é contínuo de cima a baixo — lâminas, empena, aleta,
 * cornija, térreo — é outra geometria mesclada, desenhada uma vez. As janelas
 * acesas são um painel só, instanciado por abertura, com um atributo escalar
 * por instância. O edifício inteiro sai em pouco mais de vinte draw calls.
 */
import { useMemo } from 'react'
import type { ReactElement } from 'react'
import * as THREE from 'three'
import {
  ALTURA_COROAMENTO,
  ALTURA_TORRE,
  FLOOR_H,
  PAVIMENTOS,
  PODIUM,
  POSICOES,
  PRIMEIRO_ANDAR,
  TORRES,
  VARANDA,
  baseDoPavimento,
  centroDaUnidade,
} from '../world'
import { materiais } from './materiais'
import { Instancias, Peca } from './Instancias'
import {
  arcoHorizontal,
  arcoVertical,
  bloco,
  caixa,
  complemento,
  hash,
  mesclarOuVazio,
  painel,
  piso,
} from './util'
import type { Intervalo, Transf } from './util'

/* ------------------------------------------------------------- a planta --- */

const T = TORRES[0]
const W = T.largura // 34
const D = T.profundidade // 20
const BX = W / 2 // 17
const BZ = D / 2 // 10
/** Plano interno: o fundo das varandas, recuado de VARANDA. */
const IZ = BZ - VARANDA // 8,4

const LAJE = 0.24
const GUARDA = 1.06
/** Espessura da pele de fachada dos cheios de janela. */
const PELE = 0.22

/** Raio da quina arredondada. Ver a nota de topo: é a sobra exata do módulo. */
const RQ = 1.6
const QX = BX - RQ // 15,4
const QZ = BZ - RQ // 8,4 — coincide com o plano interno, e isso não é acaso

/** Cotas verticais do coroamento. */
const CORNIJA_0 = ALTURA_TORRE // 21,60
const CORNIJA_1 = CORNIJA_0 + 0.75
const CORNIJA_2 = CORNIJA_1 + 0.45
const PLATIBANDA = CORNIJA_2 + 0.6 // 23,40
/** Ático técnico e empena chegam à cota de coroamento do contrato. */
const TOPO = ALTURA_COROAMENTO // 24,80

/** Cotas do térreo. */
const PISO_TERREO = 0.12
const PEDRA_TOPO = 1.78
const VAO_TOPO = 3.12
const MARQUISE_0 = 3.35
const MARQUISE_1 = PODIUM.altura // 3,90
const BALANCO = 0.78

/* ------------------------------------------------- as faces e os módulos --- */

/** Normal cardeal da posição, lida do contrato e não reinterpretada. */
const normalDa = (p: number): 1 | -1 =>
  centroDaUnidade(T.id, PRIMEIRO_ANDAR, p)[2] < 0 ? -1 : 1

/** Eixo x da unidade, também do contrato: é onde o rótulo dela vai parar. */
const eixoDa = (p: number): number => centroDaUnidade(T.id, PRIMEIRO_ANDAR, p)[0]

interface Varanda {
  posicao: number
  x: number
  a: number
  b: number
}

interface Face {
  nz: 1 | -1
  /** Até onde a face vai em x. A sul para na quina arredondada. */
  limite: number
  varandas: Varanda[]
  cheios: Intervalo[]
}

function montarFaces(): Face[] {
  const saida: Face[] = []
  for (const nz of [-1, 1] as const) {
    const posicoes = POSICOES.filter((p) => normalDa(p) === nz)
    const passo = W / posicoes.length
    // 29% do módulo de cada lado: dá 3,3 m na face norte e 3,6 m na sul,
    // que é a varanda do render — pouco mais larga que o vão da porta.
    const meia = Math.min(1.8, passo * 0.29)
    const limite = nz > 0 ? QX : BX
    const varandas = posicoes.map((p) => {
      const x = eixoDa(p)
      return { posicao: p, x, a: x - meia, b: Math.min(x + meia, limite) }
    })
    saida.push({
      nz,
      limite,
      varandas,
      cheios: complemento(
        varandas.map((v) => ({ a: v.a, b: v.b })),
        -BX,
        limite,
      ),
    })
  }
  return saida
}

const FACES = montarFaces()

/**
 * Lâminas verticais escuras. Os renders põem uma em cada ponta das faces
 * longas e uma no meio, sempre sobre um cheio — nunca cortando varanda.
 */
function laminasDaFace(f: Face): Intervalo[] {
  if (f.cheios.length === 0) return []
  const ordenados = [...f.cheios].sort((p, q) => p.a - q.a)
  const meio = ordenados[Math.floor(ordenados.length / 2)]
  const escolhidos = [ordenados[0], meio, ordenados[ordenados.length - 1]]
  const vistos = new Set<number>()
  const saida: Intervalo[] = []
  for (const c of escolhidos) {
    if (vistos.has(c.a)) continue
    vistos.add(c.a)
    const largura = Math.min(0.95, (c.b - c.a) * 0.55)
    const cx = (c.a + c.b) / 2
    saida.push({ a: cx - largura / 2, b: cx + largura / 2 })
  }
  return saida
}

/* ---------------------------------------------------------- recipientes --- */

interface Baldes {
  branco: THREE.BufferGeometry[]
  nicho: THREE.BufferGeometry[]
  creme: THREE.BufferGeometry[]
  concreto: THREE.BufferGeometry[]
  granilite: THREE.BufferGeometry[]
  pedra: THREE.BufferGeometry[]
  escuro: THREE.BufferGeometry[]
  metal: THREE.BufferGeometry[]
  metalClaro: THREE.BufferGeometry[]
  lamela: THREE.BufferGeometry[]
  esquadria: THREE.BufferGeometry[]
  vidro: THREE.BufferGeometry[]
  interior: THREE.BufferGeometry[]
  led: THREE.BufferGeometry[]
  madeira: THREE.BufferGeometry[]
}

const baldes = (): Baldes => ({
  branco: [],
  nicho: [],
  creme: [],
  concreto: [],
  granilite: [],
  pedra: [],
  escuro: [],
  metal: [],
  metalClaro: [],
  lamela: [],
  esquadria: [],
  vidro: [],
  interior: [],
  led: [],
  madeira: [],
})

type Fechado = Record<keyof Baldes, THREE.BufferGeometry>

const fechar = (b: Baldes): Fechado =>
  Object.fromEntries(
    Object.entries(b).map(([k, v]) => [k, mesclarOuVazio(v as THREE.BufferGeometry[])]),
  ) as Fechado

/** Caixa com z medido PARA FORA da face: sempre na ordem certa. */
function naFace(
  nz: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  d0: number,
  d1: number,
  uv = 3,
): THREE.BufferGeometry {
  const za = nz * d0
  const zb = nz * d1
  return bloco(x0, x1, y0, y1, Math.min(za, zb), Math.max(za, zb), uv)
}

/* -------------------------------------------------------- pavimento tipo --- */

/** Esquadria branca de folha dupla, com vidro e um fundo escuro atrás. */
function janela(
  b: Baldes,
  nz: number,
  cx: number,
  largura: number,
  y0: number,
  y1: number,
  dist: number,
): void {
  const h = y1 - y0
  const cy = (y0 + y1) / 2
  const perfil = 0.07
  // marco: soleira, verga e duas ombreiras
  b.esquadria.push(naFace(nz, cx - largura / 2, cx + largura / 2, y0 - perfil, y0, dist, dist + 0.1))
  b.esquadria.push(naFace(nz, cx - largura / 2, cx + largura / 2, y1, y1 + perfil, dist, dist + 0.1))
  for (const s of [-1, 1]) {
    const x = cx + (s * largura) / 2
    b.esquadria.push(naFace(nz, x - perfil, x, y0, y1, dist, dist + 0.1, 1))
  }
  // montante central nas folhas largas: é o que o render mostra nos cheios
  if (largura > 1.5) {
    b.esquadria.push(naFace(nz, cx - 0.035, cx + 0.035, y0, y1, dist, dist + 0.1, 1))
  }
  b.vidro.push(painel(largura - 0.1, h - 0.05, [cx, cy, nz * (dist + 0.03)], nz > 0 ? 0 : Math.PI))
  b.interior.push(
    painel(largura, h + 0.1, [cx, cy, nz * (dist - 0.26)], nz > 0 ? 0 : Math.PI),
  )
}

/** Porta de correr da varanda: duas folhas de vidro em caixilho branco. */
function portaDaVaranda(
  b: Baldes,
  nz: number,
  cx: number,
  largura: number,
  y0: number,
  y1: number,
): void {
  const d = IZ
  const perfil = 0.08
  b.esquadria.push(naFace(nz, cx - largura / 2, cx + largura / 2, y1, y1 + perfil, d - 0.12, d))
  for (const s of [-1, 1]) {
    const x = cx + (s * largura) / 2
    b.esquadria.push(naFace(nz, x - perfil, x, y0, y1, d - 0.12, d, 1))
  }
  b.esquadria.push(naFace(nz, cx - 0.045, cx + 0.045, y0, y1, d - 0.14, d - 0.02, 1))
  b.vidro.push(
    painel(largura - 0.12, y1 - y0 - 0.04, [cx, (y0 + y1) / 2, nz * (d - 0.05)], nz > 0 ? 0 : Math.PI),
  )
}

/**
 * Guarda-corpo da varanda. O render é explícito: quatro tubos horizontais
 * escuros entre montantes finos, um perfil claro embaixo e uma grelha rasa
 * na borda da laje. Nada de vidro — este prédio não tem.
 */
function guardaCorpo(b: Baldes, nz: number, a: number, bb: number, alta: boolean): void {
  const d = BZ - 0.08
  const y0 = LAJE
  const topo = y0 + GUARDA
  const largura = bb - a
  // grelha baixa na borda
  b.metal.push(naFace(nz, a, bb, y0, y0 + 0.14, d - 0.03, d + 0.03, 0.5))
  // montantes
  const passo = alta ? 0.78 : 1.4
  const n = Math.max(2, Math.round(largura / passo))
  for (let i = 0; i <= n; i++) {
    const x = a + (largura * i) / n
    b.metal.push(naFace(nz, x - 0.025, x + 0.025, y0, topo, d - 0.02, d + 0.02, 1))
  }
  // tubos horizontais
  const alturas = alta
    ? [0.3, 0.52, 0.74, 0.96]
    : [0.42, 0.78]
  for (const dy of alturas) {
    b.metal.push(naFace(nz, a, bb, y0 + dy - 0.022, y0 + dy + 0.022, d - 0.022, d + 0.022, 1))
  }
  // corrimão e perfil inferior claros
  b.metalClaro.push(naFace(nz, a, bb, topo, topo + 0.05, d - 0.045, d + 0.045, 1))
  b.metalClaro.push(naFace(nz, a, bb, y0 + 0.16, y0 + 0.2, d - 0.035, d + 0.035, 1))
}

/** Um pavimento tipo inteiro, em coordenadas locais (y = 0 na base da laje). */
function pavimentoTipo(alta: boolean): Fechado {
  const b = baldes()

  /* laje de planta cheia e testeira contínua */
  b.concreto.push(bloco(-BX, BX, 0, LAJE, -BZ, BZ, 5))
  for (const nz of [-1, 1]) {
    b.creme.push(naFace(nz, -BX, BX, -0.1, LAJE + 0.04, BZ, BZ + 0.07, 3))
  }
  b.creme.push(bloco(-BX - 0.07, -BX, -0.1, LAJE + 0.04, -BZ, BZ, 3))
  b.creme.push(bloco(BX, BX + 0.07, -0.1, LAJE + 0.04, -BZ, QZ, 3))

  /* miolo opaco: o prédio não é transparente de lado a lado */
  b.interior.push(bloco(-BX + 0.3, BX - 0.3, LAJE, FLOOR_H, -IZ + 0.2, IZ - 0.2, 4))

  /* empenas leste e oeste: cegas, menos pela prumada da escada.
     O render mostra, ao lado da aleta da quina, um rasgo vertical estreito
     com esquadria branca em todos os pavimentos — a caixa de escada. Sem ele
     a empena vira 20 × 21 m de parede lisa, que é o que mais denuncia
     maquete num prédio de esquina. */
  for (const sx of [-1, 1] as const) {
    const x0 = sx > 0 ? BX - 0.3 : -BX
    const x1 = sx > 0 ? BX : -BX + 0.3
    const zLim = sx > 0 ? QZ : BZ
    const zc = 3.2
    const meia = 0.72
    b.branco.push(bloco(x0, x1, LAJE, FLOOR_H, -BZ, zc - meia, 3))
    b.branco.push(bloco(x0, x1, LAJE, FLOOR_H, zc + meia, zLim, 3))
    b.branco.push(bloco(x0, x1, LAJE, LAJE + 0.45, zc - meia, zc + meia, 2))
    b.interior.push(bloco(x0 - 0.3, x1 - 0.3, LAJE, FLOOR_H, zc - meia, zc + meia, 3))
    const giro = sx > 0 ? Math.PI / 2 : -Math.PI / 2
    const xf = sx * (BX - 0.04)
    b.vidro.push(painel(meia * 2 - 0.16, FLOOR_H - LAJE - 0.6, [xf, LAJE + 0.45 + (FLOOR_H - LAJE - 0.6) / 2, zc], giro))
    for (const dz of [-meia, meia]) {
      b.esquadria.push(
        caixa(0.12, FLOOR_H - LAJE - 0.45, 0.09, [sx * (BX - 0.03), LAJE + 0.45 + (FLOOR_H - LAJE - 0.45) / 2, zc + dz * 0.94], { uv: 1 }),
      )
    }
    b.esquadria.push(
      caixa(0.12, 0.09, meia * 2, [sx * (BX - 0.03), FLOOR_H - 0.07, zc], { uv: 1 }),
    )
  }
  // a quina arredondada fecha o canto sudeste
  b.branco.push(arcoVertical([QX, QZ], 0.85, 1.7, LAJE, FLOOR_H, 0, Math.PI / 2, 7))

  for (const f of FACES) {
    const nz = f.nz

    /* cheios de janela: avançam do plano interno ao plano da planta */
    for (const c of f.cheios) {
      const largura = c.b - c.a
      const vao = Math.min(2.5, Math.max(0.5, largura - 0.78))
      const y0 = LAJE + 0.75
      const y1 = y0 + 1.62

      // pele externa recortada em quatro peças em volta do vão
      const jx0 = (c.a + c.b) / 2 - vao / 2
      const jx1 = (c.a + c.b) / 2 + vao / 2
      b.branco.push(naFace(nz, c.a, jx0, LAJE, FLOOR_H, BZ - PELE, BZ))
      b.branco.push(naFace(nz, jx1, c.b, LAJE, FLOOR_H, BZ - PELE, BZ))
      b.branco.push(naFace(nz, jx0, jx1, LAJE, y0, BZ - PELE, BZ))
      b.branco.push(naFace(nz, jx0, jx1, y1, FLOOR_H, BZ - PELE, BZ))
      // ombreiras laterais do volume avançado
      b.branco.push(naFace(nz, c.a, c.a + 0.16, LAJE, FLOOR_H, IZ, BZ))
      b.branco.push(naFace(nz, c.b - 0.16, c.b, LAJE, FLOOR_H, IZ, BZ))
      // caixa escura atrás da pele
      b.interior.push(naFace(nz, c.a + 0.16, c.b - 0.16, LAJE, FLOOR_H, IZ, BZ - PELE, 4))

      janela(b, nz, (c.a + c.b) / 2, vao, y0, y1, BZ)
    }

    /* varandas */
    for (const v of f.varandas) {
      const largura = v.b - v.a
      // fundo do nicho, recortado em volta da porta
      const pLarg = Math.min(2.5, largura - 0.5)
      const px0 = v.x - pLarg / 2
      const px1 = v.x + pLarg / 2
      const py1 = LAJE + 2.26
      b.nicho.push(naFace(nz, v.a, px0, LAJE, FLOOR_H, IZ, IZ + 0.14))
      b.nicho.push(naFace(nz, px1, v.b, LAJE, FLOOR_H, IZ, IZ + 0.14))
      b.nicho.push(naFace(nz, px0, px1, py1, FLOOR_H, IZ, IZ + 0.14))
      // teto e piso da varanda
      b.nicho.push(naFace(nz, v.a, v.b, FLOOR_H - 0.06, FLOOR_H, IZ, BZ - 0.1, 3))
      b.granilite.push(piso(largura - 0.04, VARANDA - 0.2, [(v.a + v.b) / 2, LAJE + 0.015, nz * (IZ + VARANDA / 2 - 0.05)], 1.2))

      portaDaVaranda(b, nz, v.x, pLarg, LAJE, py1)
      guardaCorpo(b, nz, v.a, v.b, alta)

      /* luz de forro: a linha quente que o render noturno põe em toda varanda */
      // a fita fica no alto do nicho, VIRADA PARA FORA: a câmera do tour olha
      // de cima, e uma fita só no forro some atrás da própria laje
      b.led.push(naFace(nz, v.a + 0.3, v.b - 0.3, FLOOR_H - 0.36, FLOOR_H - 0.19, IZ + 0.12, IZ + 0.2, 1))
      if (alta) {
        b.led.push(naFace(nz, v.a + 0.3, v.b - 0.3, FLOOR_H - 0.09, FLOOR_H - 0.06, BZ - 0.5, BZ - 0.24, 1))
      }
    }
  }

  return fechar(b)
}

/* ------------------------------------------ corpo contínuo e coroamento --- */

/**
 * Faixa de LED. A altura de 16 cm não é capricho de projeto: a 80 m, que é a
 * distância da câmera de órbita, um perfil de 5 cm dá meio pixel na tela e
 * some. 16 cm dá quase dois, e o bloom pega.
 */
const FITA = 0.16

function fitaH(b: Baldes, x0: number, x1: number, y: number, z0: number, z1: number): void {
  b.led.push(bloco(x0, x1, y, y + FITA, z0, z1, 1))
}

function corpoContinuo(alta: boolean): Fechado {
  const b = baldes()
  const yBase = PODIUM.altura

  /* ------------------------------------------------------------- térreo */

  // piso da garagem e do hall
  b.concreto.push(piso(W, D, [0, PISO_TERREO, 0], 6))

  // pilastras brancas, que é o que ritma a base no render
  const pilastras = [-BX, -10.6, -2.4, 6.2, QX]
  for (const x of pilastras) {
    const x0 = Math.max(-BX, x - 0.45)
    const x1 = Math.min(BX, x + 0.45)
    for (const nz of [-1, 1]) {
      if (nz > 0 && x > QX - 0.5) continue
      b.branco.push(naFace(nz, x0, x1, PISO_TERREO, MARQUISE_0, BZ - 0.12, BZ + 0.12, 2))
    }
  }

  /** Vãos de garagem e de hall, por face. */
  interface Abertura {
    nz: 1 | -1
    a: number
    b: number
    tipo: 'garagem' | 'hall'
  }
  const aberturas: Abertura[] = [
    { nz: -1, a: -BX + 0.45, b: -11.05, tipo: 'garagem' },
    { nz: -1, a: -10.15, b: -2.85, tipo: 'garagem' },
    { nz: -1, a: -1.95, b: 5.75, tipo: 'garagem' },
    { nz: -1, a: 6.65, b: BX - 0.45, tipo: 'garagem' },
    { nz: 1, a: -BX + 0.45, b: -11.05, tipo: 'garagem' },
    { nz: 1, a: -10.15, b: -2.85, tipo: 'garagem' },
    { nz: 1, a: -1.95, b: 5.75, tipo: 'garagem' },
    { nz: 1, a: 6.65, b: QX - 0.45, tipo: 'hall' },
  ]

  for (const ab of aberturas) {
    const nz = ab.nz
    if (ab.tipo === 'garagem') {
      // base de pedra empilhada
      b.pedra.push(naFace(nz, ab.a, ab.b, PISO_TERREO, PEDRA_TOPO, BZ - 0.1, BZ, 1.6))
      // vão escuro recuado, com lâminas de ventilação
      b.interior.push(naFace(nz, ab.a, ab.b, PEDRA_TOPO, VAO_TOPO, BZ - 0.62, BZ - 0.5, 2))
      if (alta) {
        b.lamela.push(
          painel(ab.b - ab.a, VAO_TOPO - PEDRA_TOPO, [
            (ab.a + ab.b) / 2,
            (PEDRA_TOPO + VAO_TOPO) / 2,
            nz * (BZ - 0.22),
          ], nz > 0 ? 0 : Math.PI, 0.9),
        )
      }
      // luz rasante que lava a pedra à noite
      b.led.push(naFace(nz, ab.a + 0.2, ab.b - 0.2, PEDRA_TOPO - 0.16, PEDRA_TOPO, BZ - 0.5, BZ - 0.42, 1))
      // verga branca
      b.branco.push(naFace(nz, ab.a, ab.b, VAO_TOPO, MARQUISE_0, BZ - 0.12, BZ, 2))
    } else {
      /* hall social: vitrine de vidro com montantes brancos e porta de madeira */
      b.interior.push(naFace(nz, ab.a, ab.b, PISO_TERREO, VAO_TOPO + 0.2, BZ - 3.6, BZ - 3.4, 3))
      b.branco.push(naFace(nz, ab.a, ab.b, VAO_TOPO, MARQUISE_0, BZ - 0.12, BZ, 2))
      b.esquadria.push(naFace(nz, ab.a, ab.b, PISO_TERREO, PISO_TERREO + 0.08, BZ - 0.16, BZ - 0.04, 1))
      b.esquadria.push(naFace(nz, ab.a, ab.b, VAO_TOPO - 0.09, VAO_TOPO, BZ - 0.16, BZ - 0.04, 1))
      const n = Math.max(3, Math.round((ab.b - ab.a) / 1.25))
      for (let i = 0; i <= n; i++) {
        const x = ab.a + ((ab.b - ab.a) * i) / n
        b.esquadria.push(naFace(nz, x - 0.05, x + 0.05, PISO_TERREO, VAO_TOPO, BZ - 0.16, BZ - 0.04, 1))
      }
      b.vidro.push(
        painel(ab.b - ab.a, VAO_TOPO - PISO_TERREO, [
          (ab.a + ab.b) / 2,
          (PISO_TERREO + VAO_TOPO) / 2,
          nz * (BZ - 0.1),
        ], nz > 0 ? 0 : Math.PI),
      )
      // porta dupla de madeira ao centro
      const cx = (ab.a + ab.b) / 2 - 1.1
      for (const s of [-1, 1]) {
        b.madeira.push(naFace(nz, cx + s * 0.44 - 0.42, cx + s * 0.44 + 0.42, PISO_TERREO, PISO_TERREO + 2.35, BZ - 0.26, BZ - 0.18, 1.2))
      }
      // forro iluminado do hall
      fitaH(b, ab.a + 0.3, ab.b - 0.3, VAO_TOPO - 0.22, nz * (BZ - 1.1), nz * (BZ - 0.9))
    }
  }

  /* portão de veículos na rua lateral (face leste) */
  b.pedra.push(bloco(BX - 0.1, BX, PISO_TERREO, PEDRA_TOPO, -BZ + 0.4, -1.2, 1.6))
  b.branco.push(bloco(BX - 0.12, BX, VAO_TOPO, MARQUISE_0, -BZ, QZ, 2))
  b.interior.push(bloco(BX - 0.62, BX - 0.5, PISO_TERREO, VAO_TOPO, -0.8, 6.6, 2))
  b.lamela.push(painel(7.4, VAO_TOPO - PISO_TERREO, [BX - 0.22, (PISO_TERREO + VAO_TOPO) / 2, 2.9], Math.PI / 2, 0.9))
  b.metalClaro.push(bloco(BX - 0.3, BX - 0.12, PISO_TERREO, VAO_TOPO, -0.9, -0.7, 1))
  b.metalClaro.push(bloco(BX - 0.3, BX - 0.12, PISO_TERREO, VAO_TOPO, 6.5, 6.7, 1))
  b.pedra.push(bloco(BX - 0.1, BX, PISO_TERREO, PEDRA_TOPO, 6.8, QZ, 1.6))

  /* marquise: contorna as duas ruas e vira na quina arredondada */
  b.creme.push(bloco(-BX - BALANCO, QX, MARQUISE_0, MARQUISE_1, BZ, BZ + BALANCO, 3))
  b.creme.push(bloco(-BX - BALANCO, BX, MARQUISE_0, MARQUISE_1, -BZ - BALANCO, -BZ, 3))
  b.creme.push(bloco(BX, BX + BALANCO, MARQUISE_0, MARQUISE_1, -BZ - BALANCO, QZ, 3))
  b.creme.push(bloco(-BX - BALANCO, -BX, MARQUISE_0, MARQUISE_1, -BZ - BALANCO, BZ + BALANCO, 3))
  b.creme.push(arcoHorizontal([QX, QZ], RQ, RQ + BALANCO, MARQUISE_0, MARQUISE_1, 0, Math.PI / 2, 9))
  // linha de luz sob a marquise
  fitaH(b, -BX - 0.5, QX, MARQUISE_0 + 0.16, BZ + BALANCO - 0.03, BZ + BALANCO + 0.02)
  fitaH(b, -BX - 0.5, BX, MARQUISE_0 + 0.16, -BZ - BALANCO - 0.02, -BZ - BALANCO + 0.03)
  b.led.push(
    bloco(BX + BALANCO - 0.03, BX + BALANCO + 0.02, MARQUISE_0 + 0.16, MARQUISE_0 + 0.16 + FITA, -BZ - BALANCO, QZ, 1),
  )

  /* quina arredondada do térreo, em pedra sob a vitrine */
  b.branco.push(arcoVertical([QX, QZ], 0.85, 1.7, PISO_TERREO, MARQUISE_0, 0, Math.PI / 2, 7))

  /* ------------------------------------------------- lâminas verticais */

  for (const f of FACES) {
    for (const l of laminasDaFace(f)) {
      b.escuro.push(naFace(f.nz, l.a, l.b, PISO_TERREO, CORNIJA_1, BZ, BZ + 0.14, 2.5))
      // fio de luz em cada borda da lâmina
      for (const x of [l.a, l.b]) {
        b.led.push(naFace(f.nz, x - 0.08, x + 0.08, yBase, CORNIJA_0, BZ + 0.14, BZ + 0.19, 1))
      }
    }
  }

  /* ---------------------------------------------------------- cornija */

  const cornija = (p: number, y0: number, y1: number) => {
    b.creme.push(bloco(-BX - p, QX, y0, y1, BZ, BZ + p, 3))
    b.creme.push(bloco(-BX - p, BX + p, y0, y1, -BZ - p, -BZ, 3))
    b.creme.push(bloco(BX, BX + p, y0, y1, -BZ - p, QZ, 3))
    b.creme.push(bloco(-BX - p, -BX, y0, y1, -BZ - p, BZ + p, 3))
    b.creme.push(arcoHorizontal([QX, QZ], RQ, RQ + p, y0, y1, 0, Math.PI / 2, 9))
  }
  cornija(0.62, CORNIJA_0, CORNIJA_1)
  cornija(0.3, CORNIJA_1, CORNIJA_2)
  // a linha de luz do coroamento, que no render noturno desenha o prédio inteiro
  const yFita = CORNIJA_0 + 0.3
  fitaH(b, -BX - 0.62, QX, yFita, BZ + 0.59, BZ + 0.64)
  fitaH(b, -BX - 0.62, BX + 0.62, yFita, -BZ - 0.64, -BZ - 0.59)
  b.led.push(bloco(BX + 0.59, BX + 0.64, yFita, yFita + FITA, -BZ - 0.62, QZ, 1))
  b.led.push(bloco(-BX - 0.64, -BX - 0.59, yFita, yFita + FITA, -BZ - 0.62, BZ + 0.62, 1))
  b.led.push(arcoVertical([QX, QZ], RQ + 0.6, 0.06, yFita, yFita + FITA, 0, Math.PI / 2, 9))

  /* laje de cobertura e platibanda */
  b.branco.push(bloco(-BX, BX, CORNIJA_2, PLATIBANDA - 0.35, -BZ, BZ, 4))
  b.concreto.push(piso(W, D, [0, PLATIBANDA - 0.34, 0], 5))
  // platibanda em anel: a laje de cobertura fica à vista, com o ático em cima
  for (const [x0, x1, z0, z1] of [
    [-BX, BX, BZ - 0.3, BZ],
    [-BX, BX, -BZ, -BZ + 0.3],
    [-BX, -BX + 0.3, -BZ, BZ],
    [BX - 0.3, BX, -BZ, BZ],
  ] as const) {
    b.creme.push(bloco(x0, x1, PLATIBANDA - 0.35, PLATIBANDA, z0, z1, 3))
  }

  /* ático técnico: casa de máquinas e reservatório */
  b.branco.push(bloco(-3.4, 3.4, PLATIBANDA, TOPO - 0.35, -3.2, 3.2, 4))
  b.creme.push(bloco(-3.6, 3.6, TOPO - 0.35, TOPO - 0.1, -3.4, 3.4, 4))
  if (alta) {
    b.lamela.push(painel(5.6, 1.6, [0, PLATIBANDA + 1.1, 3.22], 0, 0.9))
  }

  /* ------------------------------------- empena do logotipo (quina sudoeste)

     O render põe a empena escura do logotipo no extremo de uma fachada e a
     aleta curva na outra ponta — as duas âncoras verticais que seguram a
     composição. Aqui ela toma a quina SUDOESTE: uma lâmina em L que desce do
     coroamento ao térreo, vira na empena cega oeste e sobe 1,4 m acima da
     platibanda, de onde o monograma recorta o céu. Fica na faixa de cheio
     entre a esquina e a primeira varanda, então não tapa varanda nenhuma. */

  const EX0 = -BX - 0.45
  const EX1 = EX0 + 2.1 // para em x = −15,35; a varanda 02 começa em −15,4
  const EZ = BZ + 0.45
  b.escuro.push(bloco(EX0, EX1, PISO_TERREO, TOPO, BZ - 0.1, EZ, 2.5))
  b.escuro.push(bloco(EX0, -BX, PISO_TERREO, TOPO, 6.4, EZ, 2.5))
  for (const x of [EX0 + 0.05, EX1 - 0.05]) {
    b.led.push(bloco(x - 0.09, x + 0.09, yBase, TOPO - 0.35, EZ - 0.04, EZ + 0.02, 1))
  }

  // pórtico branco vazado ao lado, que no render recorta o céu junto da empena
  const PX0 = EX1 + 0.15
  const PX1 = PX0 + 5.2
  const PY0 = CORNIJA_2
  const PY1 = TOPO - 0.2
  const perfil = 0.42
  b.creme.push(bloco(PX0, PX1, PY1 - perfil, PY1, BZ - 0.1, BZ + 0.4, 3))
  b.creme.push(bloco(PX0, PX0 + perfil, PY0, PY1, BZ - 0.1, BZ + 0.4, 3))
  b.creme.push(bloco(PX1 - perfil, PX1, PY0, PY1, BZ - 0.1, BZ + 0.4, 3))
  fitaH(b, PX0, PX1, PY1 - perfil - 0.06, BZ + 0.36, BZ + 0.44)

  /* ----------------------------------------- aleta da quina e letreiro */

  const ALETA_0 = MARQUISE_0
  const ALETA_1 = CORNIJA_0 - 1.0
  const ESP = 0.42
  b.escuro.push(arcoVertical([QX, QZ], RQ + ESP / 2 + 0.06, ESP, ALETA_0, ALETA_1, 0, Math.PI / 2, 11))
  // retorno arredondado do topo: a aleta curva para dentro, como no render
  const RET = 1.45
  const passos = alta ? 7 : 4
  for (let i = 0; i < passos; i++) {
    const a0 = (i / passos) * (Math.PI / 2)
    const a1 = ((i + 1) / passos) * (Math.PI / 2)
    const y0 = ALETA_1 + RET * Math.sin(a0)
    const y1 = ALETA_1 + RET * Math.sin(a1)
    const r = RQ + ESP / 2 + 0.06 - RET * (1 - Math.cos((a0 + a1) / 2))
    b.escuro.push(arcoVertical([QX, QZ], r, ESP, y0, y1 + 0.02, 0, Math.PI / 2, 9))
  }
  // fio de luz nas duas bordas da aleta
  for (const a of [0, Math.PI / 2]) {
    b.led.push(arcoVertical([QX, QZ], RQ + ESP + 0.1, 0.08, ALETA_0, ALETA_1, a - 0.035, a + 0.035, 1))
  }

  return fechar(b)
}

/* ------------------------------------------------------- janelas acesas --- */

/**
 * À noite acende o FLAT, não a esquadria: a porta da varanda e as janelas da
 * mesma unidade compartilham o limiar, então o apartamento inteiro aparece de
 * uma vez e os vizinhos aparecem em momentos diferentes ao longo do
 * crepúsculo. Tudo determinístico pela posição — o mesmo desenho de luzes a
 * cada abertura do tour.
 */
function janelasAcesas(): { itens: Transf[]; acende: Float32Array } {
  const itens: Transf[] = []
  const limiares: number[] = []

  /** Unidade mais próxima de um x, naquela face: a quem o cheio pertence. */
  const unidadeDoCheio = (f: Face, x: number): number =>
    f.varandas.reduce((melhor, v) =>
      Math.abs(v.x - x) < Math.abs(melhor.x - x) ? v : melhor,
    ).posicao

  for (const andar of PAVIMENTOS) {
    const y = baseDoPavimento(andar)
    for (const f of FACES) {
      const nz = f.nz
      const giro = nz > 0 ? 0 : Math.PI

      const registrar = (
        posicao: number,
        largura: number,
        altura: number,
        p: [number, number, number],
        brilho: number,
      ) => {
        if (hash(andar, posicao, 1) > 0.64) return
        limiares.push(0.05 + hash(andar, posicao, 5) * 0.44)
        itens.push({
          p,
          r: [0, giro, 0],
          s: [largura, altura, 1],
          cor: new THREE.Color(1, 0.84, 0.63).multiplyScalar(brilho),
        })
      }

      for (const v of f.varandas) {
        const pLarg = Math.min(2.5, v.b - v.a - 0.5)
        registrar(
          v.posicao,
          pLarg - 0.2,
          2.02,
          [v.x, y + LAJE + 1.15, nz * (IZ - 0.18)],
          0.78 + hash(andar, v.posicao, 3) * 0.4,
        )
      }
      for (const c of f.cheios) {
        const cx = (c.a + c.b) / 2
        const posicao = unidadeDoCheio(f, cx)
        const vao = Math.min(2.5, Math.max(0.5, c.b - c.a - 0.78))
        // um ambiente em cada três fica no escuro, como em prédio de verdade
        if (hash(andar, posicao, Math.round(cx * 10), 2) < 0.3) continue
        registrar(
          posicao,
          vao - 0.14,
          1.5,
          [cx, y + LAJE + 1.56, nz * (BZ - 0.22)],
          0.72 + hash(andar, cx, 7) * 0.45,
        )
      }
    }
  }
  return { itens, acende: new Float32Array(limiares) }
}

/* ----------------------------------------------------------- componente --- */

export function Edificio({ alta, acesas }: { alta: boolean; acesas: boolean }): ReactElement {
  const m = materiais()
  const tipo = useMemo(() => pavimentoTipo(alta), [alta])
  const corpo = useMemo(() => corpoContinuo(alta), [alta])

  const pavimentos = useMemo<Transf[]>(
    () => PAVIMENTOS.map((a) => ({ p: [0, baseDoPavimento(a), 0] as const })),
    [],
  )
  const luzes = useMemo(() => janelasAcesas(), [])
  const atributosDeLuz = useMemo(() => ({ aAcende: luzes.acende }), [luzes])
  const painelAceso = useMemo(() => painel(1, 1, [0, 0, 0]), [])

  /** Letreiro vertical e monograma: planos avulsos, com alfa recortado. */
  const letreiroGeo = useMemo(() => {
    const r = RQ + 0.42 + 0.34
    const a = Math.PI / 4
    return painel(1.25, 11, [QX + Math.sin(a) * r, 15.4, QZ + Math.cos(a) * r], a)
  }, [])
  const logoGeo = useMemo(
    () => painel(1.5, 1.5, [-BX + 0.6, TOPO - 1.55, BZ + 0.47]),
    [],
  )

  return (
    <group name="edificio">
      {/* pavimento tipo, instanciado seis vezes */}
      <Instancias geometria={tipo.concreto} material={m.concreto} itens={pavimentos} />
      <Instancias geometria={tipo.branco} material={m.rebocoBranco} itens={pavimentos} />
      <Instancias geometria={tipo.nicho} material={m.rebocoNicho} itens={pavimentos} />
      <Instancias geometria={tipo.creme} material={m.rebocoCreme} itens={pavimentos} />
      <Instancias geometria={tipo.granilite} material={m.granilite} itens={pavimentos} />
      <Instancias geometria={tipo.interior} material={m.interior} itens={pavimentos} />
      <Instancias geometria={tipo.esquadria} material={m.esquadria} itens={pavimentos} sombra={alta} />
      <Instancias geometria={tipo.metal} material={m.metalEscuro} itens={pavimentos} sombra={alta} />
      <Instancias geometria={tipo.metalClaro} material={m.metalClaro} itens={pavimentos} sombra={false} />
      <Instancias geometria={tipo.vidro} material={m.vidro} itens={pavimentos} sombra={false} />
      <Instancias
        geometria={tipo.led}
        material={m.fitaLed}
        itens={pavimentos}
        sombra={false}
        recebe={false}
      />

      {/* térreo, lâminas, cornija, empena e aleta: contínuos, desenhados uma vez */}
      <Peca geometria={corpo.branco} material={m.rebocoBranco} />
      <Peca geometria={corpo.creme} material={m.rebocoCreme} />
      <Peca geometria={corpo.concreto} material={m.concreto} />
      <Peca geometria={corpo.pedra} material={m.pedraEscura} />
      <Peca geometria={corpo.escuro} material={m.pinturaEscura} />
      <Peca geometria={corpo.metal} material={m.metalEscuro} sombra={alta} />
      <Peca geometria={corpo.metalClaro} material={m.metalClaro} sombra={false} />
      <Peca geometria={corpo.lamela} material={m.lamela} sombra={alta} />
      <Peca geometria={corpo.esquadria} material={m.esquadria} sombra={alta} />
      <Peca geometria={corpo.madeira} material={m.madeira} />
      <Peca geometria={corpo.interior} material={m.interior} />
      <Peca geometria={corpo.vidro} material={m.vidro} sombra={false} />
      <Peca geometria={corpo.led} material={m.fitaLed} sombra={false} recebe={false} />

      {/* letreiro da quina e monograma da empena */}
      <Peca geometria={letreiroGeo} material={m.letreiro} sombra={false} recebe={false} />
      <Peca geometria={logoGeo} material={m.logotipo} sombra={false} recebe={false} />

      {/* janelas acesas: aditivas e desenhadas DEPOIS do vidro, senão a pele
          escura da fachada come a maior parte da luz de cada flat */}
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
