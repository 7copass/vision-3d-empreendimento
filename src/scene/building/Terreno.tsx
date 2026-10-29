/**
 * Terreno, calçadas, meio-fio e as vias. A Av. Eng. Fernando Guilhon corre ao
 * sul (+Z) com canteiro central; duas vias laterais e uma via de serviço ao norte
 * fecham o quarteirão. Medidas ancoradas em TERRENO e PODIUM de core/world.
 */
import { useMemo } from 'react'
import type { ReactElement } from 'react'
import * as THREE from 'three'
import { PODIUM, TERRENO } from '../../empreendimentos/village-one/world'
import { materiais } from './materiais'
import { Instancias, Peca } from './Instancias'
import { bloco, mesclar, piso } from './util'
import type { Transf } from './util'

/* --------------------------------------------------- traçado do loteamento --- */

const LOTE = {
  x0: -PODIUM.largura / 2,
  x1: PODIUM.largura / 2,
  z0: -PODIUM.profundidade / 2,
  z1: PODIUM.profundidade / 2,
} as const

export const VIAS = {
  /** Av. Eng. Fernando Guilhon, ao sul. */
  avenida: { z0: 50, z1: 70, canteiro: [59.2, 60.8] as [number, number] },
  calcadaSul: { z0: 43, z1: 50 },
  jardimSul: { z0: LOTE.z1, z1: 43 },
  calcadaOposta: { z0: 70, z1: 76 },
  /** Vias laterais, sentido norte-sul. */
  lateral: { d0: 88, d1: 104 },
  calcadaLateral: { d0: 80, d1: 88 },
  jardimLateral: { d0: LOTE.x1, d1: 80 },
  /** Via de serviço ao norte. */
  servico: { z0: -66, z1: -52 },
  calcadaNorte: { z0: -52, z1: -44 },
  jardimNorte: { z0: -44, z1: LOTE.z0 },
} as const

/** Eixos de acesso ao embasamento, usados pela guia de rolamento e pelo pódio. */
export const ACESSOS = {
  portaCocheira: [-18, 18] as [number, number],
  garagem: [42, 58] as [number, number],
} as const

const CONTEXTO = 760
const TOPO_ASFALTO = 0.07
const TOPO_CALCADA = 0.17
const TOPO_GUIA = 0.26

/** Caixa de pavimento: enterrada, para não brigar em Z com o solo. */
const laje = (x0: number, x1: number, z0: number, z1: number, topo: number, uv = 6) =>
  bloco(x0, x1, -0.5, topo, z0, z1, uv)

interface Geos {
  solo: THREE.BufferGeometry
  contexto: THREE.BufferGeometry
  asfalto: THREE.BufferGeometry
  calcada: THREE.BufferGeometry
  guias: THREE.BufferGeometry
  jardins: THREE.BufferGeometry
  marcacao: THREE.BufferGeometry
  faixas: Transf[]
}

