/**
 * Paleta de materiais do Flat Premium II. Instâncias únicas, compartilhadas
 * por todas as malhas — é o que mantém baixa a contagem de programas de shader.
 *
 * A leitura de cor vem dos renders comerciais: fachada em reboco branco com
 * os nichos de varanda num bege-acinzentado, lâminas verticais marrom-escuras,
 * esquadria branca, guarda-corpo de tubo metálico escuro, base em pedra
 * empilhada quase preta. Nada de cor chapada: todo material tem mapa.
 */
import * as THREE from 'three'
import {
  asfaltoMapa,
  asfaltoNormal,
  calcadaMapa,
  concretoMapa,
  concretoNormal,
  estuqueMapa,
  folhagemMapa,
  gramaMapa,
  graniliteMapa,
  lamelaAlfa,
  letreiroAlfa,
  logoAlfa,
  madeiraMapa,
  pedraEscuraMapa,
  pedraEscuraNormal,
  rebocoMapa,
  rebocoNormal,
  rebocoRugosidade,
  telhaMapa,
  terraMapa,
} from './texturas'

export interface Materiais {
  rebocoBranco: THREE.MeshStandardMaterial
  rebocoNicho: THREE.MeshStandardMaterial
  rebocoCreme: THREE.MeshStandardMaterial
  concreto: THREE.MeshStandardMaterial
  granilite: THREE.MeshStandardMaterial
  pedraEscura: THREE.MeshStandardMaterial
  pinturaEscura: THREE.MeshStandardMaterial
  metalEscuro: THREE.MeshStandardMaterial
  metalClaro: THREE.MeshStandardMaterial
  lamela: THREE.MeshStandardMaterial
  esquadria: THREE.MeshStandardMaterial
  vidro: THREE.MeshPhysicalMaterial
  interior: THREE.MeshStandardMaterial
  janelaAcesa: THREE.MeshStandardMaterial
  fitaLed: THREE.MeshStandardMaterial
  letreiro: THREE.MeshStandardMaterial
  logotipo: THREE.MeshStandardMaterial
  madeira: THREE.MeshStandardMaterial
  asfalto: THREE.MeshStandardMaterial
  faixaViaria: THREE.MeshStandardMaterial
  calcada: THREE.MeshStandardMaterial
  meioFio: THREE.MeshStandardMaterial
  terra: THREE.MeshStandardMaterial
  grama: THREE.MeshStandardMaterial
  estuque: THREE.MeshStandardMaterial
  telha: THREE.MeshStandardMaterial
  folhagem: THREE.MeshStandardMaterial
  tronco: THREE.MeshStandardMaterial
  carroPintura: THREE.MeshPhysicalMaterial
  carroVidro: THREE.MeshPhysicalMaterial
  luminaria: THREE.MeshStandardMaterial
}

let cache: Materiais | null = null

/** Fator de noite (0…1) visto pelo shader das janelas acesas. */
const UNIFORME_NOITE = { value: 0 }

const entre = (a: number, b: number, t: number): number => a + (b - a) * t

