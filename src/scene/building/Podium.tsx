/**
 * Embasamento 150 × 80 × 10,5 m.
 *   y 0,0 … 6,3  — térreo: porta-cocheira, portaria, lobby de pé-direito duplo,
 *                  mercado 24h e acesso de veículos.
 *   y 6,3 … 9,9  — pavimento de garagem, fechado por cobogó.
 *   y 9,9 … 10,5 — laje de lazer (o piso que LajeLazer.tsx ocupa).
 * A massa é construída em blocos que deixam os vazios no lugar: não há booleana,
 * o vazio é a ausência de bloco.
 */
import { useMemo } from 'react'
import type { ReactElement } from 'react'
import * as THREE from 'three'
import { PODIUM } from '../../empreendimentos/village-one/world'
import { materiais } from './materiais'
import { PISCINA_VAO } from './LajeLazer'
import { ACESSOS } from './Terreno'
import { Instancias, Peca } from './Instancias'
import { anel, bloco, caixa, cilindro, mesclar, painel, piso } from './util'
import type { Transf } from './util'

const X1 = PODIUM.largura / 2 // 75
const Z1 = PODIUM.profundidade / 2 // 40
const TOPO = PODIUM.altura // 10,5

/** Cotas verticais do embasamento. */
const N = {
  plinto: 0.9,
  terreoTeto: 6.3,
  marquiseBase: 6.05,
  marquiseTopo: 6.55,
  garagemBase: 6.55,
  garagemTopo: 9.9,
  lajeBase: 9.9,
} as const

/** Planta: faces de revestimento e recuos. */
const F = {
  revest: 0.5, // espessura das placas de pedra
  miolo: X1 - 0.5,
  mioloZ: Z1 - 0.5,
  garagemRecuo: 1.2,
  cornija: 1.2,
} as const

const LOBBY = { x0: -18, x1: 18, z0: 8, z1: 26 } as const
const COCHEIRA = { x0: ACESSOS.portaCocheira[0], x1: ACESSOS.portaCocheira[1], z0: 26, z1: Z1 } as const
const MERCADO = { x0: -62, x1: -42, z0: 30, teto: 4.6 } as const
const GARAGEM_ACESSO = { x0: ACESSOS.garagem[0], x1: ACESSOS.garagem[1], z0: 30, teto: 5.0 } as const
const PORTARIA = { x0: -5.5, x1: 5.5, z0: 31, z1: 37, teto: 3.4 } as const

interface Geos {
  pedra: THREE.BufferGeometry
  concreto: THREE.BufferGeometry
  interior: THREE.BufferGeometry
  madeira: THREE.BufferGeometry
  vidro: THREE.BufferGeometry
  metal: THREE.BufferGeometry
  metalClaro: THREE.BufferGeometry
  luzLoja: THREE.BufferGeometry
  cobogo: THREE.BufferGeometry
  aletas: Transf[]
  barras: Transf[]
}

