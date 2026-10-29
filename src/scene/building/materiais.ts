/**
 * Paleta de materiais do complexo. Instâncias únicas, compartilhadas por todas
 * as malhas — é o que mantém a contagem de uniformes e de programas de shader baixa.
 * Nada de cor chapada: todo material tem mapa, rugosidade crível e normal onde cabe.
 */
import * as THREE from 'three'
import {
  aguaNormal,
  asfaltoMapa,
  asfaltoNormal,
  calcadaMapa,
  cobogoAlfa,
  concretoEscuroMapa,
  concretoMapa,
  concretoNormal,
  concretoRugosidade,
  deckMapa,
  deckNormal,
  estuqueMapa,
  folhagemMapa,
  gramaMapa,
  madeiraMapa,
  madeiraNormal,
  pedraMapa,
  pedraNormal,
  pisoBorrachaMapa,
  quadraMapa,
  telhadoMapa,
  terraMapa,
  venezianaAlfa,
} from './texturas'

export interface Materiais {
  concretoClaro: THREE.MeshStandardMaterial
  concretoEstrutural: THREE.MeshStandardMaterial
  concretoEscuro: THREE.MeshStandardMaterial
  pedra: THREE.MeshStandardMaterial
  madeira: THREE.MeshStandardMaterial
  deck: THREE.MeshStandardMaterial
  vidro: THREE.MeshPhysicalMaterial
  vidroGuarda: THREE.MeshPhysicalMaterial
  janelaAcesa: THREE.MeshStandardMaterial
  interior: THREE.MeshStandardMaterial
  metalEscuro: THREE.MeshStandardMaterial
  metalClaro: THREE.MeshStandardMaterial
  agua: THREE.MeshPhysicalMaterial
  espelhoAgua: THREE.MeshPhysicalMaterial
  grama: THREE.MeshStandardMaterial
  terra: THREE.MeshStandardMaterial
  folhagem: THREE.MeshStandardMaterial
  tronco: THREE.MeshStandardMaterial
  asfalto: THREE.MeshStandardMaterial
  calcada: THREE.MeshStandardMaterial
  faixa: THREE.MeshStandardMaterial
  quadra: THREE.MeshStandardMaterial
  borracha: THREE.MeshStandardMaterial
  cobogo: THREE.MeshStandardMaterial
  veneziana: THREE.MeshStandardMaterial
  estuque: THREE.MeshStandardMaterial
  telhado: THREE.MeshStandardMaterial
  carroPintura: THREE.MeshPhysicalMaterial
  carroVidro: THREE.MeshPhysicalMaterial
  luminaria: THREE.MeshStandardMaterial
}

let cache: Materiais | null = null

/** Fator de noite (0…1) visto pelo shader das janelas. */
const UNIFORME_NOITE = { value: 0 }

const entre = (a: number, b: number, t: number): number => a + (b - a) * t

