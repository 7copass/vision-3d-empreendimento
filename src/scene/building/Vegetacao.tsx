/**
 * Paisagismo. Tudo instanciado: três espécies esquemáticas (árvore de copa larga,
 * palmeira e arbusto) distribuídas por canteiros declarados. A distribuição é
 * determinística — o mesmo jardim a cada reload, nada de cintilar entre sessões.
 */
import { useMemo } from 'react'
import type { ReactElement } from 'react'
import * as THREE from 'three'
import { NORMAL_POSICAO, OFFSET_POSICAO, PODIUM, TORRES, VISTA_RECUO } from '../../empreendimentos/village-one/world'
import type { Posicao } from '../../core/types'
import { materiais } from './materiais'
import { VIAS } from './Terreno'
import { Instancias } from './Instancias'
import { caixa, cilindro, esferaAchatada, hash, mesclar } from './util'
import type { Transf } from './util'

export interface Canteiro {
  x0: number
  x1: number
  z0: number
  z1: number
  /** Densidade relativa de plantio. 1 = jardim cheio, 0.3 = faixa rala. */
  densidade?: number
  /** Proporção de palmeiras no canteiro. */
  palmas?: number
}

const TOPO_DECK = PODIUM.altura
const TOPO_TERRA = 0.2

/* ------------------------------------------------- canteiros declarados --- */

/** Canteiros da laje de lazer. LajeLazer desenha a borda e a grama destes. */
/* ------------------------------------------------- eixos de vista ------- */

interface Eixo {
  de: [number, number]
  dir: [number, number]
}

/**
 * A linha que cada unidade enxerga pela varanda, em planta — reconstruída da
 * mesma regra de `varandaDaUnidade` em core/world.ts. Oito eixos: quatro
 * posições × duas torres.
 */
const EIXOS_DE_VISTA: Eixo[] = TORRES.flatMap((t) =>
  ([1, 2, 3, 4] as Posicao[]).map((pos) => {
    const [ox, oz] = OFFSET_POSICAO[pos]
    const [nx, nz] = NORMAL_POSICAO[pos]
    const x = nx !== 0 ? t.centro[0] + nx * (t.largura / 2 - VISTA_RECUO) : t.centro[0] + (ox * t.largura) / 4
    const z =
      nz !== 0 ? t.centro[2] + nz * (t.profundidade / 2 - VISTA_RECUO) : t.centro[2] + (oz * t.profundidade) / 4
    return { de: [x, z] as [number, number], dir: [nx, nz] as [number, number] }
  }),
)

/** Meia-largura do corredor livre. Uma copa chega a 3 m de raio. */
const FOLGA_EIXO = 4.4
const ALCANCE_EIXO = 42

/**
 * O ponto cai no corredor de vista de alguma unidade? Árvore e palmeira na
 * laje sobem 9 m acima do deck e, nos primeiros pavimentos, ficam na altura
 * exata da lente — por isso o corredor é reservado para porte baixo.
 */
function noEixoDeVista(x: number, z: number): boolean {
  for (const e of EIXOS_DE_VISTA) {
    const dx = x - e.de[0]
    const dz = z - e.de[1]
    const aoLongo = dx * e.dir[0] + dz * e.dir[1]
    if (aoLongo < -1.5 || aoLongo > ALCANCE_EIXO) continue
    if (Math.abs(dz * e.dir[0] - dx * e.dir[1]) < FOLGA_EIXO) return true
  }
  return false
}

export const CANTEIROS_DECK: Canteiro[] = [
  { x0: -73, x1: 73, z0: 36, z1: 38.5, densidade: 0.5, palmas: 0.3 },
  { x0: -73, x1: 73, z0: -38.5, z1: -37.2, densidade: 0.5, palmas: 0.1 },
  { x0: -73.5, x1: -71, z0: -36, z1: 36, densidade: 0.5, palmas: 0.2 },
  { x0: 71, x1: 73.5, z0: -36, z1: 36, densidade: 0.5, palmas: 0.2 },
  { x0: -43, x1: -23, z0: -24, z1: -19.5, densidade: 0.8 },
  { x0: 23, x1: 43, z0: -24, z1: -19.5, densidade: 0.8 },
  { x0: -49, x1: -31, z0: 7.5, z1: 11.5, densidade: 0.8, palmas: 0.35 },
  { x0: 31, x1: 40, z0: 7.5, z1: 11.5, densidade: 0.8, palmas: 0.35 },
  // avental verde das torres: as alas que a academia e o salão desocuparam
  { x0: -71, x1: -52, z0: -16, z1: 6, densidade: 1, palmas: 0.3 },
  { x0: 52, x1: 71, z0: -16, z1: 6, densidade: 1, palmas: 0.3 },
  { x0: -70, x1: -52, z0: 9, z1: 31, densidade: 1, palmas: 0.3 },
  { x0: 60, x1: 71, z0: 9, z1: 31, densidade: 1, palmas: 0.25 },
  { x0: -48, x1: -33, z0: 16, z1: 32, densidade: 1, palmas: 0.2 },
  { x0: 22, x1: 40, z0: -34, z1: -27, densidade: 0.9 },
  { x0: -7, x1: 7, z0: 26, z1: 34, densidade: 0.9, palmas: 0.45 },
  { x0: -21, x1: -8, z0: -34, z1: -27, densidade: 0.9 },
]