function montar(alta: boolean): Geos {
  const { largura: TL, profundidade: TP } = TERRENO
  const bx = TL / 2
  const bz = TP / 2
  const v = VIAS

  /* solo do terreno — grama rasteira sob tudo */
  const solo = piso(TL, TP, [0, 0, 0], 10)

  /* contexto: chão da cidade muito além do terreno, para o horizonte não vazar */
  const contexto = piso(CONTEXTO, CONTEXTO, [0, -0.06, 0], 30)

  /* ---- asfalto ---- */
  const asf: THREE.BufferGeometry[] = [
    // avenida, em duas pistas separadas pelo canteiro central
    laje(-CONTEXTO / 2, CONTEXTO / 2, v.avenida.z0, v.avenida.canteiro[0], TOPO_ASFALTO),
    laje(-CONTEXTO / 2, CONTEXTO / 2, v.avenida.canteiro[1], v.avenida.z1, TOPO_ASFALTO),
    // vias laterais
    laje(-v.lateral.d1, -v.lateral.d0, -CONTEXTO / 2, v.avenida.z0, TOPO_ASFALTO),
    laje(v.lateral.d0, v.lateral.d1, -CONTEXTO / 2, v.avenida.z0, TOPO_ASFALTO),
    // via de serviço ao norte
    laje(-CONTEXTO / 2, CONTEXTO / 2, v.servico.z0, v.servico.z1, TOPO_ASFALTO),
    // praça de acesso de veículos à garagem
    laje(ACESSOS.garagem[0] - 2, ACESSOS.garagem[1] + 2, LOTE.z1, v.avenida.z0, TOPO_ASFALTO),
  ]

  /* ---- calçadas ---- */
  const cal: THREE.BufferGeometry[] = [
    laje(-bx - 6, bx + 6, v.calcadaSul.z0, v.calcadaSul.z1, TOPO_CALCADA, 4),
    laje(-bx - 6, bx + 6, v.calcadaOposta.z0, v.calcadaOposta.z1, TOPO_CALCADA, 4),
    laje(-bx - 6, bx + 6, v.calcadaNorte.z0, v.calcadaNorte.z1, TOPO_CALCADA, 4),
    laje(-v.calcadaLateral.d1, -v.calcadaLateral.d0, -bz - 4, v.calcadaSul.z1, TOPO_CALCADA, 4),
    laje(v.calcadaLateral.d0, v.calcadaLateral.d1, -bz - 4, v.calcadaSul.z1, TOPO_CALCADA, 4),
    // esplanada da entrada social, em continuidade com a porta-cocheira
    laje(ACESSOS.portaCocheira[0] - 6, ACESSOS.portaCocheira[1] + 6, LOTE.z1, v.calcadaSul.z1, TOPO_CALCADA, 4),
    // faixa de serviço do mercado 24h
    laje(-66, -38, LOTE.z1, v.calcadaSul.z0, TOPO_CALCADA, 4),
  ]

  /* ---- meio-fio ---- */
  const guia: THREE.BufferGeometry[] = [
    laje(-bx - 6, bx + 6, v.avenida.z0 - 0.3, v.avenida.z0, TOPO_GUIA, 2),
    laje(-bx - 6, bx + 6, v.avenida.z1, v.avenida.z1 + 0.3, TOPO_GUIA, 2),
    laje(-bx - 6, bx + 6, v.servico.z1, v.servico.z1 + 0.3, TOPO_GUIA, 2),
    laje(-v.lateral.d0 - 0.3, -v.lateral.d0, -bz - 4, v.avenida.z0, TOPO_GUIA, 2),
    laje(v.lateral.d0, v.lateral.d0 + 0.3, -bz - 4, v.avenida.z0, TOPO_GUIA, 2),
    // guias do canteiro central
    laje(-bx - 6, bx + 6, v.avenida.canteiro[0], v.avenida.canteiro[0] + 0.3, TOPO_GUIA, 2),
    laje(-bx - 6, bx + 6, v.avenida.canteiro[1] - 0.3, v.avenida.canteiro[1], TOPO_GUIA, 2),
  ]

  /* ---- jardins: frente, laterais, fundos e canteiro central ---- */
  const jar: THREE.BufferGeometry[] = [
    laje(-bx - 2, bx + 2, v.jardimSul.z0, v.jardimSul.z1, TOPO_CALCADA - 0.03, 6),
    laje(-bx - 2, bx + 2, v.jardimNorte.z0, v.jardimNorte.z1, TOPO_CALCADA - 0.03, 6),
    laje(-v.jardimLateral.d1, -v.jardimLateral.d0, -bz - 2, bz + 2, TOPO_CALCADA - 0.03, 6),
    laje(v.jardimLateral.d0, v.jardimLateral.d1, -bz - 2, bz + 2, TOPO_CALCADA - 0.03, 6),
    laje(-bx - 6, bx + 6, v.avenida.canteiro[0] + 0.3, v.avenida.canteiro[1] - 0.3, TOPO_GUIA - 0.04, 4),
  ]

  /* ---- pintura de pista ---- */
  const marc: THREE.BufferGeometry[] = []
  const linha = (x0: number, x1: number, z0: number, z1: number) =>
    bloco(x0, x1, TOPO_ASFALTO, TOPO_ASFALTO + 0.012, z0, z1, 2)
  // bordos contínuos das duas pistas
  for (const z of [v.avenida.z0 + 0.6, v.avenida.canteiro[0] - 0.6, v.avenida.canteiro[1] + 0.6, v.avenida.z1 - 0.6]) {
    marc.push(linha(-bx - 6, bx + 6, z - 0.06, z + 0.06))
  }
  // tracejado de divisão de faixa, só no detalhe alto
  if (alta) {
    for (const z of [v.avenida.z0 + 4.6, v.avenida.canteiro[1] + 4.6]) {
      for (let x = -bx - 4; x < bx + 4; x += 9) marc.push(linha(x, x + 4.5, z - 0.06, z + 0.06))
    }
  }

  /* ---- faixa de pedestres, no eixo da entrada social ---- */
  const faixas: Transf[] = []
  for (let i = 0; i < 9; i++) {
    const x = -8 + i * 2
    faixas.push({ p: [x, TOPO_ASFALTO + 0.008, (v.avenida.z0 + v.avenida.canteiro[0]) / 2] })
    faixas.push({ p: [x, TOPO_ASFALTO + 0.008, (v.avenida.canteiro[1] + v.avenida.z1) / 2] })
  }

  return {
    solo,
    contexto,
    asfalto: mesclar(asf),
    calcada: mesclar(cal),
    guias: mesclar(guia),
    jardins: mesclar(jar),
    marcacao: mesclar(marc),
    faixas,
  }
}

export function Terreno({ alta }: { alta: boolean }): ReactElement {
  const m = materiais()
  const g = useMemo(() => montar(alta), [alta])
  const faixa = useMemo(() => bloco(-0.65, 0.65, 0, 0.012, -4.2, 4.2, 2), [])

  return (
    <group name="terreno" userData={{ naoInterativo: true }}>
      <Peca geometria={g.contexto} material={m.terra} sombra={false} inerte />
      <Peca geometria={g.solo} material={m.grama} sombra={false} />
      <Peca geometria={g.asfalto} material={m.asfalto} sombra={false} inerte />
      <Peca geometria={g.calcada} material={m.calcada} sombra={false} />
      <Peca geometria={g.guias} material={m.concretoClaro} />
      <Peca geometria={g.jardins} material={m.grama} sombra={false} />
      <Peca geometria={g.marcacao} material={m.faixa} sombra={false} inerte />
      <Instancias geometria={faixa} material={m.faixa} itens={g.faixas} sombra={false} inerte />
    </group>
  )
}
