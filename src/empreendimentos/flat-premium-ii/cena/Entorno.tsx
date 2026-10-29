/**
 * O bairro em volta. É o que se vê da varanda e o que dá escala ao prédio:
 * sem ele, seis pavimentos num terreno vazio podem ser dez ou trinta.
 *
 * A referência é a foto do lote (`esquina.webp`) e o fundo dos renders: casas
 * de um e dois pavimentos, telha cerâmica desbotada, muro de alvenaria rente
 * à calçada, poste de concreto com transformador e braço de luminária, fiação
 * aérea cruzando a esquina em todas as direções, mangueiras de quintal, e —
 * no horizonte, como aparece na foto da varanda — três ou quatro prédios de
 * meia altura.
 *
 * Tudo que repete é instanciado: duas tipologias de casa, um poste, uma
 * árvore, um carro e um bloco distante bastam para povoar quatro quadras.
 */
import { useMemo } from 'react'
import type { ReactElement } from 'react'
import * as THREE from 'three'
import { materiais } from './materiais'
import { Instancias, Peca } from './Instancias'
import {
  bloco,
  cabo,
  caixa,
  cilindro,
  esferaAchatada,
  hash,
  jitter,
  mesclar,
  mesclarOuVazio,
  piso,
} from './util'
import type { Transf } from './util'
import { MEIO_FIO_X, MEIO_FIO_Z } from './Terreno'

/* --------------------------------------------------------- as tipologias --- */

interface Casa {
  parede: THREE.BufferGeometry
  telhado: THREE.BufferGeometry
  vao: THREE.BufferGeometry
}

/** Telhado de quatro águas: tronco de pirâmide de base retangular. */
function quatroAguas(w: number, d: number, h: number, beiral: number, y: number) {
  const g = new THREE.CylinderGeometry(0.2, 1, 1, 4, 1, false)
  g.rotateY(Math.PI / 4)
  g.scale((w / 2 + beiral) * Math.SQRT2, h, (d / 2 + beiral) * Math.SQRT2)
  g.translate(0, y + h / 2, 0)
  return g
}

/** Abertura: peitoril, verga e ombreiras brancas em volta de um vão escuro. */
function abertura(
  parede: THREE.BufferGeometry[],
  vao: THREE.BufferGeometry[],
  cx: number,
  cy: number,
  w: number,
  h: number,
  z: number,
): void {
  vao.push(bloco(cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2, z - 0.08, z, 1))
  const m = 0.1
  parede.push(bloco(cx - w / 2 - m, cx + w / 2 + m, cy + h / 2, cy + h / 2 + m, z - 0.02, z + 0.05, 1))
  parede.push(bloco(cx - w / 2 - m, cx + w / 2 + m, cy - h / 2 - m, cy - h / 2, z - 0.02, z + 0.05, 1))
  for (const s of [-1, 1]) {
    const x = cx + (s * w) / 2
    parede.push(bloco(x - m / 2 + (s * m) / 2, x + m / 2 + (s * m) / 2, cy - h / 2, cy + h / 2, z - 0.02, z + 0.05, 1))
  }
}

/** Casa térrea de telhado aparente — a maioria do que a foto mostra. */
function casaTerrea(): Casa {
  const parede: THREE.BufferGeometry[] = []
  const vao: THREE.BufferGeometry[] = []
  parede.push(bloco(-4.6, 4.6, 0, 2.95, -3.6, 3.6, 2.5))
  abertura(parede, vao, -2.3, 1.55, 1.5, 1.2, 3.62)
  abertura(parede, vao, 2.1, 1.5, 1.3, 1.1, 3.62)
  // porta
  vao.push(bloco(-0.5, 0.5, 0.02, 2.2, 3.54, 3.62, 1))
  parede.push(bloco(-0.68, 0.68, 2.2, 2.32, 3.58, 3.66, 1))
  return {
    parede: mesclar(parede),
    telhado: quatroAguas(9.2, 7.2, 1.35, 0.45, 2.95),
    vao: mesclar(vao),
  }
}

