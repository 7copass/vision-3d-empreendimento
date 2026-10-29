/**
 * Céu, sol, lua, luzes e neblina. Tudo reage a `hora` e `mes` do store.
 *
 * Três decisões que explicam o resto do arquivo:
 *
 * 1. UM ÚNICO `useFrame`. A luz, o céu, as estrelas, a exposição e as luzes
 *    cênicas são amortecidos no mesmo quadro, lendo o store por
 *    `useTour.getState()`. O componente só re-renderiza quando `qualidade`
 *    muda — arrastar a régua de hora não causa render de React nenhum, só
 *    muda uniforms e propriedades de luz.
 *
 * 2. AMORTECIMENTO EXPONENCIAL em tudo (`THREE.MathUtils.damp`). A paleta já
 *    é contínua em altitude, então arrastar a régua seria suave de qualquer
 *    forma; o amortecimento existe para os SALTOS: clicar 'noite' pula de 12h
 *    para 20h30 e o conjunto precisa atravessar o poente, não cortar.
 *
 * 3. SOMBRA COM CÂMERA FIXA. O volume que precisa de sombra (terreno
 *    200 × 150 e torres até ~78 m) cabe numa esfera de raio ~132 m centrada
 *    em (0, 25, 0). Uma câmera ortográfica de meia-extensão 135 centrada ali
 *    contém a cena INTEIRA qualquer que seja a direção do sol — não precisa
 *    reenquadrar por horário, e `near`/`far` ficam colados no volume, o que é
 *    o que dá precisão de profundidade suficiente para não serrilhar.
 *
 * O `oxlint` avisa `react(immutability)` nas mutações dentro do `useFrame` e
 * nos uniforms dos materiais memoizados. É intencional e é o idioma do
 * react-three-fiber: objeto de rascunho criado uma vez, mutado por quadro,
 * zero alocação no laço de render. Trocar por `useState` colocaria um render
 * de React por quadro na frente de uma call com tela compartilhada. Não
 * "consertar".
 */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTour } from '../../core/store'
import { ALTURA_COROAMENTO, PODIUM, TORRES } from '../../core/world'
import { DISTANCIA_LUA, DISTANCIA_SOL, posicaoDaLua, posicaoDoSol } from './sol'
import { COR_DO_CHAO, coresDoCeu, parametrosDoCeu } from './paleta'
import { BANCO } from './bench'
import {
  criarGeometriaDeEstrelas,
  criarMaterialDaLua,
  criarMaterialDeEstrelas,
  criarMaterialDoCeu,
} from './materiais'

/** Centro do volume que recebe sombra. */
const CENTRO_CENA = new THREE.Vector3(0, 25, 0)
/** Meia-extensão da câmera de sombra, em metros. Ver nota 3 no topo. */
const RAIO_SOMBRA = 135
/** Raio do domo de céu, em metros. Acompanha a câmera, então nunca é cortado. */
const RAIO_DOMO = 1200
/** Tamanho angular do quad da lua: ~1,9°, contra os 0,52° reais. */
const ESCALA_LUA = 0.034

/** Constante de amortecimento; ~0,12 s para cobrir a maior parte do salto. */
const LAMBDA = 8

/** Devolve `v` à esfera de raio `raio`; cai no alvo se o lerp degenerou. */
function reprojetar(v: THREE.Vector3, alvo: THREE.Vector3, raio: number): void {
  if (v.lengthSq() < 1) v.copy(alvo)
  v.normalize().multiplyScalar(raio)
}

interface LuzCenica {
  posicao: [number, number, number]
  cor: string
  intensidade: number
  distancia: number
  /** Entra também em `qualidade === 'media'`? */
  essencial: boolean
}

/**
 * Iluminação cênica do conjunto. Pontuais puras, sem sombra: barato e é o que
 * basta para o pódio e as bases não ficarem num breu. As janelas acesas são
 * de outra frente. As posições derivam de `PODIUM` e `TORRES`, e espelham o
 * layout de amenidades (piscina em z ≈ +8, portaria em z ≈ +24).
 */