/** Canteiros do térreo: recuos do lote, canteiro central da avenida. */
export const CANTEIROS_TERRENO: Canteiro[] = [
  { x0: -77, x1: 77, z0: PODIUM.profundidade / 2, z1: VIAS.calcadaSul.z0, densidade: 0.9, palmas: 0.4 },
  { x0: -77, x1: 77, z0: VIAS.jardimNorte.z0, z1: -PODIUM.profundidade / 2, densidade: 0.7, palmas: 0.1 },
  { x0: -80, x1: -75, z0: -42, z1: 42, densidade: 0.8, palmas: 0.3 },
  { x0: 75, x1: 80, z0: -42, z1: 42, densidade: 0.8, palmas: 0.3 },
  { x0: -150, x1: 150, z0: VIAS.avenida.canteiro[0] + 0.4, z1: VIAS.avenida.canteiro[1] - 0.4, densidade: 0.55, palmas: 0.9 },
  { x0: -150, x1: -110, z0: -40, z1: 40, densidade: 0.35, palmas: 0.2 },
  { x0: 110, x1: 150, z0: -40, z1: 40, densidade: 0.35, palmas: 0.2 },
]

/* ------------------------------------------------------------ geometria --- */

function geoTronco(alta: boolean): THREE.BufferGeometry {
  return cilindro(0.17, 0.26, 3.4, alta ? 8 : 5, [0, 1.7, 0])
}

function geoCopa(alta: boolean): THREE.BufferGeometry {
  const s = alta ? 9 : 5
  return mesclar([
    esferaAchatada(2.3, 0.72, s, [0, 4.5, 0]),
    esferaAchatada(1.6, 0.68, s, [1.5, 3.7, -0.7]),
    esferaAchatada(1.45, 0.7, s, [-1.4, 3.9, 0.9]),
    esferaAchatada(1.3, 0.62, s, [0.3, 5.6, 0.5]),
  ])
}

function geoTroncoPalmeira(alta: boolean): THREE.BufferGeometry {
  const lados = alta ? 8 : 5
  const partes: THREE.BufferGeometry[] = []
  // tronco levemente inclinado, em três segmentos
  partes.push(cilindro(0.22, 0.32, 3.2, lados, [0, 1.6, 0]))
  partes.push(cilindro(0.19, 0.22, 3.0, lados, [0.14, 4.7, 0.05], { rz: -0.05 }))
  partes.push(cilindro(0.16, 0.19, 2.8, lados, [0.34, 7.6, 0.12], { rz: -0.08 }))
  return mesclar(partes)
}

function geoCoroaPalmeira(alta: boolean): THREE.BufferGeometry {
  const folhas = alta ? 11 : 7
  const partes: THREE.BufferGeometry[] = []
  for (let i = 0; i < folhas; i++) {
    const giro = (i / folhas) * Math.PI * 2 + hash(i, 7) * 0.3
    const queda = -0.42 - hash(i, 11) * 0.5
    const comp = 3.1 + hash(i, 13) * 0.9
    partes.push(
      caixa(comp, 0.07, 0.62, [Math.cos(giro) * comp * 0.42, 9.1 + Math.sin(queda) * 0.9, Math.sin(giro) * comp * 0.42], {
        ry: -giro,
        rz: queda,
      }),
    )
  }
  partes.push(esferaAchatada(0.45, 0.8, alta ? 7 : 5, [0.34, 9.2, 0.12]))
  return mesclar(partes)
}

function geoArbusto(alta: boolean): THREE.BufferGeometry {
  const s = alta ? 7 : 5
  return mesclar([
    esferaAchatada(0.78, 0.76, s, [0, 0.6, 0]),
    esferaAchatada(0.56, 0.8, s, [0.6, 0.45, 0.35]),
    esferaAchatada(0.5, 0.74, s, [-0.5, 0.5, -0.45]),
  ])
}

/* ---------------------------------------------------------- distribuição --- */

interface Plantio {
  arvores: Transf[]
  palmeiras: Transf[]
  arbustos: Transf[]
}

