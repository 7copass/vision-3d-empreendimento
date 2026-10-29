/**
 * Camada de interação: as 156 caixas invisíveis, o realce de estoque e o
 * destaque de hover/seleção. Nada aqui depende de `src/scene/building/`.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
  Color,
  DoubleSide,
  EdgesGeometry,
  type InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
} from 'three'
import type { TowerId } from '../../core/types'
import { TORRES } from '../../core/world'
import { passaNosFiltros, useTour } from '../../core/store'
import {
  ALTURA_TINTA,
  CAIXAS_POR_TORRE,
  COR_ESMAECIDA,
  COR_FRISO,
  COR_SELECAO,
  FOLGA_COLISAO,
  SOBRA_TINTA,
  caixaDaUnidade,
  corDoStatus,
  frisosDoPavimento,
  planoDeRealce,
  type Realce,
} from './caixas'

/** Geometrias compartilhadas: uma caixa e um conjunto de arestas para tudo. */
const CAIXA = new BoxGeometry(1, 1, 1)
const ARESTAS = new EdgesGeometry(CAIXA)

/** Marcadores decorativos saem do raycast: não pegam clique nem ocultam rótulo. */
const semRaycast = () => {}

const _mat = new Matrix4()
const _pos = new Vector3()
const _esc = new Vector3()
const _rot = new Quaternion()
const _cor = new Color()
const ZERO = new Vector3(0, 0, 0)

/* ------------------------------------------------------------- colisão */

interface ColisaoProps {
  torre: TowerId
  aoApontar: (id: string) => void
  aoSair: () => void
  aoClicar: (id: string) => void
}

/**
 * Uma `InstancedMesh` por torre. O raycast do R3F enxerga 2 objetos em vez de
 * 156: cada um rejeita o ponteiro pela esfera envolvente da torre antes de
 * olhar instância por instância.
 */
function ColisaoDaTorre({ torre, aoApontar, aoSair, aoClicar }: ColisaoProps) {
  const caixas = CAIXAS_POR_TORRE[torre]
  const ref = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    for (let i = 0; i < caixas.length; i++) {
      const c = caixas[i]
      _pos.set(c.centro[0], c.centro[1], c.centro[2])
      _esc.set(c.tamanho[0] * FOLGA_COLISAO, c.tamanho[1] * 0.98, c.tamanho[2] * FOLGA_COLISAO)
      m.setMatrixAt(i, _mat.compose(_pos, _rot.identity(), _esc))
    }
    m.instanceMatrix.needsUpdate = true
    m.computeBoundingSphere()
  }, [caixas])

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, caixas.length]}
      geometry={CAIXA}
      dispose={null}
      name={`colisao-torre-${torre}`}
      onPointerMove={(e) => {
        e.stopPropagation()
        if (e.instanceId !== undefined) aoApontar(caixas[e.instanceId].unidade.id)
      }}
      onPointerOut={() => aoSair()}
      onClick={(e) => {
        e.stopPropagation()
        if (e.instanceId !== undefined) aoClicar(caixas[e.instanceId].unidade.id)
      }}
    >
      <meshBasicMaterial colorWrite={false} depthWrite={false} />
    </instancedMesh>
  )
}

/* ---------------------------------------------------------------- tinta */

interface TintaProps {
  torre: TowerId
  plano: Map<string, Realce>
  opacidade: number
}

/**
 * Volume translúcido tingido pelo status. Também instanciado, com cor por
 * instância; o que não deve aparecer vai para escala zero, e a malha inteira
 * sai de cena quando nada está realçado — é isso que mantém o repouso limpo.
 */
function TintaDaTorre({ torre, plano, opacidade }: TintaProps) {
  const caixas = CAIXAS_POR_TORRE[torre]
  const ref = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    let visiveis = 0
    for (let i = 0; i < caixas.length; i++) {
      const c = caixas[i]
      const r = plano.get(c.unidade.id) ?? 'nenhum'
      // 'destaque' é desenhado à parte, por cima de tudo.
      if (r === 'nenhum' || r === 'destaque') {
        m.setMatrixAt(i, _mat.compose(ZERO, _rot.identity(), ZERO))
        continue
      }
      visiveis++
      const esmaecida = r === 'esmaecido'
      const f = esmaecida ? 0.9 : SOBRA_TINTA
      _pos.set(c.centro[0], c.centro[1], c.centro[2])
      _esc.set(
        c.tamanho[0] * f,
        c.tamanho[1] * (esmaecida ? ALTURA_TINTA * 0.7 : ALTURA_TINTA),
        c.tamanho[2] * f,
      )
      m.setMatrixAt(i, _mat.compose(_pos, _rot.identity(), _esc))
      _cor.copy(corDoStatus(c.unidade.status))
      if (esmaecida) _cor.lerp(COR_ESMAECIDA, 0.82)
      m.setColorAt(i, _cor)
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.visible = visiveis > 0
  }, [caixas, plano])

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, caixas.length]}
      geometry={CAIXA}
      dispose={null}
      raycast={semRaycast}
      renderOrder={2}
      name={`tinta-torre-${torre}`}
    >
      <meshBasicMaterial
        transparent
        opacity={opacidade}
        depthWrite={false}
        side={DoubleSide}
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={-4}
        polygonOffsetUnits={-4}
      />
    </instancedMesh>
  )
}