function criar(): Materiais {
  const concretoClaro = new THREE.MeshStandardMaterial({
    map: concretoMapa(),
    normalMap: concretoNormal(),
    roughnessMap: concretoRugosidade(),
    color: new THREE.Color('#e6e1d6'),
    roughness: 0.78,
    metalness: 0,
    normalScale: new THREE.Vector2(0.45, 0.45),
    envMapIntensity: 0.6,
  })

  const concretoEstrutural = new THREE.MeshStandardMaterial({
    map: concretoMapa(),
    normalMap: concretoNormal(),
    roughnessMap: concretoRugosidade(),
    color: new THREE.Color('#cdc6b8'),
    roughness: 0.84,
    metalness: 0,
    normalScale: new THREE.Vector2(0.6, 0.6),
    envMapIntensity: 0.5,
  })

  const concretoEscuro = new THREE.MeshStandardMaterial({
    map: concretoEscuroMapa(),
    normalMap: concretoNormal(),
    color: new THREE.Color('#8e8a82'),
    roughness: 0.88,
    metalness: 0,
    normalScale: new THREE.Vector2(0.5, 0.5),
    envMapIntensity: 0.35,
  })

  const pedra = new THREE.MeshStandardMaterial({
    map: pedraMapa(),
    normalMap: pedraNormal(),
    color: new THREE.Color('#f0ece2'),
    roughness: 0.52,
    metalness: 0,
    normalScale: new THREE.Vector2(0.55, 0.55),
    envMapIntensity: 0.8,
  })

  const madeira = new THREE.MeshStandardMaterial({
    map: madeiraMapa(),
    normalMap: madeiraNormal(),
    color: new THREE.Color('#c9a985'),
    roughness: 0.62,
    metalness: 0,
    normalScale: new THREE.Vector2(0.6, 0.6),
    envMapIntensity: 0.45,
  })

  const deck = new THREE.MeshStandardMaterial({
    map: deckMapa(),
    normalMap: deckNormal(),
    color: new THREE.Color('#d2b593'),
    roughness: 0.66,
    metalness: 0,
    normalScale: new THREE.Vector2(0.8, 0.8),
    envMapIntensity: 0.4,
  })

  const vidro = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#b9cbc8'),
    roughness: 0.07,
    metalness: 0.08,
    transparent: true,
    opacity: 0.34,
    ior: 1.46,
    reflectivity: 0.62,
    envMapIntensity: 1.5,
    side: THREE.FrontSide,
    depthWrite: false,
  })

  const vidroGuarda = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#cfdedb'),
    roughness: 0.05,
    metalness: 0.04,
    transparent: true,
    opacity: 0.2,
    ior: 1.5,
    reflectivity: 0.5,
    envMapIntensity: 1.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  })

  /**
   * Janela acesa. Três decisões, todas medidas na tela:
   *
   * 1. BLENDING ADITIVO, com a malha desenhada depois do vidro (`ordem` em
   *    Torres.tsx). O painel aceso fica 22 cm ATRÁS da pele de vidro, e o
   *    vidro de noite é 62% opaco e quase preto — no modo normal ele comia
   *    quase dois terços da luz da janela e a fachada lia como um bloco
   *    escuro. Luz de janela soma à cena, não é tapada por ela.
   * 2. COR BASE PRETA: só o emissivo contribui, então de dia, com o fator
   *    de noite em zero, o painel sobe nada no quadro.
   * 3. ESCALONAMENTO: `aAcende` é um limiar por UNIDADE (todas as esquadrias
   *    do mesmo apartamento compartilham) e `uNoite` é o fator contínuo da
   *    atmosfera. Cada apartamento acende no seu momento ao longo do
   *    crepúsculo, em vez de o prédio inteiro piscar de uma vez.
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
      .replace('#include <common>', '#include <common>\nattribute float aAcende;\nvarying float vAcende;')
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

  const interior = new THREE.MeshStandardMaterial({
    map: concretoEscuroMapa(),
    color: new THREE.Color('#2c2f31'),
    roughness: 0.95,
    metalness: 0,
    envMapIntensity: 0.12,
  })

  const metalEscuro = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#3a3d40'),
    roughness: 0.38,
    metalness: 0.85,
    envMapIntensity: 1,
  })

  const metalClaro = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#b9bcbe'),
    roughness: 0.3,
    metalness: 0.92,
    envMapIntensity: 1.1,
  })

  const agua = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#2f8e95'),
    normalMap: aguaNormal(),
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.08,
    metalness: 0.02,
    transparent: true,
    opacity: 0.82,
    ior: 1.33,
    reflectivity: 0.5,
    envMapIntensity: 1.25,
  })

  const espelhoAgua = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#16292c'),
    normalMap: aguaNormal(),
    normalScale: new THREE.Vector2(0.18, 0.18),
    roughness: 0.04,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9,
    ior: 1.33,
    reflectivity: 0.72,
    envMapIntensity: 1.5,
  })

  const grama = new THREE.MeshStandardMaterial({
    map: gramaMapa(),
    color: new THREE.Color('#9fb089'),
    roughness: 0.92,
    metalness: 0,
    envMapIntensity: 0.4,
  })

  const terra = new THREE.MeshStandardMaterial({
    map: terraMapa(),
    color: new THREE.Color('#bdb098'),
    roughness: 0.95,
    metalness: 0,
    envMapIntensity: 0.3,
  })

  const folhagem = new THREE.MeshStandardMaterial({
    map: folhagemMapa(),
    color: new THREE.Color('#8fa877'),
    roughness: 0.86,
    metalness: 0,
    envMapIntensity: 0.45,
  })

  const tronco = new THREE.MeshStandardMaterial({
    map: madeiraMapa(),
    color: new THREE.Color('#8a8072'),
    roughness: 0.92,
    metalness: 0,
    envMapIntensity: 0.25,
  })

  const asfalto = new THREE.MeshStandardMaterial({
    map: asfaltoMapa(),
    normalMap: asfaltoNormal(),
    color: new THREE.Color('#9b9ea2'),
    roughness: 0.82,
    metalness: 0,
    normalScale: new THREE.Vector2(0.35, 0.35),
    envMapIntensity: 0.5,
  })

  const calcada = new THREE.MeshStandardMaterial({
    map: calcadaMapa(),
    normalMap: concretoNormal(),
    color: new THREE.Color('#ded8cc'),
    roughness: 0.8,
    metalness: 0,
    normalScale: new THREE.Vector2(0.3, 0.3),
    envMapIntensity: 0.55,
  })

  const faixa = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d9d4c4'),
    roughness: 0.7,
    metalness: 0,
    envMapIntensity: 0.5,
  })

  const mapaQuadra = quadraMapa()
  mapaQuadra.wrapS = THREE.ClampToEdgeWrapping
  mapaQuadra.wrapT = THREE.ClampToEdgeWrapping
  const quadra = new THREE.MeshStandardMaterial({
    map: mapaQuadra,
    roughness: 0.74,
    metalness: 0,
    envMapIntensity: 0.5,
  })

  const borracha = new THREE.MeshStandardMaterial({
    map: pisoBorrachaMapa(),
    roughness: 0.93,
    metalness: 0,
    envMapIntensity: 0.3,
  })

  const cobogo = new THREE.MeshStandardMaterial({
    map: concretoMapa(),
    normalMap: concretoNormal(),
    alphaMap: cobogoAlfa(),
    color: new THREE.Color('#d8d2c6'),
    roughness: 0.84,
    metalness: 0,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    envMapIntensity: 0.45,
  })

  const veneziana = new THREE.MeshStandardMaterial({
    map: madeiraMapa(),
    alphaMap: venezianaAlfa(),
    color: new THREE.Color('#b59a79'),
    roughness: 0.66,
    metalness: 0,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    envMapIntensity: 0.4,
  })

  const estuque = new THREE.MeshStandardMaterial({
    map: estuqueMapa(),
    color: new THREE.Color('#ffffff'),
    roughness: 0.86,
    metalness: 0,
    envMapIntensity: 0.45,
  })

  const telhado = new THREE.MeshStandardMaterial({
    map: telhadoMapa(),
    color: new THREE.Color('#e8ddd6'),
    roughness: 0.84,
    metalness: 0,
    envMapIntensity: 0.4,
  })

  const carroPintura = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ffffff'),
    roughness: 0.24,
    metalness: 0.55,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
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
    color: new THREE.Color('#2a2d2f'),
    emissive: new THREE.Color('#ffd9a0'),
    emissiveIntensity: 0,
    roughness: 0.4,
    metalness: 0.6,
  })

  return {
    concretoClaro,
    concretoEstrutural,
    concretoEscuro,
    pedra,
    madeira,
    deck,
    vidro,
    vidroGuarda,
    janelaAcesa,
    interior,
    metalEscuro,
    metalClaro,
    agua,
    espelhoAgua,
    grama,
    terra,
    folhagem,
    tronco,
    asfalto,
    calcada,
    faixa,
    quadra,
    borracha,
    cobogo,
    veneziana,
    estuque,
    telhado,
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

const COR_VIDRO_DIA = new THREE.Color('#b9cbc8')
const COR_VIDRO_NOITE = new THREE.Color('#131b1e')
const COR_AGUA_DIA = new THREE.Color('#2f8e95')
const COR_AGUA_NOITE = new THREE.Color('#13454c')

/**
 * Transição dia→noite, contínua. Recebe o MESMO fator `noite` que a frente de
 * luz usa para o céu (`parametrosDoCeu(altitude).noite`), e não um preset
 * discreto: com o preset, arrastar a régua de hora acendia o prédio inteiro
 * de uma vez às 18h24, com o sol ainda acima do horizonte e o céu laranja.
 *
 * As janelas NÃO entram aqui: quem as acende é `uNoite` no shader, para que
 * cada apartamento tenha o seu momento.
 */