/** Sobrado de platibanda, com o telhado baixo escondido atrás dela. */
function casaSobrado(): Casa {
  const parede: THREE.BufferGeometry[] = []
  const vao: THREE.BufferGeometry[] = []
  parede.push(bloco(-4.1, 4.1, 0, 5.8, -3.4, 3.4, 2.5))
  parede.push(bloco(-4.3, 4.3, 5.8, 6.55, -3.6, 3.6, 2.5))
  for (const [cy, h] of [
    [1.6, 1.3],
    [4.4, 1.2],
  ] as const) {
    abertura(parede, vao, -2, cy, 1.5, h, 3.42)
    abertura(parede, vao, 1.9, cy, 1.4, h, 3.42)
  }
  vao.push(bloco(-0.3, 0.3, 0.02, 2.2, 3.34, 3.42, 1))
  return {
    parede: mesclar(parede),
    telhado: quatroAguas(7.6, 6.2, 0.7, 0.1, 5.5),
    vao: mesclar(vao),
  }
}

/* ------------------------------------------------------------ implantação --- */

interface Quadra {
  x0: number
  x1: number
  z0: number
  z1: number
}

/** As quatro quadras vizinhas. O lote do empreendimento fica de fora. */
const QUADRAS: Quadra[] = [
  { x0: -56, x1: -23, z0: -48, z1: 8 },
  { x0: -16, x1: 15, z0: -48, z1: -15 },
  { x0: -56, x1: 30, z0: 32, z1: 52 },
  { x0: 40, x1: 56, z0: -48, z1: 52 },
]

interface Lote {
  x: number
  z: number
  giro: number
  sobrado: boolean
  semente: number
}

function lotear(alta: boolean): Lote[] {
  const passo = alta ? 12.5 : 17
  const lotes: Lote[] = []
  let n = 0
  for (const q of QUADRAS) {
    for (let x = q.x0 + passo / 2; x < q.x1; x += passo) {
      for (let z = q.z0 + passo / 2; z < q.z1; z += passo) {
        n += 1
        if (hash(x, z, 11) > 0.88) continue // terreno baldio, como na foto
        lotes.push({
          x: x + jitter(1.6, x, z, 1),
          z: z + jitter(1.6, x, z, 2),
          giro: Math.round(hash(x, z, 3) * 3) * (Math.PI / 2),
          sobrado: hash(x, z, 5) > 0.68,
          semente: n,
        })
      }
    }
  }
  return lotes
}

/** Tom de pintura de cada casa: branco sujo, creme, azulado, rosado. */
const PALETA = ['#efe7d8', '#e6ded0', '#dde6e4', '#f0e2dc', '#e8e9df', '#d9e2e6']

/* ----------------------------------------------------------- infra urbana --- */

/** Poste de concreto com cruzeta, isoladores e braço de luminária. */
function poste(): { concreto: THREE.BufferGeometry; ferro: THREE.BufferGeometry; luz: THREE.BufferGeometry } {
  const h = 9.5
  const concreto = mesclar([
    caixa(0.26, h, 0.2, [0, h / 2, 0], { uv: 2 }),
    caixa(2.2, 0.12, 0.12, [0, h - 0.9, 0], { uv: 1 }),
    caixa(1.5, 0.1, 0.1, [0, h - 1.9, 0], { uv: 1 }),
  ])
  const ferro: THREE.BufferGeometry[] = []
  for (const x of [-0.95, 0, 0.95]) {
    ferro.push(cilindro(0.07, 0.07, 0.22, 6, [x, h - 0.72, 0]))
  }
  for (const x of [-0.62, 0.62]) {
    ferro.push(cilindro(0.06, 0.06, 0.18, 6, [x, h - 1.76, 0]))
  }
  // braço da luminária, projetando para a rua
  ferro.push(caixa(0.09, 0.09, 2.2, [0, h - 2.6, 1.1], { uv: 1 }))
  ferro.push(caixa(0.09, 0.5, 0.09, [0, h - 2.85, 0.05], { uv: 1 }))
  return {
    concreto,
    ferro: mesclar(ferro),
    luz: mesclar([caixa(0.42, 0.14, 0.9, [0, h - 2.72, 2.2])]),
  }
}