function montar(alta: boolean): Geos {
  const pedra: THREE.BufferGeometry[] = []
  const concreto: THREE.BufferGeometry[] = []
  const interior: THREE.BufferGeometry[] = []
  const madeira: THREE.BufferGeometry[] = []
  const vidro: THREE.BufferGeometry[] = []
  const metal: THREE.BufferGeometry[] = []
  const metalClaro: THREE.BufferGeometry[] = []
  const cobogo: THREE.BufferGeometry[] = []
  const luzLoja: THREE.BufferGeometry[] = []

  /* ---------------------------------------------------------- plinto --- */
  const po = 0.4 // projeção do plinto
  pedra.push(bloco(-X1 - po, X1 + po, 0, N.plinto, -Z1 - po, COCHEIRA.z0, 3))
  pedra.push(bloco(-X1 - po, COCHEIRA.x0, 0, N.plinto, COCHEIRA.z0, Z1 + po, 3))
  pedra.push(bloco(COCHEIRA.x1, X1 + po, 0, N.plinto, COCHEIRA.z0, Z1 + po, 3))

  /* -------------------------------------------------- massa do térreo --- */
  const mx = F.miolo
  const mz = F.mioloZ
  // trecho norte, inteiro
  pedra.push(bloco(-mx, mx, N.plinto, N.terreoTeto, -mz, LOBBY.z0, 4))
  // ala oeste, recortada pelo mercado
  pedra.push(bloco(-mx, MERCADO.x0, N.plinto, N.terreoTeto, LOBBY.z0, mz, 4))
  pedra.push(bloco(MERCADO.x0, MERCADO.x1, N.plinto, N.terreoTeto, LOBBY.z0, MERCADO.z0, 4))
  pedra.push(bloco(MERCADO.x1, LOBBY.x0, N.plinto, N.terreoTeto, LOBBY.z0, mz, 4))
  pedra.push(bloco(MERCADO.x0, MERCADO.x1, MERCADO.teto, N.terreoTeto, MERCADO.z0, mz, 4))
  // ala leste, recortada pelo acesso de veículos
  pedra.push(bloco(LOBBY.x1, GARAGEM_ACESSO.x0, N.plinto, N.terreoTeto, LOBBY.z0, mz, 4))
  pedra.push(bloco(GARAGEM_ACESSO.x0, GARAGEM_ACESSO.x1, N.plinto, N.terreoTeto, LOBBY.z0, GARAGEM_ACESSO.z0, 4))
  pedra.push(bloco(GARAGEM_ACESSO.x1, mx, N.plinto, N.terreoTeto, LOBBY.z0, mz, 4))
  pedra.push(
    bloco(GARAGEM_ACESSO.x0, GARAGEM_ACESSO.x1, GARAGEM_ACESSO.teto, N.terreoTeto, GARAGEM_ACESSO.z0, mz, 4),
  )

  /* ------------------------------- revestimento em placas, com vazios --- */
  const rz0 = mz
  const rz1 = mz + F.revest
  const vaos: Array<[number, number]> = [
    [-mx, MERCADO.x0],
    [MERCADO.x1, COCHEIRA.x0],
    [COCHEIRA.x1, GARAGEM_ACESSO.x0],
    [GARAGEM_ACESSO.x1, mx],
  ]
  for (const [a, b] of vaos) pedra.push(bloco(a, b, N.plinto, N.terreoTeto, rz0, rz1, 4))
  // lintéis sobre as vitrines
  pedra.push(bloco(MERCADO.x0, MERCADO.x1, MERCADO.teto, N.terreoTeto, rz0, rz1, 4))
  pedra.push(bloco(GARAGEM_ACESSO.x0, GARAGEM_ACESSO.x1, GARAGEM_ACESSO.teto, N.terreoTeto, rz0, rz1, 4))
  // faces norte, leste e oeste
  pedra.push(bloco(-mx, mx, N.plinto, N.terreoTeto, -rz1, -rz0, 4))
  pedra.push(bloco(mx, mx + F.revest, N.plinto, N.terreoTeto, -rz1, rz1, 4))
  pedra.push(bloco(-mx - F.revest, -mx, N.plinto, N.terreoTeto, -rz1, rz1, 4))

  /* --------------------------------------------- marquise e cornija ---- */
  const mo = 1.6
  concreto.push(bloco(-X1 - mo, X1 + mo, N.marquiseBase, N.marquiseTopo, -Z1 - mo, COCHEIRA.z0, 5))
  concreto.push(bloco(-X1 - mo, COCHEIRA.x0, N.marquiseBase, N.marquiseTopo, COCHEIRA.z0, Z1 + mo, 5))
  concreto.push(bloco(COCHEIRA.x1, X1 + mo, N.marquiseBase, N.marquiseTopo, COCHEIRA.z0, Z1 + mo, 5))
  // marquise da porta-cocheira, mais alta e em bandeja
  concreto.push(bloco(COCHEIRA.x0 - 1.4, COCHEIRA.x1 + 1.4, N.marquiseBase, N.marquiseTopo, COCHEIRA.z0, Z1 + 2.6, 5))

  /* ------------------------------------ massa e cobogó da garagem ------ */
  const gx = X1 - F.garagemRecuo
  const gz = Z1 - F.garagemRecuo
  // a massa da garagem abre caminho para o tanque da piscina lá em cima
  for (const parte of anel(-gx + 0.9, gx - 0.9, N.garagemBase, N.garagemTopo, -gz + 0.9, gz - 0.9, PISCINA_VAO, 5)) {
    interior.push(parte)
  }
  // lajes e vigas aparentes da garagem
  concreto.push(bloco(-gx, gx, N.garagemBase, N.garagemBase + 0.45, -gz, gz, 5))

  const painelGaragem = (
    largura: number,
    centro: [number, number],
    giro: number,
  ): THREE.BufferGeometry =>
    painel(largura, N.garagemTopo - N.garagemBase - 0.6, [centro[0], (N.garagemBase + N.garagemTopo) / 2 + 0.1, centro[1]], giro, 3)

  cobogo.push(painelGaragem(gx * 2, [0, gz], 0))
  cobogo.push(painelGaragem(gx * 2, [0, -gz], Math.PI))
  cobogo.push(painelGaragem(gz * 2, [gx, 0], Math.PI / 2))
  cobogo.push(painelGaragem(gz * 2, [-gx, 0], -Math.PI / 2))

  /* aletas verticais de concreto marcando o ritmo da garagem */
  const aletas: Transf[] = []
  const passo = alta ? 5 : 10
  for (let x = -gx + passo / 2; x < gx; x += passo) {
    aletas.push({ p: [x, (N.garagemBase + N.garagemTopo) / 2, gz + 0.12] })
    aletas.push({ p: [x, (N.garagemBase + N.garagemTopo) / 2, -gz - 0.12] })
  }
  for (let z = -gz + passo / 2; z < gz; z += passo) {
    aletas.push({ p: [gx + 0.12, (N.garagemBase + N.garagemTopo) / 2, z], r: [0, Math.PI / 2, 0] })
    aletas.push({ p: [-gx - 0.12, (N.garagemBase + N.garagemTopo) / 2, z], r: [0, Math.PI / 2, 0] })
  }

  /* ------------------------------------------------- laje de lazer ----- */
  const cx = X1 + F.cornija
  const cz = Z1 + F.cornija
  for (const parte of anel(-cx, cx, N.lajeBase, TOPO, -cz, cz, PISCINA_VAO, 6)) concreto.push(parte)
  // friso de sombra sob a cornija
  for (const parte of anel(-cx + 0.35, cx - 0.35, N.lajeBase - 0.35, N.lajeBase, -cz + 0.35, cz - 0.35, PISCINA_VAO, 6)) {
    concreto.push(parte)
  }

  /* ---------------------------------------------- lobby, pé-direito duplo */
  const pisoLobby = N.plinto + 0.01
  pedra.push(piso(LOBBY.x1 - LOBBY.x0, LOBBY.z1 - LOBBY.z0, [0, pisoLobby, (LOBBY.z0 + LOBBY.z1) / 2], 2.5))
  // forro ripado de madeira sobre o lobby e a porta-cocheira
  madeira.push(bloco(LOBBY.x0, LOBBY.x1, N.marquiseBase, N.marquiseBase + 0.18, LOBBY.z0, LOBBY.z1, 1.2))
  // mezanino do lobby, para ler o pé-direito duplo
  concreto.push(bloco(LOBBY.x0 + 0.5, -4, 3.4, 3.7, LOBBY.z0, LOBBY.z0 + 7, 3))
  metalClaro.push(bloco(LOBBY.x0 + 0.5, -4, 4.75, 4.85, LOBBY.z0 + 6.9, LOBBY.z0 + 7.05, 2))
  vidro.push(painel(14, 1.05, [(LOBBY.x0 + 0.5 - 4) / 2, 4.22, LOBBY.z0 + 7]))
  // balcão de recepção
  pedra.push(bloco(-5, 5, pisoLobby, pisoLobby + 1.12, 12.2, 13.4, 2))
  madeira.push(bloco(-5.1, 5.1, pisoLobby + 0.1, pisoLobby + 1.0, 13.4, 13.55, 1.2))
  // portais de elevador na parede de fundo
  for (let i = 0; i < 4; i++) {
    const x = -9.9 + i * 6.6
    metal.push(bloco(x - 1.1, x + 1.1, pisoLobby, pisoLobby + 2.5, LOBBY.z0 - 0.02, LOBBY.z0 + 0.12, 2))
  }
  // pilares redondos do lobby
  for (const x of [-11, 11]) {
    concreto.push(cilindro(0.4, 0.4, N.terreoTeto - N.plinto, 16, [x, (N.plinto + N.terreoTeto) / 2, 19]))
  }
  // caixilho de vidro do lobby, voltado para a porta-cocheira
  vidro.push(painel(LOBBY.x1 - LOBBY.x0 - 0.4, N.terreoTeto - N.plinto - 0.4, [0, (N.plinto + N.terreoTeto) / 2, LOBBY.z1]))
  // degraus de acesso
  for (let i = 0; i < 4; i++) {
    const y = N.plinto - i * 0.19
    pedra.push(bloco(-13, 13, y - 0.19, y, LOBBY.z1 + i * 0.42, LOBBY.z1 + (i + 1) * 0.42 + 0.1, 2))
  }

  /* ------------------------------------------------------- portaria ---- */
  pedra.push(bloco(PORTARIA.x0 - 0.4, PORTARIA.x1 + 0.4, N.plinto - 0.75, N.plinto - 0.6, PORTARIA.z0 - 0.4, PORTARIA.z1 + 0.4, 2))
  vidro.push(painel(PORTARIA.x1 - PORTARIA.x0, PORTARIA.teto, [0, N.plinto - 0.6 + PORTARIA.teto / 2, PORTARIA.z1]))
  vidro.push(painel(PORTARIA.x1 - PORTARIA.x0, PORTARIA.teto, [0, N.plinto - 0.6 + PORTARIA.teto / 2, PORTARIA.z0], Math.PI))
  vidro.push(painel(PORTARIA.z1 - PORTARIA.z0, PORTARIA.teto, [PORTARIA.x1, N.plinto - 0.6 + PORTARIA.teto / 2, (PORTARIA.z0 + PORTARIA.z1) / 2], Math.PI / 2))
  vidro.push(painel(PORTARIA.z1 - PORTARIA.z0, PORTARIA.teto, [PORTARIA.x0, N.plinto - 0.6 + PORTARIA.teto / 2, (PORTARIA.z0 + PORTARIA.z1) / 2], -Math.PI / 2))
  concreto.push(
    bloco(PORTARIA.x0 - 0.9, PORTARIA.x1 + 0.9, N.plinto - 0.6 + PORTARIA.teto, N.plinto - 0.25 + PORTARIA.teto, PORTARIA.z0 - 0.9, PORTARIA.z1 + 0.9, 3),
  )
  metal.push(bloco(PORTARIA.x0 + 1, PORTARIA.x1 - 1, N.plinto - 0.6, N.plinto + 0.55, PORTARIA.z0 + 0.6, PORTARIA.z0 + 1.5, 2))

  /* --------------------------------------------------- mercado 24 h ---- */
  const mcx = (MERCADO.x0 + MERCADO.x1) / 2
  vidro.push(painel(MERCADO.x1 - MERCADO.x0 - 0.5, MERCADO.teto - N.plinto - 0.3, [mcx, (N.plinto + MERCADO.teto) / 2, rz1 - 0.1]))
  luzLoja.push(piso(MERCADO.x1 - MERCADO.x0 - 1, mz - MERCADO.z0 - 1, [mcx, MERCADO.teto - 0.15, (MERCADO.z0 + mz) / 2], 4))
  pedra.push(piso(MERCADO.x1 - MERCADO.x0, mz - MERCADO.z0, [mcx, N.plinto + 0.01, (MERCADO.z0 + mz) / 2], 2))
  for (let i = 0; i < 4; i++) {
    const x = MERCADO.x0 + 3 + i * 4.6
    interior.push(bloco(x - 1.4, x + 1.4, N.plinto, N.plinto + 1.9, MERCADO.z0 + 1.2, MERCADO.z0 + 2.2, 2))
  }
  // toldo metálico da vitrine
  metalClaro.push(bloco(MERCADO.x0 - 0.6, MERCADO.x1 + 0.6, MERCADO.teto, MERCADO.teto + 0.18, rz1, rz1 + 2.2, 3))

  /* ------------------------------------------- acesso de veículos ------ */
  // o hall de acesso é vazio: só o fundo, o forro e as laterais são opacos,
  // para que o vão leia profundidade em vez de parecer uma chapa escura
  interior.push(bloco(GARAGEM_ACESSO.x0, GARAGEM_ACESSO.x1, N.plinto, GARAGEM_ACESSO.teto, GARAGEM_ACESSO.z0, GARAGEM_ACESSO.z0 + 1.1, 4))
  interior.push(bloco(GARAGEM_ACESSO.x0, GARAGEM_ACESSO.x1, GARAGEM_ACESSO.teto - 0.2, GARAGEM_ACESSO.teto, GARAGEM_ACESSO.z0, mz, 4))
  interior.push(bloco(GARAGEM_ACESSO.x0, GARAGEM_ACESSO.x0 + 0.3, N.plinto, GARAGEM_ACESSO.teto, GARAGEM_ACESSO.z0, mz, 3))
  interior.push(bloco(GARAGEM_ACESSO.x1 - 0.3, GARAGEM_ACESSO.x1, N.plinto, GARAGEM_ACESSO.teto, GARAGEM_ACESSO.z0, mz, 3))
  interior.push(bloco(GARAGEM_ACESSO.x0, GARAGEM_ACESSO.x1, N.plinto - 0.15, N.plinto, GARAGEM_ACESSO.z0, mz, 4))
  // rampa que sobe para o pavimento de garagem, vista de esguelha pelo vão
  interior.push(
    caixa(GARAGEM_ACESSO.x1 - GARAGEM_ACESSO.x0 - 0.6, 0.4, 9.2, [
      (GARAGEM_ACESSO.x0 + GARAGEM_ACESSO.x1) / 2,
      2.1,
      GARAGEM_ACESSO.z0 + 3.2,
    ], { rx: -0.4, uv: 4 }),
  )
  // rampa externa de aproximação
  concreto.push(
    caixa(GARAGEM_ACESSO.x1 - GARAGEM_ACESSO.x0 + 2, 0.5, 9.4, [
      (GARAGEM_ACESSO.x0 + GARAGEM_ACESSO.x1) / 2,
      0.42,
      Z1 + 4.2,
    ], { rx: 0.09, uv: 4 }),
  )
  // portão em barras verticais
  const barras: Transf[] = []
  for (let i = 0; i <= 26; i++) {
    barras.push({ p: [GARAGEM_ACESSO.x0 + 0.3 + (i * (GARAGEM_ACESSO.x1 - GARAGEM_ACESSO.x0 - 0.6)) / 26, (N.plinto + GARAGEM_ACESSO.teto) / 2, mz - 0.4] })
  }

  /* -------------------------------------- parapeito da laje de lazer --- */
  const px = X1 - 0.5
  const pz = Z1 - 0.5
  const alturaGuarda = 1.15
  const guarda = (w: number, c: [number, number], giro: number) =>
    painel(w, alturaGuarda, [c[0], TOPO + alturaGuarda / 2, c[1]], giro)
  vidro.push(guarda(px * 2, [0, pz], 0))
  vidro.push(guarda(px * 2, [0, -pz], Math.PI))
  vidro.push(guarda(pz * 2, [px, 0], Math.PI / 2))
  vidro.push(guarda(pz * 2, [-px, 0], -Math.PI / 2))
  metalClaro.push(bloco(-px - 0.06, px + 0.06, TOPO + alturaGuarda, TOPO + alturaGuarda + 0.07, pz - 0.06, pz + 0.06, 2))
  metalClaro.push(bloco(-px - 0.06, px + 0.06, TOPO + alturaGuarda, TOPO + alturaGuarda + 0.07, -pz - 0.06, -pz + 0.06, 2))
  metalClaro.push(bloco(px - 0.06, px + 0.06, TOPO + alturaGuarda, TOPO + alturaGuarda + 0.07, -pz, pz, 2))
  metalClaro.push(bloco(-px - 0.06, -px + 0.06, TOPO + alturaGuarda, TOPO + alturaGuarda + 0.07, -pz, pz, 2))

  return {
    pedra: mesclar(pedra),
    concreto: mesclar(concreto),
    interior: mesclar(interior),
    madeira: mesclar(madeira),
    vidro: mesclar(vidro),
    metal: mesclar(metal),
    metalClaro: mesclar(metalClaro),
    luzLoja: mesclar(luzLoja),
    cobogo: mesclar(cobogo),
    aletas,
    barras,
  }
}