function criar(): Materiais {
  const rebocoBranco = new THREE.MeshStandardMaterial({
    map: rebocoMapa(),
    normalMap: rebocoNormal(),
    roughnessMap: rebocoRugosidade(),
    color: new THREE.Color('#f2efe9'),
    roughness: 0.82,
    metalness: 0,
    normalScale: new THREE.Vector2(0.35, 0.35),
    envMapIntensity: 0.5,
  })

  /** Fundo das varandas: o bege-acinzentado que o render usa nos nichos. */
  const rebocoNicho = new THREE.MeshStandardMaterial({
    map: rebocoMapa(),
    normalMap: rebocoNormal(),
    color: new THREE.Color('#c9c0b4'),
    roughness: 0.86,
    metalness: 0,
    normalScale: new THREE.Vector2(0.4, 0.4),
    envMapIntensity: 0.4,
  })

  /** Cornija, testeiras e molduras: meio tom acima do branco da parede. */
  const rebocoCreme = new THREE.MeshStandardMaterial({
    map: rebocoMapa(),
    normalMap: rebocoNormal(),
    color: new THREE.Color('#ddd6c8'),
    roughness: 0.8,
    metalness: 0,
    normalScale: new THREE.Vector2(0.3, 0.3),
    envMapIntensity: 0.55,
  })

  const concreto = new THREE.MeshStandardMaterial({
    map: concretoMapa(),
    normalMap: concretoNormal(),
    color: new THREE.Color('#b8b2a6'),
    roughness: 0.88,
    metalness: 0,
    normalScale: new THREE.Vector2(0.5, 0.5),
    envMapIntensity: 0.35,
  })

  const granilite = new THREE.MeshStandardMaterial({
    map: graniliteMapa(),
    color: new THREE.Color('#ded8cd'),
    roughness: 0.58,
    metalness: 0,
    envMapIntensity: 0.6,
  })

  const pedraEscura = new THREE.MeshStandardMaterial({
    map: pedraEscuraMapa(),
    normalMap: pedraEscuraNormal(),
    color: new THREE.Color('#9b9a98'),
    roughness: 0.74,
    metalness: 0,
    normalScale: new THREE.Vector2(1, 1),
    envMapIntensity: 0.45,
  })

  /** Lâminas verticais e aleta da quina: pintura marrom-grafite acetinada. */
  const pinturaEscura = new THREE.MeshStandardMaterial({
    map: rebocoMapa(),
    normalMap: rebocoNormal(),
    color: new THREE.Color('#44403c'),
    roughness: 0.52,
    metalness: 0.06,
    normalScale: new THREE.Vector2(0.22, 0.22),
    envMapIntensity: 0.7,
    side: THREE.DoubleSide,
  })

  const metalEscuro = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#2e3134'),
    roughness: 0.34,
    metalness: 0.88,
    envMapIntensity: 1,
  })

  const metalClaro = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#c3c6c8'),
    roughness: 0.28,
    metalness: 0.92,
    envMapIntensity: 1.15,
  })

  /** Portão de garagem e brises: lâminas horizontais com fresta vazada. */
  const lamela = new THREE.MeshStandardMaterial({
    alphaMap: lamelaAlfa(),
    color: new THREE.Color('#34373a'),
    roughness: 0.42,
    metalness: 0.7,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    envMapIntensity: 0.8,
  })

  /** Esquadria branca: alumínio pintado, o caixilho de todas as janelas. */
  const esquadria = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f6f4f0'),
    roughness: 0.36,
    metalness: 0.25,
    envMapIntensity: 0.9,
  })

  const vidro = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#aebfbd'),
    roughness: 0.06,
    metalness: 0.06,
    transparent: true,
    opacity: 0.36,
    ior: 1.46,
    reflectivity: 0.62,
    envMapIntensity: 1.5,
    side: THREE.FrontSide,
    depthWrite: false,
  })

  const interior = new THREE.MeshStandardMaterial({
    map: concretoMapa(),
    color: new THREE.Color('#2a2d2f'),
    roughness: 0.95,
    metalness: 0,
    envMapIntensity: 0.1,
  })

  /**
   * Janela acesa. Três decisões, as mesmas que o Village One mediu na tela e
   * que valem igual aqui:
   *
   * 1. BLENDING ADITIVO, com a malha desenhada DEPOIS do vidro (`ordem` em
   *    Edificio.tsx). O painel fica 18 cm atrás da pele de vidro e o vidro de
   *    noite é 62% opaco e quase preto: no modo normal ele comia a maior parte
   *    da luz da janela. Luz de janela soma à cena, não é tapada por ela.
   * 2. COR BASE PRETA: só o emissivo contribui, então de dia, com o fator de
   *    noite em zero, o painel não sobe nada no quadro.
   * 3. ESCALONAMENTO: `aAcende` é um limiar por UNIDADE — as duas esquadrias
   *    do mesmo flat compartilham — e `uNoite` é o fator contínuo da
   *    atmosfera. Cada flat acende no seu momento ao longo do crepúsculo, em
   *    vez de o prédio inteiro piscar de uma vez.
   */
  const janelaAcesa = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#000000'),
    emissive: new THREE.Color('#ffc98a'),
    emissiveIntensity: 1.5,
    roughness: 1,
    metalness: 0,
    toneMapped: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  janelaAcesa.onBeforeCompile = (shader) => {
    shader.uniforms.uNoite = UNIFORME_NOITE
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute float aAcende;\nvarying float vAcende;',
      )
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvAcende = aAcende;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uNoite;\nvarying float vAcende;')
      .replace(
        '#include <emissivemap_fragment>',
        [
          '#include <emissivemap_fragment>',
          '#ifdef USE_COLOR',
          '\ttotalEmissiveRadiance *= vColor.rgb;',
          '#endif',
          '\ttotalEmissiveRadiance *= smoothstep( vAcende, vAcende + 0.22, uNoite );',
        ].join('\n'),
      )
  }

  /**
   * Fita de LED. O render noturno é quase todo feito dela: ela contorna a
   * cornija, desce pelas lâminas verticais, acompanha a aleta da quina e
   * lava o forro de cada varanda. De dia é um perfil de alumínio apagado,
   * então a cor base existe e o emissivo é que entra em cena.
   */
  const fitaLed = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d8d2c6'),
    emissive: new THREE.Color('#ffd9a4'),
    emissiveIntensity: 0,
    roughness: 0.5,
    metalness: 0.2,
    toneMapped: true,
  })

  /** Letras da quina: alumínio escovado de dia, luz branca de noite. */
  const letreiro = new THREE.MeshStandardMaterial({
    alphaMap: letreiroAlfa(),
    color: new THREE.Color('#cfd3d4'),
    emissive: new THREE.Color('#ffffff'),
    emissiveIntensity: 0,
    roughness: 0.3,
    metalness: 0.85,
    alphaTest: 0.45,
    side: THREE.DoubleSide,
    envMapIntensity: 1.1,
  })

  const logotipo = new THREE.MeshStandardMaterial({
    alphaMap: logoAlfa(),
    color: new THREE.Color('#d2d6d6'),
    emissive: new THREE.Color('#58e08c'),
    emissiveIntensity: 0,
    roughness: 0.28,
    metalness: 0.88,
    alphaTest: 0.4,
    side: THREE.DoubleSide,
    envMapIntensity: 1.1,
  })

  const madeira = new THREE.MeshStandardMaterial({
    map: madeiraMapa(),
    color: new THREE.Color('#c6a77f'),
    roughness: 0.56,
    metalness: 0,
    envMapIntensity: 0.4,
  })

  const asfalto = new THREE.MeshStandardMaterial({
    map: asfaltoMapa(),
    normalMap: asfaltoNormal(),
    color: new THREE.Color('#9aa0a4'),
    roughness: 0.84,
    metalness: 0,
    normalScale: new THREE.Vector2(0.35, 0.35),
    envMapIntensity: 0.45,
  })

  const faixaViaria = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d6d2c4'),
    roughness: 0.72,
    metalness: 0,
    envMapIntensity: 0.45,
  })

  const calcada = new THREE.MeshStandardMaterial({
    map: calcadaMapa(),
    normalMap: concretoNormal(),
    color: new THREE.Color('#ddd8cd'),
    roughness: 0.8,
    metalness: 0,
    normalScale: new THREE.Vector2(0.28, 0.28),
    envMapIntensity: 0.5,
  })

  const meioFio = new THREE.MeshStandardMaterial({
    map: concretoMapa(),
    color: new THREE.Color('#9a958c'),
    roughness: 0.7,
    metalness: 0,
    envMapIntensity: 0.55,
  })

  const terra = new THREE.MeshStandardMaterial({
    map: terraMapa(),
    color: new THREE.Color('#c0a78f'),
    roughness: 0.96,
    metalness: 0,
    envMapIntensity: 0.3,
  })

  const grama = new THREE.MeshStandardMaterial({
    map: gramaMapa(),
    color: new THREE.Color('#9eae84'),
    roughness: 0.93,
    metalness: 0,
    envMapIntensity: 0.35,
  })

  const estuque = new THREE.MeshStandardMaterial({
    map: estuqueMapa(),
    color: new THREE.Color('#ffffff'),
    roughness: 0.88,
    metalness: 0,
    envMapIntensity: 0.4,
  })

  const telha = new THREE.MeshStandardMaterial({
    map: telhaMapa(),
    color: new THREE.Color('#e4d6ce'),
    roughness: 0.86,
    metalness: 0,
    envMapIntensity: 0.35,
  })

  const folhagem = new THREE.MeshStandardMaterial({
    map: folhagemMapa(),
    color: new THREE.Color('#8ba273'),
    roughness: 0.88,
    metalness: 0,
    envMapIntensity: 0.4,
  })

  const tronco = new THREE.MeshStandardMaterial({
    map: madeiraMapa(),
    color: new THREE.Color('#7e766a'),
    roughness: 0.93,
    metalness: 0,
    envMapIntensity: 0.2,
  })

  const carroPintura = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ffffff'),
    roughness: 0.26,
    metalness: 0.55,
    clearcoat: 0.9,
    clearcoatRoughness: 0.14,
    envMapIntensity: 1.2,
  })

  const carroVidro = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#1b2326'),
    roughness: 0.12,
    metalness: 0.3,
    transparent: true,
    opacity: 0.62,
    envMapIntensity: 1.1,
  })

  const luminaria = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#9aa0a2'),
    emissive: new THREE.Color('#ffd9a0'),
    emissiveIntensity: 0,
    roughness: 0.42,
    metalness: 0.6,
  })

  return {
    rebocoBranco,
    rebocoNicho,
    rebocoCreme,
    concreto,
    granilite,
    pedraEscura,
    pinturaEscura,
    metalEscuro,
    metalClaro,
    lamela,
    esquadria,
    vidro,
    interior,
    janelaAcesa,
    fitaLed,
    letreiro,
    logotipo,
    madeira,
    asfalto,
    faixaViaria,
    calcada,
    meioFio,
    terra,
    grama,
    estuque,
    telha,
    folhagem,
    tronco,
    carroPintura,
    carroVidro,
    luminaria,
  }
}