interface Postagem {
  p: [number, number, number]
  giro: number
}

/** Postes na linha do meio-fio, com o da esquina na frente do prédio. */
const POSTES: Postagem[] = [
  { p: [-1.5, 0, MEIO_FIO_Z - 0.9], giro: Math.PI },
  { p: [-28, 0, MEIO_FIO_Z - 0.9], giro: Math.PI },
  { p: [MEIO_FIO_X - 0.9, 0, 13.4], giro: Math.PI },
  { p: [MEIO_FIO_X - 0.9, 0, -18], giro: -Math.PI / 2 },
  { p: [MEIO_FIO_X + 13.2, 0, MEIO_FIO_Z + 13.2], giro: Math.PI / 2 },
  { p: [-34, 0, MEIO_FIO_Z + 13.2], giro: 0 },
]

/** Fiação aérea: os vãos entre postes, com flecha. É a assinatura do bairro. */
function fiacao(alta: boolean): THREE.BufferGeometry {
  const vaos: Array<[Postagem, Postagem]> = [
    [POSTES[1], POSTES[0]],
    [POSTES[0], POSTES[2]],
    [POSTES[2], POSTES[3]],
    [POSTES[0], POSTES[4]],
    [POSTES[1], POSTES[5]],
    [POSTES[4], POSTES[5]],
  ]
  const alturas = alta ? [8.6, 8.6, 8.6, 7.6, 7.6, 6.9] : [8.6, 7.6, 6.9]
  const desvios = alta ? [-0.95, 0, 0.95, -0.6, 0.6, 0] : [-0.9, 0, 0.9]
  const partes: THREE.BufferGeometry[] = []
  const seg = alta ? 5 : 3
  for (const [a, b] of vaos) {
    const dx = b.p[0] - a.p[0]
    const dz = b.p[2] - a.p[2]
    const comp = Math.hypot(dx, dz)
    const nx = -dz / comp
    const nz = dx / comp
    for (let i = 0; i < alturas.length; i++) {
      const d = desvios[i % desvios.length]
      partes.push(
        ...cabo(
          [a.p[0] + nx * d, alturas[i], a.p[2] + nz * d],
          [b.p[0] + nx * d, alturas[i], b.p[2] + nz * d],
          Math.min(1.1, comp * 0.025),
          0.035,
          seg,
        ),
      )
    }
  }
  return mesclar(partes)
}

/* ------------------------------------------------------- árvore e carro --- */

function arvore(alta: boolean): { tronco: THREE.BufferGeometry; copa: THREE.BufferGeometry } {
  const tronco = mesclar([
    cilindro(0.2, 0.34, 3.4, alta ? 8 : 5, [0, 1.7, 0]),
    cilindro(0.12, 0.17, 1.6, 5, [0.5, 3.6, 0.2], { rz: -0.5 }),
    cilindro(0.12, 0.17, 1.6, 5, [-0.45, 3.7, -0.25], { rz: 0.5 }),
  ])
  const seg = alta ? 9 : 6
  const copa = mesclar([
    esferaAchatada(2.7, 0.78, seg, [0, 5.1, 0]),
    esferaAchatada(1.9, 0.8, seg, [1.9, 4.3, 0.5]),
    esferaAchatada(1.7, 0.8, seg, [-1.7, 4.5, -0.7]),
    esferaAchatada(1.5, 0.8, seg, [0.3, 6.4, -1.2]),
  ])
  return { tronco, copa }
}