function espalhar(
  canteiros: Canteiro[],
  base: number,
  fator: number,
  semente: number,
  saida: Plantio,
  guardarEixos = false,
): void {
  let n = 0
  for (const c of canteiros) {
    const area = (c.x1 - c.x0) * (c.z1 - c.z0)
    const dens = (c.densidade ?? 1) * fator
    const porte = Math.max(1, Math.round((area / 13) * dens))
    const fracaoPalma = c.palmas ?? 0.18
    for (let i = 0; i < porte; i++) {
      n++
      const hx = hash(semente, n, 1)
      const hz = hash(semente, n, 2)
      const hs = hash(semente, n, 3)
      const hr = hash(semente, n, 4)
      const x = c.x0 + 1.2 + hx * Math.max(0.1, c.x1 - c.x0 - 2.4)
      const z = c.z0 + 1.2 + hz * Math.max(0.1, c.z1 - c.z0 - 2.4)
      const y = base
      const giro: [number, number, number] = [0, hr * Math.PI * 2, 0]
      // no corredor de vista só entra arbusto: nada que suba acima da lente
      const soBaixo = guardarEixos && noEixoDeVista(x, z)
      if (!soBaixo && hs < fracaoPalma) {
        const e = 0.78 + hash(semente, n, 5) * 0.5
        saida.palmeiras.push({ p: [x, y, z], r: giro, s: [e, e, e] })
      } else if (!soBaixo && hs < fracaoPalma + 0.34) {
        const e = 0.75 + hash(semente, n, 6) * 0.55
        saida.arvores.push({ p: [x, y, z], r: giro, s: [e, e * (0.85 + hash(semente, n, 7) * 0.4), e] })
      } else {
        // no corredor o arbusto é rasteiro: fica abaixo da lente do 1º pavimento
        const e = soBaixo ? 0.5 + hash(semente, n, 8) * 0.22 : 0.7 + hash(semente, n, 8) * 0.7
        saida.arbustos.push({ p: [x, y, z], r: giro, s: [e, e * 0.9, e] })
      }
    }
  }
}

/** Arborização de rua: fileira regular nas calçadas, como a cidade faz. */
function arborizacaoUrbana(fator: number, saida: Plantio): void {
  const zCalcada = (VIAS.calcadaSul.z0 + VIAS.calcadaSul.z1) / 2
  const zOposta = (VIAS.calcadaOposta.z0 + VIAS.calcadaOposta.z1) / 2
  const passo = fator > 0.7 ? 11 : 19
  for (let x = -96; x <= 96; x += passo) {
    const e = 0.9 + hash(x, 21) * 0.35
    saida.arvores.push({ p: [x, TOPO_TERRA, zCalcada], r: [0, hash(x, 22) * 6.28, 0], s: [e, e, e] })
    saida.arvores.push({ p: [x + 6, TOPO_TERRA, zOposta], r: [0, hash(x, 23) * 6.28, 0], s: [e, e, e] })
  }
  const xLateral = (VIAS.calcadaLateral.d0 + VIAS.calcadaLateral.d1) / 2
  for (let z = -60; z <= 40; z += passo) {
    const e = 0.85 + hash(z, 24) * 0.4
    saida.arvores.push({ p: [-xLateral, TOPO_TERRA, z], r: [0, hash(z, 25) * 6.28, 0], s: [e, e, e] })
    saida.arvores.push({ p: [xLateral, TOPO_TERRA, z], r: [0, hash(z, 26) * 6.28, 0], s: [e, e, e] })
  }
}

export function Vegetacao({ alta }: { alta: boolean }): ReactElement {
  const m = materiais()
  const geo = useMemo(
    () => ({
      tronco: geoTronco(alta),
      copa: geoCopa(alta),
      troncoPalma: geoTroncoPalmeira(alta),
      coroaPalma: geoCoroaPalmeira(alta),
      arbusto: geoArbusto(alta),
    }),
    [alta],
  )

  const plantio = useMemo(() => {
    const fator = alta ? 1 : 0.5
    const saida: Plantio = { arvores: [], palmeiras: [], arbustos: [] }
    espalhar(CANTEIROS_DECK, TOPO_DECK, fator, 101, saida, true)
    espalhar(CANTEIROS_TERRENO, TOPO_TERRA, fator, 202, saida)
    arborizacaoUrbana(fator, saida)
    return saida
  }, [alta])

  return (
    <group name="paisagismo">
      <Instancias geometria={geo.tronco} material={m.tronco} itens={plantio.arvores} inerte />
      <Instancias geometria={geo.copa} material={m.folhagem} itens={plantio.arvores} inerte />
      <Instancias geometria={geo.troncoPalma} material={m.tronco} itens={plantio.palmeiras} inerte />
      <Instancias geometria={geo.coroaPalma} material={m.folhagem} itens={plantio.palmeiras} inerte />
      <Instancias
        geometria={geo.arbusto}
        material={m.folhagem}
        itens={plantio.arbustos}
        sombra={alta}
        inerte
      />
    </group>
  )
}
