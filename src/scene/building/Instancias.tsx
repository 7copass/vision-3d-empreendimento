/**
 * Os dois componentes que colocam geometria na cena: `Instancias` para o que
 * repete e `Peca` para a geometria já mesclada. Nada mais mora aqui, para que
 * o fast refresh continue funcionando enquanto as outras frentes editam.
 */
import { useLayoutEffect, useRef } from 'react'
import type { ReactElement } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { cenario, semRaycast } from './util'
import type { Transf } from './util'

type SoRaycast = Pick<ThreeElements['mesh'], 'raycast'> | Record<string, never>

export interface InstanciasProps {
  geometria: THREE.BufferGeometry
  material: THREE.Material
  itens: Transf[]
  sombra?: boolean
  recebe?: boolean
  /** Cenário puro: sai do raycast para não atrapalhar a frente de interação. */
  inerte?: boolean
  visivel?: boolean
  /** Ordem de desenho. Acima de zero sai depois dos transparentes comuns. */
  ordem?: number
  /**
   * Atributos escalares por instância, entregues ao shader do material.
   * ATENÇÃO: isto escreve na geometria, então só passe uma geometria que
   * pertença a esta malha e a mais nenhuma.
   */
  atributos?: Record<string, Float32Array>
}

export function Instancias({
  geometria,
  material,
  itens,
  sombra = true,
  recebe = true,
  inerte = false,
  visivel = true,
  ordem,
  atributos,
}: InstanciasProps): ReactElement | null {
  const ref = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const malha = ref.current
    if (!malha) return
    const alvo = new THREE.Object3D()
    const cor = new THREE.Color()
    let pintou = false
    for (let i = 0; i < itens.length; i++) {
      const t = itens[i]
      alvo.position.set(t.p[0], t.p[1], t.p[2])
      if (t.r) alvo.rotation.set(t.r[0], t.r[1], t.r[2])
      else alvo.rotation.set(0, 0, 0)
      if (t.s) alvo.scale.set(t.s[0], t.s[1], t.s[2])
      else alvo.scale.set(1, 1, 1)
      alvo.updateMatrix()
      malha.setMatrixAt(i, alvo.matrix)
      if (t.cor !== undefined) {
        cor.set(t.cor)
        malha.setColorAt(i, cor)
        pintou = true
      }
    }
    malha.instanceMatrix.needsUpdate = true
    if (pintou && malha.instanceColor) malha.instanceColor.needsUpdate = true
    if (atributos) {
      for (const [nome, dados] of Object.entries(atributos)) {
        geometria.setAttribute(nome, new THREE.InstancedBufferAttribute(dados, 1))
      }
    }
    malha.computeBoundingSphere()
  }, [itens, geometria, material, atributos])

  if (itens.length === 0) return null
  const extra: SoRaycast = inerte ? { raycast: semRaycast } : {}

  return (
    <instancedMesh
      ref={ref}
      args={[geometria, material, itens.length]}
      castShadow={sombra}
      receiveShadow={recebe}
      visible={visivel}
      renderOrder={ordem}
      userData={cenario()}
      {...extra}
    />
  )
}

/* ----------------------------------------------------------------- peça --- */

export interface PecaProps {
  geometria: THREE.BufferGeometry
  material: THREE.Material
  sombra?: boolean
  recebe?: boolean
  inerte?: boolean
  visivel?: boolean
  /** Ordem de desenho. Acima de zero sai depois dos transparentes comuns. */
  ordem?: number
}

/** Malha única de geometria já mesclada. */
export function Peca({
  geometria,
  material,
  sombra = true,
  recebe = true,
  inerte = false,
  visivel = true,
  ordem,
}: PecaProps): ReactElement {
  const extra: SoRaycast = inerte ? { raycast: semRaycast } : {}
  return (
    <mesh
      geometry={geometria}
      material={material}
      castShadow={sombra}
      receiveShadow={recebe}
      visible={visivel}
      renderOrder={ordem}
      userData={cenario()}
      {...extra}
    />
  )
}