/** Carro de passeio, bem simplificado: a esta distância é silhueta. */
function carro(): { lata: THREE.BufferGeometry; vidro: THREE.BufferGeometry } {
  const lata: THREE.BufferGeometry[] = [
    bloco(-2.1, 2.1, 0.42, 1.0, -0.86, 0.86, 2),
    bloco(-1.0, 1.1, 1.0, 1.45, -0.78, 0.78, 2),
  ]
  for (const x of [-1.42, 1.38]) {
    for (const z of [-0.84, 0.84]) {
      lata.push(cilindro(0.33, 0.33, 0.22, 8, [x, 0.33, z], { rx: Math.PI / 2 }))
    }
  }
  const vidro = mesclar([
    bloco(-0.98, 1.08, 1.04, 1.42, -0.8, 0.8, 2),
  ])
  return { lata: mesclar(lata), vidro }
}

const CARROS: Transf[] = [
  { p: [-12.5, 0, 13.4], cor: '#d8dadb' },
  { p: [-4.5, 0, 13.4], cor: '#2d3439' },
  { p: [5.5, 0, 13.4], cor: '#6e7276' },
  { p: [19.6, 0, -4], r: [0, Math.PI / 2, 0], cor: '#b9bcbd' },
  { p: [19.6, 0, 4.5], r: [0, Math.PI / 2, 0], cor: '#3a2f2c' },
  { p: [-21, 0, MEIO_FIO_Z + 10.6], r: [0, Math.PI, 0], cor: '#8f9497' },
]

/* ------------------------------------------------------- fundo distante --- */

/**
 * Os prédios de meia altura do horizonte. Aparecem na foto tirada da varanda
 * e na ponta direita do render de fachada; sem eles a vista da varanda cai no
 * vazio logo depois das casas.
 */
function blocoDistante(): { massa: THREE.BufferGeometry; vaos: THREE.BufferGeometry } {
  const andares = 7
  const h = 2.9
  const massa: THREE.BufferGeometry[] = [bloco(-8, 8, 0, andares * h + 0.8, -6, 6, 5)]
  const vaos: THREE.BufferGeometry[] = []
  for (let a = 0; a < andares; a++) {
    const y = 1.2 + a * h
    for (const z of [-6.02, 6.02] as const) {
      vaos.push(bloco(-7, 7, y, y + 1.5, Math.min(z, z + 0.08), Math.max(z, z + 0.08), 2))
    }
  }
  return { massa: mesclar(massa), vaos: mesclar(vaos) }
}

const DISTANTES: Transf[] = [
  { p: [-44, 0, -46], r: [0, 0.3, 0], s: [1, 1, 1] },
  { p: [52, 0, 44], r: [0, -0.5, 0], s: [0.9, 1.15, 1] },
  { p: [30, 0, -50], r: [0, 1.1, 0], s: [1.1, 0.85, 1] },
  { p: [-54, 0, 46], r: [0, 0.9, 0], s: [0.85, 1.05, 1] },
]

/* ----------------------------------------------------------- componente --- */

