/**
 * Câmera do tour: OrbitControls com limites de corretor (não vai para baixo do
 * terreno, não se perde na distância) e transição interpolada entre os modos.
 *
 * Órbita  — conjunto inteiro, rotação lenta quando ocioso, que morre no
 *           primeiro arrasto.
 * Unidade — aproxima pela diagonal da unidade, com o prédio em volta.
 * Vista   — câmera na varanda, orbit desligado, só olhar em volta.
 */
import { useCallback, useEffect, useRef, type ComponentRef } from 'react'
import { useFrame, useStore, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { MathUtils, type PerspectiveCamera, Vector3 } from 'three'
import { useTour } from '../../core/store'
import {
  damp3,
  poseDaUnidade,
  poseDaVista,
  poseDoConjunto,
  registrarCamera,
  type Otica,
  type Pose,
} from './enquadramento'

type Controles = ComponentRef<typeof OrbitControls>

/** Nunca de cima a pino, nunca por baixo do terreno. */
const POLAR_MIN = MathUtils.degToRad(12)
const POLAR_MAX = MathUtils.degToRad(82)
/** Quanto a cabeça gira na vista da varanda. */
const LIM_YAW = MathUtils.degToRad(58)
const LIM_PITCH_BAIXO = MathUtils.degToRad(-24)
const LIM_PITCH_ALTO = MathUtils.degToRad(26)
/** Distância do ponto olhado na vista: longe o suficiente para ser horizonte. */
const ALCANCE_VISTA = 70
const SENSIBILIDADE = 0.0028

export interface CameraProps {
  /** Padrão 18 m: não deixa entrar dentro da laje. */
  distanciaMin?: number
  /** Padrão 600 m: cabe o conjunto em tela estreita sem soltar a câmera. */
  distanciaMax?: number
  /** Meia-vida da interpolação em segundos. Padrão 0.28. */
  suavidade?: number
  /** Rotação automática na órbita quando ocioso. Padrão true. */
  autoRotacao?: boolean
  /** Padrão 0.4 (≈ 2,5 min por volta). */
  velocidadeAutoRotacao?: number
  /** Segundos de ociosidade antes de girar. Padrão 2.5. */
  esperaOciosa?: number
  /** Folga do enquadramento: 1 é justo. Padrão 1.02. */
  margem?: number
  /** Registra como controle padrão do drei. Padrão true. */
  makeDefault?: boolean
}

export function Camera({
  distanciaMin = 18,
  distanciaMax = 600,
  suavidade = 0.28,
  autoRotacao = true,
  velocidadeAutoRotacao = 0.4,
  esperaOciosa = 2.5,
  margem = 1.02,
  makeDefault = true,
}: CameraProps = {}) {
  const store = useStore()
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)

  const modo = useTour((s) => s.modo)
  const selecionada = useTour((s) => s.unidadeSelecionada)

  const controles = useRef<Controles>(null)
  const desejada = useRef<Pose>({ pos: new Vector3(), alvo: new Vector3() })
  const alvoAtual = useRef(new Vector3())
  const animando = useRef(false)
  const primeira = useRef(true)
  /** Deslocamento de cabeça na vista, somado à direção da varanda. */
  const olhar = useRef({ yaw: 0, pitch: 0, baseYaw: 0, basePitch: 0 })
  /** Rotação ociosa fica armada até o primeiro arrasto. */
  const autoLiberado = useRef(true)
  const usuarioMexeu = useRef(false)
  /** Instante em que o modo atual começou; o efeito abaixo preenche no mount. */
  const entrouEm = useRef(0)

  const otica = useCallback((): Otica => {
    const s = store.getState()
    const p = s.camera as Partial<PerspectiveCamera>
    return {
      fov: typeof p.fov === 'number' ? p.fov : 45,
      aspecto: s.size.width / Math.max(s.size.height, 1),
    }
  }, [store])

  const irPara = useCallback(
    (p: Pose | null, imediato = false) => {
      if (!p) return
      desejada.current.pos.copy(p.pos)
      desejada.current.alvo.copy(p.alvo)
      if (imediato) {
        camera.position.copy(p.pos)
        alvoAtual.current.copy(p.alvo)
        const c = controles.current
        if (c) {
          c.target.copy(p.alvo)
          if (c.enabled) c.update()
        } else {
          camera.lookAt(p.alvo)
        }
        animando.current = false
      } else {
        animando.current = true
      }
      invalidate()
    },
    [camera, invalidate],
  )

  /* ----------------------------------------------- reação aos modos */

  useEffect(() => {
    entrouEm.current = performance.now()
    const primeiro = primeira.current
    primeira.current = false

    if (modo === 'vista' && selecionada) {
      const p = poseDaVista(selecionada)
      if (!p) return
      const d = p.alvo.clone().sub(p.pos).normalize()
      olhar.current.baseYaw = Math.atan2(d.x, d.z)
      olhar.current.basePitch = Math.asin(MathUtils.clamp(d.y, -1, 1))
      olhar.current.yaw = 0
      olhar.current.pitch = 0
      irPara(p)
      return
    }
    if (modo === 'unidade' && selecionada) {
      autoLiberado.current = false
      irPara(poseDaUnidade(selecionada, otica(), margem, distanciaMin), primeiro)
      return
    }
    if (modo === 'orbita') {
      autoLiberado.current = true
      usuarioMexeu.current = false
      irPara(poseDoConjunto(otica(), margem, distanciaMax), primeiro)
    }
  }, [modo, selecionada, irPara, otica, margem, distanciaMin, distanciaMax])

  /** Tela mudou de proporção: reenquadra a órbita se o corretor não mexeu. */
  useEffect(() => {
    if (modo !== 'orbita' || usuarioMexeu.current) return
    irPara(poseDoConjunto(otica(), margem, distanciaMax))
  }, [size.width, size.height, modo, irPara, otica, margem, distanciaMax])

  /* --------------------------------------- helpers imperativos da UI */

  useEffect(
    () =>
      registrarCamera((p) => {
        entrouEm.current = performance.now()
        if (p.tipo === 'conjunto') {
          autoLiberado.current = true
          usuarioMexeu.current = false
          irPara(poseDoConjunto(otica(), margem, distanciaMax))
        } else {
          autoLiberado.current = false
          irPara(poseDaUnidade(p.id, otica(), margem, distanciaMin))
        }
      }),
    [irPara, otica, margem, distanciaMin, distanciaMax],
  )

  /* ------------------------------------------- olhar em volta na vista */

  useEffect(() => {
    if (modo !== 'vista') return
    const el = gl.domElement
    let arrastando = false
    let ux = 0
    let uy = 0
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return
      arrastando = true
      ux = e.clientX
      uy = e.clientY
      el.setPointerCapture?.(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!arrastando) return
      const dx = e.clientX - ux
      const dy = e.clientY - uy
      ux = e.clientX
      uy = e.clientY
      olhar.current.yaw = MathUtils.clamp(
        olhar.current.yaw - dx * SENSIBILIDADE,
        -LIM_YAW,
        LIM_YAW,
      )
      olhar.current.pitch = MathUtils.clamp(
        olhar.current.pitch - dy * SENSIBILIDADE,
        LIM_PITCH_BAIXO,
        LIM_PITCH_ALTO,
      )
      invalidate()
    }
    const up = (e: PointerEvent) => {
      arrastando = false
      el.releasePointerCapture?.(e.pointerId)
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [modo, gl, invalidate])

  /* ------------------------------------------------------------ frame */

  useFrame((_, dt) => {
    const c = controles.current
    const passo = Math.min(dt, 0.1)

    if (modo === 'vista') {
      const yaw = olhar.current.baseYaw + olhar.current.yaw
      const pitch = olhar.current.basePitch + olhar.current.pitch
      const cos = Math.cos(pitch)
      desejada.current.alvo.set(
        desejada.current.pos.x + Math.sin(yaw) * cos * ALCANCE_VISTA,
        desejada.current.pos.y + Math.sin(pitch) * ALCANCE_VISTA,
        desejada.current.pos.z + Math.cos(yaw) * cos * ALCANCE_VISTA,
      )
      damp3(camera.position, desejada.current.pos, suavidade, passo)
      damp3(alvoAtual.current, desejada.current.alvo, suavidade, passo)
      camera.lookAt(alvoAtual.current)
      if (c) c.target.copy(alvoAtual.current)
      invalidate()
      return
    }

    if (animando.current) {
      damp3(camera.position, desejada.current.pos, suavidade, passo)
      damp3(alvoAtual.current, desejada.current.alvo, suavidade, passo)
      if (c) {
        c.target.copy(alvoAtual.current)
        c.update()
      } else {
        camera.lookAt(alvoAtual.current)
      }
      if (
        camera.position.distanceTo(desejada.current.pos) < 0.08 &&
        alvoAtual.current.distanceTo(desejada.current.alvo) < 0.08
      ) {
        camera.position.copy(desejada.current.pos)
        alvoAtual.current.copy(desejada.current.alvo)
        if (c) {
          c.target.copy(alvoAtual.current)
          c.update()
        }
        animando.current = false
      }
      invalidate()
      return
    }

    if (!c) return
    alvoAtual.current.copy(c.target)
    const ocioso = (performance.now() - entrouEm.current) / 1000 > esperaOciosa
    const girar = autoRotacao && modo === 'orbita' && autoLiberado.current && ocioso
    c.autoRotate = girar
    if (girar) invalidate()
  })

  return (
    <OrbitControls
      ref={controles}
      makeDefault={makeDefault}
      enabled={!(modo === 'vista' && !!selecionada)}
      enableDamping
      dampingFactor={0.065}
      enablePan={false}
      minDistance={distanciaMin}
      maxDistance={distanciaMax}
      minPolarAngle={POLAR_MIN}
      maxPolarAngle={POLAR_MAX}
      rotateSpeed={0.55}
      zoomSpeed={0.7}
      autoRotateSpeed={velocidadeAutoRotacao}
      onStart={() => {
        usuarioMexeu.current = true
        autoLiberado.current = false
        animando.current = false
      }}
    />
  )
}