export function ajustarPorHora(noite: number): void {
  const m = materiais()
  const n = Math.max(0, Math.min(1, noite))

  m.vidro.color.lerpColors(COR_VIDRO_DIA, COR_VIDRO_NOITE, n)
  m.vidro.opacity = entre(0.34, 0.62, n)
  m.vidro.roughness = entre(0.07, 0.12, n)
  m.vidro.envMapIntensity = entre(1.5, 0.7, n)

  m.vidroGuarda.opacity = entre(0.2, 0.14, n)
  m.vidroGuarda.envMapIntensity = entre(1.3, 0.6, n)

  m.agua.color.lerpColors(COR_AGUA_DIA, COR_AGUA_NOITE, n)
  m.agua.envMapIntensity = entre(1.25, 0.7, n)
  m.espelhoAgua.envMapIntensity = entre(1.5, 0.8, n)

  // o poste de rua acende um pouco antes das janelas, como na cidade
  m.luminaria.emissiveIntensity = entre(0, 2.6, Math.min(1, n * 1.6))

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
    m.vidroGuarda,
    m.agua,
    m.espelhoAgua,
    m.carroVidro,
    m.carroPintura,
    m.metalClaro,
    m.metalEscuro,
    m.pedra,
    m.concretoClaro,
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
  const escala = alta ? 1 : 0
  m.concretoClaro.normalScale.set(0.45 * escala, 0.45 * escala)
  m.concretoEstrutural.normalScale.set(0.6 * escala, 0.6 * escala)
  m.pedra.normalScale.set(0.55 * escala, 0.55 * escala)
  m.madeira.normalScale.set(0.6 * escala, 0.6 * escala)
  m.deck.normalScale.set(0.8 * escala, 0.8 * escala)
  m.asfalto.normalScale.set(0.35 * escala, 0.35 * escala)
  m.calcada.normalScale.set(0.3 * escala, 0.3 * escala)
  m.concretoClaro.roughnessMap = alta ? concretoRugosidade() : null
  m.concretoEstrutural.roughnessMap = alta ? concretoRugosidade() : null
  m.concretoClaro.needsUpdate = true
  m.concretoEstrutural.needsUpdate = true
}
