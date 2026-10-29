/**
 * O chão: o lote, as duas ruas da esquina, calçada, meio-fio e sinalização.
 *
 * A implantação é a do render e a da foto do lote vazio (`esquina.webp`): o
 * prédio ocupa a esquina, uma rua corre ao SUL (a face das unidades pares) e
 * outra ao LESTE, e elas se cruzam logo além da quina arredondada. As duas
 * têm greide de bairro — asfalto remendado, meio-fio de concreto, calçada de
 * placa larga — porque é isso que aparece no quadro, e um asfalto de cidade
 * grande ao pé deste prédio soaria falso.
 *
 * Tudo aqui é geometria mesclada por material: o chão inteiro custa seis
 * draw calls.
 */
import { useMemo } from 'react'
import type { ReactElement } from 'react'
import * as THREE from 'three'
import { TERRENO } from '../world'
import { materiais } from './materiais'
import { Peca } from './Instancias'
import { bloco, caixa, hash, mesclar, mesclarOuVazio, piso } from './util'

/* ----------------------------------------------------------- a esquina --- */

const LX = TERRENO.largura / 2 // 60
const LZ = TERRENO.profundidade / 2 // 55

/** Linha de meio-fio: além dela é pista. */
export const MEIO_FIO_Z = 15
export const MEIO_FIO_X = 21.5
/** Largura de pista de cada rua. */
const PISTA = 12
const CALCADA_Y = 0.16

/** Calçada do lado oposto de cada rua. */
const OPOSTO_Z = MEIO_FIO_Z + PISTA
const OPOSTO_X = MEIO_FIO_X + PISTA

function montar(alta: boolean): {
  terra: THREE.BufferGeometry
  grama: THREE.BufferGeometry
  asfalto: THREE.BufferGeometry
  calcada: THREE.BufferGeometry
  meioFio: THREE.BufferGeometry
  faixa: THREE.BufferGeometry
} {
  /* ---- terra batida: o fundo de tudo, que é o chão vermelho de Santarém */
  const terra = piso(TERRENO.largura, TERRENO.profundidade, [0, 0, 0], 9)

  /* ---- pista */
  const asfalto = mesclar([
    piso(MEIO_FIO_X + LX, PISTA, [(MEIO_FIO_X - LX) / 2, 0.02, MEIO_FIO_Z + PISTA / 2], 7),
    piso(PISTA, LZ * 2, [MEIO_FIO_X + PISTA / 2, 0.02, 0], 7),
  ])

  /* ---- calçada: a nossa, e a do outro lado das duas ruas */
  const lajesCalcada: THREE.BufferGeometry[] = [
    // nossa quadra, lado sul (passa sob a marquise)
    bloco(-LX, MEIO_FIO_X, 0, CALCADA_Y, 10, MEIO_FIO_Z, 2.2),
    // nossa quadra, lado leste
    bloco(17, MEIO_FIO_X, 0, CALCADA_Y, -LZ, 10, 2.2),
    // do outro lado da rua sul
    bloco(-LX, OPOSTO_X, 0, CALCADA_Y, OPOSTO_Z, OPOSTO_Z + 4, 2.2),
    // do outro lado da rua leste
    bloco(OPOSTO_X, OPOSTO_X + 4, 0, CALCADA_Y, -LZ, OPOSTO_Z, 2.2),
  ]

  /* ---- meio-fio, com o chanfro da esquina */
  const guias: THREE.BufferGeometry[] = [
    bloco(-LX, 19, 0, 0.17, MEIO_FIO_Z - 0.22, MEIO_FIO_Z, 1),
    bloco(MEIO_FIO_X - 0.22, MEIO_FIO_X, 0, 0.17, -LZ, 12.5, 1),
    caixa(3.6, 0.17, 0.22, [20.25, 0.085, 13.75], { ry: Math.PI / 4, uv: 1 }),
    bloco(-LX, OPOSTO_X, 0, 0.17, OPOSTO_Z, OPOSTO_Z + 0.22, 1),
    bloco(OPOSTO_X, OPOSTO_X + 0.22, 0, 0.17, -LZ, OPOSTO_Z, 1),
  ]

  /* ---- sinalização: eixo tracejado das duas ruas e a linha de retenção */
  const marcas: THREE.BufferGeometry[] = []
  const eixoZ = MEIO_FIO_Z + PISTA / 2
  for (let x = -LX + 1; x < MEIO_FIO_X - 2; x += 6) {
    marcas.push(piso(3, 0.14, [x, 0.035, eixoZ], 1))
  }
  const eixoX = MEIO_FIO_X + PISTA / 2
  for (let z = -LZ + 1; z < LZ; z += 6) {
    if (z > MEIO_FIO_Z - 3 && z < OPOSTO_Z + 3) continue
    marcas.push(piso(0.14, 3, [eixoX, 0.035, z], 1))
  }
  // retenção na aproximação da esquina, que é o "PARE" pintado da foto
  marcas.push(piso(PISTA / 2 - 0.4, 0.4, [MEIO_FIO_X - PISTA / 4, 0.035, OPOSTO_Z - 0.8], 1))

  /* ---- canteiros rentes à base, com a vegetação rasteira do render */
  const verde: THREE.BufferGeometry[] = [
    bloco(-16, -6, 0.16, 0.38, 10.1, 11.5, 1.6),
    bloco(-16.5, -8, 0.16, 0.38, -11.5, -10.1, 1.6),
  ]
  if (alta) {
    // moitas baixas: um volume achatado por touceira, determinístico
    for (let i = 0; i < 14; i++) {
      const t = i / 14
      const x = -16 + t * 10 + hash(i, 3) * 0.5
      verde.push(caixa(0.7, 0.55, 0.7, [x, 0.5, 10.6 + hash(i, 5) * 0.5], { uv: 0.8 }))
    }
  }

  return {
    terra,
    grama: mesclarOuVazio(verde),
    asfalto,
    calcada: mesclar(lajesCalcada),
    meioFio: mesclar(guias),
    faixa: mesclarOuVazio(marcas),
  }
}

export function Terreno({ alta }: { alta: boolean }): ReactElement {
  const m = materiais()
  const g = useMemo(() => montar(alta), [alta])

  return (
    <group name="terreno">
      <Peca geometria={g.terra} material={m.terra} sombra={false} inerte />
      <Peca geometria={g.asfalto} material={m.asfalto} sombra={false} inerte />
      <Peca geometria={g.calcada} material={m.calcada} sombra={false} inerte />
      <Peca geometria={g.meioFio} material={m.meioFio} inerte />
      <Peca geometria={g.faixa} material={m.faixaViaria} sombra={false} inerte />
      <Peca geometria={g.grama} material={m.grama} inerte />
    </group>
  )
}