/** Paleta compartilhada. Criada na primeira chamada, dentro do browser. */
export function materiais(): Materiais {
  if (!cache) cache = criar()
  return cache
}

const COR_VIDRO_DIA = new THREE.Color('#aebfbd')
const COR_VIDRO_NOITE = new THREE.Color('#121a1d')

/**
 * Transição dia→noite, contínua. Recebe o fator `noite` da atmosfera
 * (`parametrosDoCeu(altitude).noite`), que é função da altitude real do sol —
 * não um degrau de preset. É o que faz as fitas de LED e o letreiro
 * aparecerem junto com o céu do render de entardecer, e não de uma vez.
 *
 * As janelas NÃO entram aqui: quem as acende é `uNoite` no shader, para que
 * cada flat tenha o seu momento.
 */
export function ajustarPorHora(noite: number): void {
  const m = materiais()
  const n = Math.max(0, Math.min(1, noite))

  m.vidro.color.lerpColors(COR_VIDRO_DIA, COR_VIDRO_NOITE, n)
  m.vidro.opacity = entre(0.36, 0.62, n)
  m.vidro.roughness = entre(0.06, 0.11, n)
  m.vidro.envMapIntensity = entre(1.5, 0.7, n)

  // a iluminação arquitetônica acende um pouco antes das janelas, como a da rua
  const cedo = Math.min(1, n * 1.6)
  m.fitaLed.emissiveIntensity = entre(0, 2.3, cedo)
  m.letreiro.emissiveIntensity = entre(0, 2.1, cedo)
  m.logotipo.emissiveIntensity = entre(0, 2.6, cedo)
  m.luminaria.emissiveIntensity = entre(0, 2.6, cedo)

  UNIFORME_NOITE.value = n
}

