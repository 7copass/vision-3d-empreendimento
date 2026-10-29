/**
 * Entorno: quarteirões vizinhos de baixa densidade, postes e carros.
 * Serve de escala e contexto. Tudo instanciado, tudo fora do raycast, nada
 * acima de três pavimentos — o entorno não pode competir com as torres.
 */
import { useMemo } from 'react'
import type { ReactElement } from 'react'
import * as THREE from 'three'
import { PODIUM, TERRENO } from '../../empreendimentos/village-one/world'
import { materiais } from './materiais'
import { ACESSOS, VIAS } from './Terreno'
import { Instancias } from './Instancias'
import { caixa, cilindro, hash, mesclar } from './util'
import type { Transf } from './util'

/* --------------------------------------------------------- quarteirões --- */

const MALHA = 17 // lado da célula, em metros
const ALCANCE = 17 // células para cada lado da origem
const RUA_CADA = 5 // a cada cinco células, uma rua

const FACHADAS_VIZINHAS = ['#efe7d8', '#e6e8e2', '#f2ded0', '#dde4e6', '#eae2cf', '#e3dcd4']

interface Entorno {
  casas: Transf[]
  telhados: Transf[]
  postes: Transf[]
  luminarias: Transf[]
  carros: Transf[]
  carrosLisos: Transf[]
}

/**
 * Onde não se constrói: o lote do empreendimento e a caixa das vias desenhadas
 * em Terreno. Sem isto, apareceriam casas em cima da Av. Fernando Guilhon.
 */
function viaOuSitio(x: number, z: number): boolean {
  const folga = 9
  const lote =
    Math.abs(x) < VIAS.lateral.d1 + folga &&
    z > VIAS.servico.z0 - folga &&
    z < VIAS.calcadaOposta.z1 + folga
  const avenida = z > VIAS.avenida.z0 - folga && z < VIAS.avenida.z1 + folga
  const servico = z > VIAS.servico.z0 - folga && z < VIAS.servico.z1 + folga
  const laterais =
    Math.abs(x) > VIAS.lateral.d0 - folga && Math.abs(x) < VIAS.lateral.d1 + folga
  return lote || avenida || servico || laterais
}

function quarteiroes(alta: boolean, saida: Entorno): void {
  const passo = alta ? 1 : 2
  for (let i = -ALCANCE; i <= ALCANCE; i += passo) {
    for (let j = -ALCANCE; j <= ALCANCE; j += passo) {
      if (i % RUA_CADA === 0 || j % RUA_CADA === 0) continue
      const hx = hash(i, j, 1)
      const hz = hash(i, j, 2)
      const hh = hash(i, j, 3)
      const hc = hash(i, j, 4)
      if (hc < 0.22) continue

      const x = i * MALHA + (hx - 0.5) * 3.4
      const z = j * MALHA + (hz - 0.5) * 3.4
      if (viaOuSitio(x, z)) continue

      const larg = 8.5 + hx * 5.5
      const prof = 8.5 + hz * 5.5
      const pavimentos = hh < 0.56 ? 1 : hh < 0.88 ? 2 : 3
      const altura = 3.1 * pavimentos + 0.4
      const giro = Math.round(hash(i, j, 5) * 4) * (Math.PI / 2)
      const cor = FACHADAS_VIZINHAS[Math.floor(hash(i, j, 6) * FACHADAS_VIZINHAS.length) % FACHADAS_VIZINHAS.length]

      saida.casas.push({
        p: [x, altura / 2, z],
        r: [0, giro, 0],
        s: [larg / 10, altura / 10, prof / 10],
        cor,
      })
      // telhado: baixo, de duas águas esquemáticas
      saida.telhados.push({
        p: [x, altura + 0.75, z],
        r: [0, giro, 0],
        s: [(larg + 1.2) / 10, 1, (prof + 1.2) / 10],
      })
    }
  }
}

/* -------------------------------------------------------------- postes --- */

function postes(alta: boolean, saida: Entorno): void {
  const passo = alta ? 26 : 44
  const zSul = VIAS.avenida.z0 - 1.1
  const zNorte = VIAS.avenida.z1 + 1.1
  for (let x = -TERRENO.largura / 2 - 20; x <= TERRENO.largura / 2 + 20; x += passo) {
    saida.postes.push({ p: [x, 0.17, zSul], r: [0, 0, 0] })
    saida.luminarias.push({ p: [x, 0.17, zSul], r: [0, 0, 0] })
    saida.postes.push({ p: [x + passo / 2, 0.17, zNorte], r: [0, Math.PI, 0] })
    saida.luminarias.push({ p: [x + passo / 2, 0.17, zNorte], r: [0, Math.PI, 0] })
  }
  const xLat = VIAS.lateral.d0 - 1.1
  for (let z = -140; z <= VIAS.avenida.z0 - 6; z += passo) {
    saida.postes.push({ p: [-xLat, 0.17, z], r: [0, Math.PI / 2, 0] })
    saida.luminarias.push({ p: [-xLat, 0.17, z], r: [0, Math.PI / 2, 0] })
    saida.postes.push({ p: [xLat, 0.17, z], r: [0, -Math.PI / 2, 0] })
    saida.luminarias.push({ p: [xLat, 0.17, z], r: [0, -Math.PI / 2, 0] })
  }
}

/* -------------------------------------------------------------- carros --- */

const CORES_CARRO = ['#1f2325', '#cfd3d6', '#8c9196', '#243b52', '#6e2a2c', '#f0f1ee', '#3c4f3a']