export function Podium({ alta }: { alta: boolean }): ReactElement {
  const m = materiais()
  const g = useMemo(() => montar(alta), [alta])
  const aleta = useMemo(
    () => caixa(0.3, N.garagemTopo - N.garagemBase - 0.5, 0.28, [0, 0, 0], { uv: 2 }),
    [],
  )
  const barra = useMemo(() => caixa(0.07, GARAGEM_ACESSO.teto - N.plinto - 0.2, 0.07, [0, 0, 0]), [])

  return (
    <group name="embasamento">
      <Peca geometria={g.pedra} material={m.pedra} />
      <Peca geometria={g.concreto} material={m.concretoClaro} />
      <Peca geometria={g.interior} material={m.interior} />
      <Peca geometria={g.madeira} material={m.madeira} />
      <Peca geometria={g.cobogo} material={m.cobogo} />
      <Peca geometria={g.metal} material={m.metalEscuro} />
      <Peca geometria={g.metalClaro} material={m.metalClaro} />
      {/* a luz do mercado também é aditiva: sai depois da vitrine de vidro */}
      <Peca geometria={g.luzLoja} material={m.janelaAcesa} sombra={false} inerte ordem={12} />
      <Peca geometria={g.vidro} material={m.vidro} sombra={false} />
      <Instancias geometria={aleta} material={m.concretoEstrutural} itens={g.aletas} inerte />
      <Instancias geometria={barra} material={m.metalEscuro} itens={g.barras} inerte />
    </group>
  )
}