const LUZES_CENICAS: LuzCenica[] = [
  // piscina, no topo do pódio
  { posicao: [-7, PODIUM.altura + 1.1, 8], cor: '#6fd4ff', intensidade: 70, distancia: 28, essencial: false },
  { posicao: [7, PODIUM.altura + 1.1, 8], cor: '#6fd4ff', intensidade: 70, distancia: 28, essencial: true },
  // banho quente nas bases das torres, do deck para a fachada
  ...TORRES.map((t): LuzCenica => ({
    posicao: [t.centro[0], PODIUM.altura + 2.4, t.centro[2] + t.profundidade / 2 + 6],
    cor: '#ffb168',
    intensidade: 130,
    distancia: 46,
    essencial: true,
  })),
  // coroamento: lavagem rasante no alto da fachada sul, que é a que a câmera
  // de órbita vê. Fica FORA do volume da torre — pontual dentro de um sólido
  // não ilumina nada.
  ...TORRES.map((t): LuzCenica => ({
    posicao: [t.centro[0], ALTURA_COROAMENTO - 3.5, t.centro[2] + t.profundidade / 2 + 4],
    cor: '#ffc98c',
    intensidade: 150,
    distancia: 32,
    essencial: false,
  })),
  // chegada: fora da projeção do pódio (|z| < 40), senão ficaria enterrada
  // nos 10,5 m de massa dele
  { posicao: [0, 5.5, 46], cor: '#ffd3a0', intensidade: 130, distancia: 42, essencial: false },
]