/* ------------------------------------------------------------- destaque */

interface DestaqueProps {
  id: string
  opacidade: number
  selecionada: boolean
}

/**
 * Hover e seleção: no máximo duas destas em cena. Sem teste de profundidade,
 * para que o realce apareça mesmo quando a unidade está do outro lado da torre.
 */
function Destaque({ id, opacidade, selecionada }: DestaqueProps) {
  const c = caixaDaUnidade(id)
  if (!c) return null
  const cor = selecionada ? COR_SELECAO : corDoStatus(c.unidade.status)
  const escala: [number, number, number] = [
    c.tamanho[0] * SOBRA_TINTA,
    c.tamanho[1] * ALTURA_TINTA,
    c.tamanho[2] * SOBRA_TINTA,
  ]
  return (
    <group position={c.centro}>
      <mesh geometry={CAIXA} scale={escala} raycast={semRaycast} renderOrder={6} dispose={null}>
        <meshBasicMaterial
          color={corDoStatus(c.unidade.status)}
          transparent
          opacity={selecionada ? opacidade : opacidade * 0.7}
          depthTest={false}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <lineSegments
        geometry={ARESTAS}
        scale={escala}
        raycast={semRaycast}
        renderOrder={7}
        dispose={null}
      >
        <lineBasicMaterial
          color={cor}
          transparent
          opacity={selecionada ? 0.95 : 0.7}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  )
}

/* ---------------------------------------------------------------- friso */

function Friso({
  centro,
  tamanho,
}: {
  centro: [number, number, number]
  tamanho: [number, number, number]
}) {
  return (
    <lineSegments
      geometry={ARESTAS}
      position={centro}
      scale={tamanho}
      raycast={semRaycast}
      renderOrder={5}
      dispose={null}
    >
      <lineBasicMaterial
        color={COR_FRISO}
        transparent
        opacity={0.45}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
  )
}

/* ----------------------------------------------------------- componente */

export interface CamadaDeInteracaoProps {
  /** Força ligado/desligado. Por padrão desliga no modo 'vista'. */
  ativo?: boolean
  /** Opacidade do volume de status. Padrão 0.3. */
  opacidadeTinta?: number
  /** Opacidade do volume de hover/seleção. Padrão 0.42. */
  opacidadeDestaque?: number
  /** Troca o cursor por `pointer` sobre uma unidade. Padrão true. */
  cursorPointer?: boolean
}

export function CamadaDeInteracao({
  ativo,
  opacidadeTinta = 0.3,
  opacidadeDestaque = 0.42,
  cursorPointer = true,
}: CamadaDeInteracaoProps = {}) {
  const modo = useTour((s) => s.modo)
  const filtros = useTour((s) => s.filtros)
  const hover = useTour((s) => s.unidadeHover)
  const selecionada = useTour((s) => s.unidadeSelecionada)
  const torreAtiva = useTour((s) => s.torreAtiva)
  const andarAtivo = useTour((s) => s.andarAtivo)
  const hoverUnidade = useTour((s) => s.hoverUnidade)
  const selecionarUnidade = useTour((s) => s.selecionarUnidade)

  const ligado = ativo ?? modo !== 'vista'

  useEffect(() => {
    if (!cursorPointer || !ligado || !hover) return
    document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = ''
    }
  }, [cursorPointer, ligado, hover])

  const plano = useMemo(
    () =>
      planoDeRealce({
        filtros,
        passa: (u) => passaNosFiltros(u, filtros),
        hover,
        selecionada,
        torreAtiva,
        andarAtivo,
      }),
    [filtros, hover, selecionada, torreAtiva, andarAtivo],
  )

  const destaques = useMemo(
    () =>
      Array.from(plano.entries())
        .filter(([, r]) => r === 'destaque')
        .map(([id]) => id),
    [plano],
  )

  const frisos = useMemo(() => frisosDoPavimento(andarAtivo, torreAtiva), [andarAtivo, torreAtiva])

  if (!ligado) return null

  return (
    <group name="camada-de-interacao">
      {TORRES.map((t) => (
        <ColisaoDaTorre
          key={t.id}
          torre={t.id}
          aoApontar={(id) => {
            if (useTour.getState().unidadeHover !== id) hoverUnidade(id)
          }}
          aoSair={() => {
            if (useTour.getState().unidadeHover !== null) hoverUnidade(null)
          }}
          aoClicar={selecionarUnidade}
        />
      ))}
      {TORRES.map((t) => (
        <TintaDaTorre key={t.id} torre={t.id} plano={plano} opacidade={opacidadeTinta} />
      ))}
      {destaques.map((id) => (
        <Destaque
          key={id}
          id={id}
          opacidade={opacidadeDestaque}
          selecionada={id === selecionada}
        />
      ))}
      {frisos.map((f) => (
        <Friso key={f.torre} centro={f.centro} tamanho={f.tamanho} />
      ))}
    </group>
  )
}