/** O fator de noite em vigor, para quem precisar ler. */
export const fatorDeNoite = (): number => UNIFORME_NOITE.value

/**
 * Liga o mapa de reflexo nos materiais que dependem dele. `null` desliga, para
 * que o `scene.environment` da frente de luz assuma quando existir.
 */
export function aplicarReflexo(env: THREE.Texture | null): void {
  const m = materiais()
  const reflexivos: THREE.Material[] = [
    m.vidro,
    m.metalClaro,
    m.metalEscuro,
    m.esquadria,
    m.letreiro,
    m.logotipo,
    m.lamela,
    m.granilite,
    m.pedraEscura,
    m.carroVidro,
    m.carroPintura,
    m.rebocoCreme,
  ]
  for (const mat of reflexivos) {
    const alvo = mat as THREE.MeshStandardMaterial
    if (alvo.envMap === env) continue
    alvo.envMap = env
    alvo.needsUpdate = true
  }
}

/** Ajuste global de detalhe. No modo 'media' os normal maps saem de cena. */
export function ajustarQualidade(alta: boolean): void {
  const m = materiais()
  const e = alta ? 1 : 0
  m.rebocoBranco.normalScale.set(0.35 * e, 0.35 * e)
  m.rebocoNicho.normalScale.set(0.4 * e, 0.4 * e)
  m.rebocoCreme.normalScale.set(0.3 * e, 0.3 * e)
  m.concreto.normalScale.set(0.5 * e, 0.5 * e)
  m.pedraEscura.normalScale.set(1 * e, 1 * e)
  m.asfalto.normalScale.set(0.35 * e, 0.35 * e)
  m.calcada.normalScale.set(0.28 * e, 0.28 * e)
  m.rebocoBranco.roughnessMap = alta ? rebocoRugosidade() : null
  m.rebocoBranco.needsUpdate = true
}
