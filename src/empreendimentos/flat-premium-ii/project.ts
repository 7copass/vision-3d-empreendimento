/**
 * Flat Premium II — dados transcritos do material comercial recebido em
 * 29/10/2026: memorial descritivo, apresentação e quadro de valores.
 *
 * O que é documentado está marcado. O que é estimativa minha está dito.
 * Não há projeto arquitetônico executivo: o vendedor informou que a
 * construtora ainda não liberou.
 */
import type { Amenidade, Empreendimento, PontoUrbano, Tipologia } from '../../core/types'

export const EMPREENDIMENTO: Empreendimento = {
  nome: 'Flat Premium II',
  subtitulo: 'Flats · Investimento e moradia',
  construtora: 'Guarnão',
  corretora: 'CS Empreendimentos',
  endereco: 'Rua Magnólia com Alameda Trinta e Três',
  bairro: 'Santarém',
  cidade: 'Santarém',
  uf: 'PA',
  lat: -2.4431,
  lng: -54.7083,
  entrega: 'Janeiro de 2028 (previsão informada)',
  fonteDoQuadro: {
    descricao: 'Quadro comercial do vendedor, sujeito a confirmação',
    recebidoEm: '29/10/2026',
  },
  descricao:
    'Condomínio residencial multifamiliar de seis pavimentos sobre térreo com garagem. ' +
    'Sessenta e seis flats de 31,40 m² privativos, em esquina, com varanda em todas as ' +
    'unidades e dezenove vagas coletivas por locação.',
}

const M = (n: string) => `/img/flat-premium-ii/${n}.webp`

export const AMENIDADES: Amenidade[] = [
  {
    id: 'garagem',
    nome: 'Garagem coletiva',
    categoria: 'servico',
    nivel: 'terreo',
    posicao: [0, 1.8, 6],
    descricao: 'Dezenove vagas comuns por locação, sem vínculo individual aos flats.',
    imagens: [M('garagem')],
  },
  {
    id: 'acesso',
    nome: 'Hall de acesso',
    categoria: 'convivencia',
    nivel: 'terreo',
    posicao: [14, 1.8, 9],
    descricao: 'Acesso social pela esquina, com controle na entrada.',
    imagens: [M('garagem-acesso')],
  },
  {
    id: 'varanda',
    nome: 'Varanda privativa',
    categoria: 'lazer',
    nivel: 'podium',
    posicao: [0, 6, -10],
    descricao: 'Todas as unidades têm varanda com guarda-corpo metálico e vista aberta.',
    imagens: [M('varanda')],
  },
]

/**
 * Distâncias urbanas ESTIMADAS a partir do endereço informado. Não houve
 * geocodificação nem medição: precisam de confirmação antes de uso comercial.
 */
export const PONTOS_URBANOS: PontoUrbano[] = [
  {
    id: 'orla',
    nome: 'Orla do Tapajós',
    categoria: 'Lazer',
    distanciaKm: 2.0,
    tempoMin: 7,
    rumo: 340,
  },
  {
    id: 'mercadao',
    nome: 'Mercadão 2000',
    categoria: 'Comércio',
    distanciaKm: 2.6,
    tempoMin: 9,
    rumo: 335,
  },
  {
    id: 'shopping',
    nome: 'Shopping Rio Tapajós',
    categoria: 'Comércio',
    distanciaKm: 3.0,
    tempoMin: 10,
    rumo: 100,
  },
  {
    id: 'aeroporto',
    nome: 'Aeroporto Maestro Wilson Fonseca',
    categoria: 'Mobilidade',
    distanciaKm: 7.5,
    tempoMin: 15,
    rumo: 285,
  },
  {
    id: 'ufopa',
    nome: 'UFOPA — Campus Tapajós',
    categoria: 'Ensino',
    distanciaKm: 3.6,
    tempoMin: 11,
    rumo: 300,
  },
  {
    id: 'hospital',
    nome: 'Hospital Municipal',
    categoria: 'Saúde',
    distanciaKm: 2.4,
    tempoMin: 8,
    rumo: 20,
  },
]

export const TIPOLOGIAS: Tipologia[] = [
  {
    id: 'flat',
    nome: 'Flat',
    rotulo: '31,40 m² · 1 dormitório',
    areaPrivativa: 31.4,
    areaTotal: 31.5,
    dormitorios: 1,
    suites: 1,
    banheiros: 1,
    vagas: 0,
    precoBase: 218000,
    descricao:
      'Living integrado à varanda, cozinha compacta e dormitório com banho privativo. ' +
      'Área privativa de 31,40 m² segundo o memorial descritivo; a apresentação ' +
      'comercial menciona 31,5 m² de área construída.',
    destaques: [
      'Varanda em todas as unidades',
      'Living integrado',
      'Garagem coletiva com 19 vagas',
      'Entrega prevista para janeiro de 2028',
    ],
    ambientes: [
      { id: 'fachada-dia', titulo: 'Fachada diurna', categoria: 'Fachada', src: M('fachada-dia') },
      {
        id: 'fachada-entardecer',
        titulo: 'Fachada ao entardecer',
        categoria: 'Fachada',
        src: M('fachada-entardecer'),
      },
      {
        id: 'fachada-noite',
        titulo: 'Iluminação de fachada',
        categoria: 'Fachada',
        src: M('fachada-noite'),
      },
      {
        id: 'interior-social',
        titulo: 'Ambiente social',
        categoria: 'Interiores',
        src: M('interior-social'),
      },
      { id: 'varanda', titulo: 'Varanda', categoria: 'Interiores', src: M('varanda') },
      { id: 'interior-19', titulo: 'Interiores', categoria: 'Interiores', src: M('interior-19') },
      { id: 'interior-22', titulo: 'Detalhes', categoria: 'Interiores', src: M('interior-22') },
      { id: 'garagem', titulo: 'Garagem coletiva', categoria: 'Interiores', src: M('garagem') },
      {
        id: 'garagem-acesso',
        titulo: 'Acesso da garagem',
        categoria: 'Interiores',
        src: M('garagem-acesso'),
      },
      { id: 'entorno', titulo: 'Paisagem do entorno', categoria: 'Entorno', src: M('entorno') },
      { id: 'esquina', titulo: 'Entorno imediato', categoria: 'Entorno', src: M('esquina') },
      { id: 'localizacao', titulo: 'Localização', categoria: 'Entorno', src: M('localizacao') },
    ],
    plantas: [
      {
        id: 'planta-flat',
        titulo: 'Planta do flat',
        pavimento: 'Unidade',
        desenho: 'imagem:planta-flat',
      },
      {
        id: 'planta-andar',
        titulo: 'Pavimento tipo',
        pavimento: 'Pavimento',
        desenho: 'imagem:planta-andar',
      },
      {
        id: 'planta-garagem',
        titulo: 'Garagem',
        pavimento: 'Térreo',
        desenho: 'imagem:planta-garagem',
      },
    ],
  },
]

export const tipologiaById = (): Tipologia => TIPOLOGIAS[0]