export function Atmosfera() {
  const qualidade = useTour((s) => s.qualidade)
  const alta = qualidade === 'alta'

  const neblina = useRef<THREE.FogExp2>(null)
  const hemisferio = useRef<THREE.HemisphereLight>(null)
  const ambiente = useRef<THREE.AmbientLight>(null)
  const luzSol = useRef<THREE.DirectionalLight>(null)
  const luzLua = useRef<THREE.DirectionalLight>(null)
  const rebatimento = useRef<THREE.DirectionalLight>(null)
  const domo = useRef<THREE.Group>(null)
  const discoLua = useRef<THREE.Mesh>(null)
  const cenicas = useRef<THREE.Group>(null)

  const matCeu = useMemo(() => criarMaterialDoCeu(), [])
  const matEstrelas = useMemo(() => criarMaterialDeEstrelas(), [])
  const matLua = useMemo(() => criarMaterialDaLua(), [])
  const geoEstrelas = useMemo(() => criarGeometriaDeEstrelas(alta ? 1500 : 650), [alta])

  useEffect(
    () => () => {
      matCeu.dispose()
      matEstrelas.dispose()
      matLua.dispose()
    },
    [matCeu, matEstrelas, matLua],
  )
  useEffect(() => () => geoEstrelas.dispose(), [geoEstrelas])

  /** Estado amortecido. Inicia no meio-dia e é "encaixado" no primeiro quadro. */
  const estado = useMemo(
    () => ({
      pronto: false,
      sol: new THREE.Vector3(0, DISTANCIA_SOL, 0),
      lua: new THREE.Vector3(0, DISTANCIA_LUA, 0),
      corSol: new THREE.Color('#fff6e8'),
      corTopo: new THREE.Color('#1552b8'),
      corHorizonte: new THREE.Color('#a9c9ea'),
      corNeblina: new THREE.Color('#b9d2ea'),
      intSol: 4.4,
      intAmb: 0.95,
      densidade: 0.001,
      exposicao: 0.92,
      brilhoSol: 1,
      estrelas: 0,
      noite: 0,
      intLua: 0,
      cenica: 0,
      fracaoLua: 1,
    }),
    [],
  )

  const temp = useMemo(
    () => ({
      cor: new THREE.Color(),
      chao: new THREE.Color(),
      terra: new THREE.Color(COR_DO_CHAO),
      dir: new THREE.Vector3(),
      plano: new THREE.Vector3(),
      ultimaDirSombra: new THREE.Vector3(0, 1, 0),
      quadros: 999,
    }),
    [],
  )

  /** Câmera de sombra, resolução e viés. Refeito só quando a qualidade muda. */
  useEffect(() => {
    const configurar = (luz: THREE.DirectionalLight | null, mapa: number, normalBias: number) => {
      if (!luz) return
      const s = luz.shadow
      s.mapSize.set(mapa, mapa)
      const cam = s.camera
      cam.left = -RAIO_SOMBRA
      cam.right = RAIO_SOMBRA
      cam.top = RAIO_SOMBRA
      cam.bottom = -RAIO_SOMBRA
      cam.near = DISTANCIA_SOL - RAIO_SOMBRA - 40
      cam.far = DISTANCIA_SOL + RAIO_SOMBRA + 80
      cam.updateProjectionMatrix()
      // normalBias desloca a amostragem ao longo da normal: mata o moiré de
      // auto-sombra sem levantar a sombra do chão (o "peter panning" que o
      // bias clássico causa). 8 cm num prédio de 78 m é invisível.
      s.bias = -0.00012
      s.normalBias = normalBias
      // a cena é estática: a sombra só é redesenhada quando o sol mexe
      s.autoUpdate = false
      s.needsUpdate = true
      s.map?.dispose()
      s.map = null
    }
    const mapaSol = BANCO?.sombra ?? (alta ? 2048 : 1024)
    configurar(luzSol.current, mapaSol, alta ? 0.09 : 0.14)
    configurar(luzLua.current, alta ? 1024 : 512, 0.2)
    temp.quadros = 999
  }, [alta, temp])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const { hora, mes } = useTour.getState()

    const sol = posicaoDoSol(hora, mes)
    const lua = posicaoDaLua(hora, mes)
    const cores = coresDoCeu(sol.altitude)
    const par = parametrosDoCeu(sol.altitude)

    const primeiro = !estado.pronto
    estado.pronto = true
    const k = primeiro ? 1 : 1 - Math.exp(-LAMBDA * dt)
    const num = (atual: number, alvo: number) =>
      primeiro ? alvo : THREE.MathUtils.damp(atual, alvo, LAMBDA, dt)

    // ── posições e cores amortecidas ────────────────────────────────────
    // Amortece a DIREÇÃO, não o ponto: interpolar reto entre duas posições do
    // sol atravessa o interior da esfera, e num salto grande (meio-dia →
    // noite) a luz chegaria a passar perto do terreno, estourando o
    // enquadramento da sombra. Reprojetar na esfera mantém a distância fixa.
    temp.dir.set(sol.posicao[0], sol.posicao[1], sol.posicao[2])
    reprojetar(estado.sol.lerp(temp.dir, k), temp.dir, DISTANCIA_SOL)
    temp.dir.set(lua.posicao[0], lua.posicao[1], lua.posicao[2])
    reprojetar(estado.lua.lerp(temp.dir, k), temp.dir, DISTANCIA_LUA)

    estado.corSol.lerp(temp.cor.set(cores.sol), k)
    estado.corTopo.lerp(temp.cor.set(cores.topo), k)
    estado.corHorizonte.lerp(temp.cor.set(cores.horizonte), k)
    estado.corNeblina.lerp(temp.cor.set(cores.neblina), k)

    estado.intSol = num(estado.intSol, cores.intensidadeSol)
    estado.intAmb = num(estado.intAmb, cores.intensidadeAmbiente)
    estado.densidade = num(estado.densidade, par.densidadeNeblina)
    estado.exposicao = num(estado.exposicao, par.exposicao)
    estado.brilhoSol = num(estado.brilhoSol, par.brilhoDoSol)
    estado.estrelas = num(estado.estrelas, par.intensidadeEstrelas)
    estado.noite = num(estado.noite, par.noite)
    estado.intLua = num(estado.intLua, par.intensidadeLua)
    estado.cenica = num(estado.cenica, par.intensidadeCenica)
    estado.fracaoLua = num(estado.fracaoLua, lua.fracaoIluminada)

    // ── exposição: mantém dia e noite na mesma faixa de leitura ─────────
    state.gl.toneMappingExposure = estado.exposicao

    // ── neblina ─────────────────────────────────────────────────────────
    if (neblina.current) {
      neblina.current.color.copy(estado.corNeblina)
      neblina.current.density = estado.densidade
    }

    // ── luz do céu e preenchimento ──────────────────────────────────────
    temp.chao.copy(estado.corNeblina).lerp(temp.terra, 0.5).multiplyScalar(0.8)
    if (hemisferio.current) {
      hemisferio.current.color.copy(estado.corTopo)
      hemisferio.current.groundColor.copy(temp.chao)
      hemisferio.current.intensity = estado.intAmb
    }
    if (ambiente.current) {
      ambiente.current.color.copy(estado.corHorizonte)
      ambiente.current.intensity = estado.intAmb * 0.14
    }

    // ── sol ─────────────────────────────────────────────────────────────
    const solAcima = estado.sol.y > 0
    if (luzSol.current) {
      const luz = luzSol.current
      luz.position.copy(estado.sol).add(CENTRO_CENA)
      luz.target.position.copy(CENTRO_CENA)
      luz.target.updateMatrixWorld()
      luz.color.copy(estado.corSol)
      luz.intensity = solAcima ? estado.intSol : 0
      luz.castShadow = solAcima && estado.intSol > 0.02
    }

    // rebatimento do chão: vem do lado oposto ao sol, raso e sem sombra
    if (rebatimento.current) {
      const luz = rebatimento.current
      temp.dir.copy(estado.sol).normalize()
      luz.position.set(-temp.dir.x * 240, 60, -temp.dir.z * 240).add(CENTRO_CENA)
      luz.target.position.copy(CENTRO_CENA)
      luz.target.updateMatrixWorld()
      luz.color.copy(temp.chao)
      luz.intensity = Math.max(0, estado.intSol) * 0.14 + estado.noite * 0.03
    }

    // ── lua ─────────────────────────────────────────────────────────────
    const luaAcima = estado.lua.y > 0
    if (luzLua.current) {
      const luz = luzLua.current
      luz.position.copy(estado.lua).add(CENTRO_CENA)
      luz.target.position.copy(CENTRO_CENA)
      luz.target.updateMatrixWorld()
      luz.intensity = luaAcima ? estado.intLua * 0.42 * estado.fracaoLua : 0
      luz.castShadow = alta && !solAcima && luaAcima && luz.intensity > 0.02
    }

    // ── sombra: só redesenha quando o sol/lua mexem de verdade ──────────
    temp.quadros += 1
    temp.dir.copy(estado.sol).normalize()
    if (BANCO?.prof || temp.dir.angleTo(temp.ultimaDirSombra) > 0.0005 || temp.quadros > 60) {
      temp.ultimaDirSombra.copy(temp.dir)
      temp.quadros = 0
      if (luzSol.current) luzSol.current.shadow.needsUpdate = true
      if (luzLua.current) luzLua.current.shadow.needsUpdate = true
    }

    // ── domo de céu: acompanha a câmera e cabe sempre dentro do far ─────
    if (domo.current) {
      const far = (state.camera as THREE.PerspectiveCamera).far || 2000
      domo.current.position.copy(state.camera.position)
      domo.current.scale.setScalar(Math.min(RAIO_DOMO, far * 0.45))
      domo.current.updateMatrixWorld()
    }

    const u = matCeu.uniforms
    ;(u.uTopo.value as THREE.Color).copy(estado.corTopo)
    ;(u.uHorizonte.value as THREE.Color).copy(estado.corHorizonte)
    ;(u.uSol.value as THREE.Color).copy(estado.corSol)
    ;(u.uNeblina.value as THREE.Color).copy(estado.corNeblina)
    ;(u.uDirSol.value as THREE.Vector3).copy(estado.sol).normalize()
    temp.plano.set(estado.sol.x, 0, estado.sol.z)
    // sol a pino: a projeção no plano degenera, segura uma direção qualquer
    if (temp.plano.lengthSq() < 1e-6) temp.plano.set(0, 0, -1)
    ;(u.uDirSolPlano.value as THREE.Vector3).copy(temp.plano).normalize()
    u.uBrilhoSol.value = estado.brilhoSol

    // ── estrelas ────────────────────────────────────────────────────────
    matEstrelas.uniforms.uIntensidade.value = estado.estrelas
    matEstrelas.uniforms.uTempo.value = state.clock.elapsedTime
    matEstrelas.uniforms.uEscala.value = Math.min(2, state.viewport.dpr || 1)

    // ── disco da lua ────────────────────────────────────────────────────
    if (discoLua.current) {
      const m = discoLua.current
      const visivel = luaAcima && estado.noite > 0.01
      m.visible = visivel
      if (visivel) {
        temp.dir.copy(estado.lua).normalize().multiplyScalar(0.93)
        m.position.copy(temp.dir)
        m.scale.setScalar(ESCALA_LUA)
        // `lookAt` lê a própria matrixWorld, que ainda é a do quadro anterior:
        // atualiza antes, senão o disco fica um quadro atrás da orientação
        // certa — e no primeiro quadro, de lado.
        m.updateMatrix()
        m.updateMatrixWorld(true)
        m.lookAt(state.camera.position)
      }
    }
    matLua.uniforms.uFracao.value = estado.fracaoLua
    matLua.uniforms.uIntensidade.value = estado.noite

    // ── iluminação cênica ───────────────────────────────────────────────
    if (cenicas.current) {
      const grupo = cenicas.current
      grupo.visible = estado.cenica > 0.01
      if (grupo.visible) {
        for (const filho of grupo.children) {
          const luz = filho as THREE.PointLight
          luz.intensity = (luz.userData.base as number) * estado.cenica
        }
      }
    }
  })

  const cenicasVisiveis = alta ? LUZES_CENICAS : LUZES_CENICAS.filter((l) => l.essencial)

  return (
    <>
      <fogExp2 ref={neblina} attach="fog" args={['#b9d2ea', 0.001]} />

      <hemisphereLight ref={hemisferio} intensity={0.95} />
      <ambientLight ref={ambiente} intensity={0.13} />

      <directionalLight ref={luzSol} castShadow intensity={4.4} position={[0, 400, 0]} />
      <directionalLight ref={luzLua} intensity={0} position={[0, 400, 0]} />
      <directionalLight ref={rebatimento} intensity={0.5} position={[0, 60, 240]} />

      <group ref={domo} frustumCulled={false}>
        <mesh renderOrder={-1000} frustumCulled={false}>
          <sphereGeometry args={[1, 48, 32]} />
          <primitive object={matCeu} attach="material" />
        </mesh>
        <points renderOrder={-999} frustumCulled={false}>
          <primitive object={geoEstrelas} attach="geometry" />
          <primitive object={matEstrelas} attach="material" />
        </points>
        <mesh ref={discoLua} renderOrder={-998} frustumCulled={false} visible={false}>
          <planeGeometry args={[1, 1]} />
          <primitive object={matLua} attach="material" />
        </mesh>
      </group>

      <group ref={cenicas} visible={false}>
        {cenicasVisiveis.map((l, i) => (
          <pointLight
            key={i}
            position={l.posicao}
            color={l.cor}
            intensity={0}
            distance={l.distancia}
            decay={2}
            userData={{ base: l.intensidade }}
          />
        ))}
      </group>
    </>
  )
}