export function Entorno({ alta }: { alta: boolean }): ReactElement {
  const m = materiais()

  const terrea = useMemo(() => casaTerrea(), [])
  const sobrado = useMemo(() => casaSobrado(), [])
  const lotes = useMemo(() => lotear(alta), [alta])

  const { terreas, sobrados } = useMemo(() => {
    const t: Transf[] = []
    const s: Transf[] = []
    for (const l of lotes) {
      const item: Transf = {
        p: [l.x, 0, l.z],
        r: [0, l.giro, 0],
        cor: PALETA[Math.floor(hash(l.semente, 7) * PALETA.length) % PALETA.length],
      }
      if (l.sobrado) s.push(item)
      else t.push(item)
    }
    return { terreas: t, sobrados: s }
  }, [lotes])

  /** Muro de alvenaria na divisa das quadras, rente à calçada. */
  const muros = useMemo(() => {
    const partes: THREE.BufferGeometry[] = []
    const linha = (x0: number, x1: number, z0: number, z1: number) => {
      partes.push(bloco(x0, x1, 0, 2.3, z0, z1, 2.5))
      partes.push(bloco(x0 - 0.06, x1 + 0.06, 2.3, 2.45, z0 - 0.06, z1 + 0.06, 1))
    }
    linha(-56, -23, 9.6, 9.9)
    linha(-16, 15, -15.3, -15.0)
    linha(-56, 30, 31.6, 31.9)
    linha(39.7, 40, -48, 52)
    linha(-23.3, -23, -20, 9.9)
    return mesclar(partes)
  }, [])

  const p = useMemo(() => poste(), [])
  const postes = useMemo<Transf[]>(
    () => POSTES.map((x) => ({ p: x.p, r: [0, x.giro, 0] as const })),
    [],
  )
  const cabos = useMemo(() => fiacao(alta), [alta])

  const arv = useMemo(() => arvore(alta), [alta])
  const arvores = useMemo<Transf[]>(() => {
    const pontos: Array<[number, number]> = [
      [-27, 4],
      [-43, -6],
      [-9, -26],
      [11, -30],
      [-36, 38],
      [8, 38],
      [46, 8],
      [44, -30],
    ]
    return pontos.slice(0, alta ? pontos.length : 5).map(([x, z], i) => ({
      p: [x, 0, z] as const,
      r: [0, hash(x, z, 13) * Math.PI * 2, 0] as const,
      s: [0.8 + hash(i, 17) * 0.55, 0.8 + hash(i, 19) * 0.6, 0.8 + hash(i, 23) * 0.55] as const,
    }))
  }, [alta])

  const c = useMemo(() => carro(), [])
  const carros = useMemo(() => (alta ? CARROS : CARROS.slice(0, 3)), [alta])
  const carrosVidro = useMemo(
    () => carros.map((x) => ({ p: x.p, r: x.r })),
    [carros],
  )

  const distante = useMemo(() => blocoDistante(), [])

  /** Chão de terra batida dos quintais, um pouco acima da pista. */
  const quintais = useMemo(
    () =>
      mesclarOuVazio(
        QUADRAS.map((q) =>
          piso(q.x1 - q.x0 + 6, q.z1 - q.z0 + 6, [(q.x0 + q.x1) / 2, 0.05, (q.z0 + q.z1) / 2], 8),
        ),
      ),
    [],
  )

  return (
    <group name="entorno">
      <Peca geometria={quintais} material={m.terra} sombra={false} inerte />

      <Instancias geometria={terrea.parede} material={m.estuque} itens={terreas} />
      <Instancias geometria={terrea.telhado} material={m.telha} itens={terreas} />
      <Instancias geometria={terrea.vao} material={m.interior} itens={terreas} sombra={false} />
      <Instancias geometria={sobrado.parede} material={m.estuque} itens={sobrados} />
      <Instancias geometria={sobrado.telhado} material={m.telha} itens={sobrados} />
      <Instancias geometria={sobrado.vao} material={m.interior} itens={sobrados} sombra={false} />

      <Peca geometria={muros} material={m.estuque} inerte />

      <Instancias geometria={p.concreto} material={m.concreto} itens={postes} />
      <Instancias geometria={p.ferro} material={m.metalEscuro} itens={postes} sombra={alta} />
      <Instancias geometria={p.luz} material={m.luminaria} itens={postes} sombra={false} />
      <Peca geometria={cabos} material={m.metalEscuro} sombra={false} recebe={false} inerte />

      <Instancias geometria={arv.tronco} material={m.tronco} itens={arvores} />
      <Instancias geometria={arv.copa} material={m.folhagem} itens={arvores} />

      <Instancias geometria={c.lata} material={m.carroPintura} itens={carros} />
      <Instancias geometria={c.vidro} material={m.carroVidro} itens={carrosVidro} sombra={false} />

      <Instancias geometria={distante.massa} material={m.estuque} itens={DISTANTES} />
      <Instancias geometria={distante.vaos} material={m.interior} itens={DISTANTES} sombra={false} />
    </group>
  )
}