function carros(alta: boolean, saida: Entorno): void {
  const vagas: Array<[number, number, number]> = []
  // estacionados ao longo da avenida, dos dois lados
  const passo = alta ? 7.2 : 13
  for (let x = -92; x <= 92; x += passo) {
    vagas.push([x, VIAS.avenida.z0 + 2.2, 0])
    vagas.push([x + 3.4, VIAS.avenida.z1 - 2.2, Math.PI])
  }
  // nas vias laterais
  for (let z = -40; z <= 36; z += passo * 1.6) {
    vagas.push([-(VIAS.lateral.d0 + 2.4), z, Math.PI / 2])
    vagas.push([VIAS.lateral.d0 + 2.4, z, -Math.PI / 2])
  }
  // na praça de embarque e na rampa da garagem
  vagas.push([-7, PODIUM.profundidade / 2 + 4, Math.PI / 2])
  vagas.push([6, PODIUM.profundidade / 2 + 4, Math.PI / 2])
  vagas.push([(ACESSOS.garagem[0] + ACESSOS.garagem[1]) / 2 - 3, PODIUM.profundidade / 2 + 7, 0])

  for (let i = 0; i < vagas.length; i++) {
    const [x, z, giro] = vagas[i]
    if (hash(i, 71) < 0.34) continue
    const cor = CORES_CARRO[Math.floor(hash(i, 72) * CORES_CARRO.length) % CORES_CARRO.length]
    const base: Transf = { p: [x, 0.17, z], r: [0, giro, 0] }
    saida.carros.push({ ...base, cor })
    saida.carrosLisos.push(base)
  }
}

/* ----------------------------------------------------------- geometrias --- */

/** Casa unitária 10 × 10 × 10, escalada por instância. */
const geoCasa = (): THREE.BufferGeometry => caixa(10, 10, 10, [0, 0, 0], { uv: 3.5 })

/** Telhado em duas águas, 10 × 10 de base, escalado por instância. */
function geoTelhado(): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  const h = 1.5
  const a = 5
  const vertices = new Float32Array([
    -a, -h / 2, -a, a, -h / 2, -a, a, -h / 2, a, -a, -h / 2, a,
    -a, h / 2, 0, a, h / 2, 0,
  ])
  const indices = [
    0, 1, 5, 0, 5, 4, // água norte
    3, 4, 5, 3, 5, 2, // água sul
    0, 4, 3, 1, 2, 5, // oitões
  ]
  g.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  g.setIndex(indices)
  g.computeVertexNormals()
  const uv = new Float32Array([0, 0, 2.4, 0, 2.4, 2.4, 0, 2.4, 0, 1.2, 2.4, 1.2])
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.computeBoundingSphere()
  return g
}

function geoPoste(): THREE.BufferGeometry {
  return mesclar([
    cilindro(0.07, 0.11, 8.4, 6, [0, 4.2, 0]),
    caixa(0.1, 0.1, 1.9, [0, 8.3, 0.95], { uv: 1 }),
    caixa(0.1, 0.5, 0.1, [0, 8.1, 1.75], { uv: 1 }),
  ])
}

const geoLuminaria = (): THREE.BufferGeometry =>
  caixa(0.52, 0.16, 0.9, [0, 7.86, 1.75], { uv: 1 })

function geoCarroCorpo(): THREE.BufferGeometry {
  return mesclar([
    caixa(4.4, 0.72, 1.82, [0, 0.62, 0], { uv: 2 }),
    caixa(2.9, 0.34, 1.76, [-0.15, 1.05, 0], { uv: 2 }),
    caixa(1.0, 0.22, 1.7, [1.9, 0.82, 0], { uv: 2 }),
  ])
}

const geoCarroVidro = (): THREE.BufferGeometry =>
  mesclar([caixa(2.3, 0.56, 1.68, [-0.15, 1.42, 0], { uv: 2 })])

function geoCarroRodas(): THREE.BufferGeometry {
  const partes: THREE.BufferGeometry[] = []
  for (const x of [-1.42, 1.42]) {
    for (const z of [-0.82, 0.82]) {
      partes.push(cilindro(0.33, 0.33, 0.24, 10, [x, 0.33, z], { rx: Math.PI / 2 }))
    }
  }
  return mesclar(partes)
}

/* ---------------------------------------------------------- componente --- */

export function Entorno({ alta }: { alta: boolean }): ReactElement {
  const m = materiais()

  const geo = useMemo(
    () => ({
      casa: geoCasa(),
      telhado: geoTelhado(),
      poste: geoPoste(),
      luminaria: geoLuminaria(),
      corpo: geoCarroCorpo(),
      vidro: geoCarroVidro(),
      rodas: geoCarroRodas(),
    }),
    [],
  )

  const e = useMemo(() => {
    const saida: Entorno = {
      casas: [],
      telhados: [],
      postes: [],
      luminarias: [],
      carros: [],
      carrosLisos: [],
    }
    quarteiroes(alta, saida)
    postes(alta, saida)
    carros(alta, saida)
    return saida
  }, [alta])

  return (
    <group name="entorno">
      <Instancias
        geometria={geo.casa}
        material={m.estuque}
        itens={e.casas}
        sombra={alta}
        inerte
      />
      <Instancias
        geometria={geo.telhado}
        material={m.telhado}
        itens={e.telhados}
        sombra={alta}
        inerte
      />
      <Instancias geometria={geo.poste} material={m.metalEscuro} itens={e.postes} sombra={alta} inerte />
      <Instancias
        geometria={geo.luminaria}
        material={m.luminaria}
        itens={e.luminarias}
        sombra={false}
        recebe={false}
        inerte
      />
      <Instancias geometria={geo.corpo} material={m.carroPintura} itens={e.carros} inerte />
      <Instancias geometria={geo.vidro} material={m.carroVidro} itens={e.carrosLisos} sombra={false} inerte />
      <Instancias geometria={geo.rodas} material={m.metalEscuro} itens={e.carrosLisos} sombra={alta} inerte />
    </group>
  )
}
