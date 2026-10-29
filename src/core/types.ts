/** Contratos compartilhados. Nenhuma frente altera este arquivo. */

export type TowerId = 'A' | 'B'
export type UnitStatus = 'disponivel' | 'reservada' | 'vendida'
export type Orientacao = 'norte' | 'leste' | 'sul' | 'oeste'
/** Posição da unidade no pavimento. Village One usa 1–4; Flat Premium II, 1–11. */
export type Posicao = number

/** Modos de tela. 'orbita' é o estado inicial. */
export type Modo = 'orbita' | 'unidade' | 'vista' | 'galeria' | 'plantas' | 'filme' | 'mapa'

/** Presets de horário da barra superior. */
export type PresetHora = 'manha' | 'meiodia' | 'portaldosol' | 'noite'

export interface Ambiente {
  id: string
  titulo: string
  categoria: string
  src: string
}

export interface Planta {
  id: string
  titulo: string
  pavimento: string
  /** id do desenho SVG gerado em src/viewers. */
  desenho: string
}

export interface Tipologia {
  id: string
  nome: string
  rotulo: string
  areaPrivativa: number
  areaTotal: number
  dormitorios: number
  suites: number
  banheiros: number
  vagas: number
  precoBase: number
  descricao: string
  destaques: string[]
  ambientes: Ambiente[]
  plantas: Planta[]
}

/** Condição de pagamento transcrita do quadro comercial, quando existe. */
export interface Parcelamento {
  meses: number
  valor: number
  /** Como veio escrito no quadro, literal. */
  juros: string
  /** O mesmo juro em número, quando o quadro informa. Para comparar e ordenar. */
  jurosMes?: number
}

export interface Unidade {
  id: string
  torre: TowerId
  andar: number
  posicao: Posicao
  numero: string
  tipologiaId: string
  status: UnitStatus
  preco: number
  orientacao: Orientacao
  vista: string
  /** Metros do centro da unidade até cada amenidade, por id. */
  distancias: Record<string, number>
  /** Condições transcritas do quadro comercial. Vazio quando não informado. */
  parcelas?: Parcelamento[]
}

export interface Amenidade {
  id: string
  nome: string
  categoria: 'lazer' | 'servico' | 'esporte' | 'convivencia'
  nivel: 'terreo' | 'podium'
  descricao: string
  /** Posição no mundo 3D, em metros. */
  posicao: [number, number, number]
  imagens: string[]
}

export interface PontoUrbano {
  id: string
  nome: string
  categoria: string
  distanciaKm: number
  tempoMin: number
  /** Direção a partir do empreendimento, em graus (0 = Norte, horário). */
  rumo: number
}

export interface Empreendimento {
  nome: string
  subtitulo: string
  construtora: string
  corretora: string
  endereco: string
  bairro: string
  cidade: string
  uf: string
  lat: number
  lng: number
  entrega: string
  descricao: string
  /** De onde vieram preços e condições, e quando. Vazio quando é ficção. */
  fonteDoQuadro?: { descricao: string; recebidoEm: string }
}

export interface Filtros {
  tipologias: string[]
  status: UnitStatus[]
  orientacoes: Orientacao[]
  andarMin: number
  precoMax: number | null
}
