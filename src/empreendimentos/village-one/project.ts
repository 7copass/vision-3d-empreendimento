/**
 * Dados do empreendimento.
 * Base real: anúncio Amauri Assessoria Imobiliária, ref. 25 (Village One / Ribeiro Engenharia).
 * Tudo que o anúncio não informa é ficção verossímil desta fase de demonstração.
 */
import type { Amenidade, Empreendimento, PontoUrbano, Tipologia } from '../../core/types'

export const EMPREENDIMENTO: Empreendimento = {
  nome: 'Village One',
  subtitulo: 'Residencial · Alto padrão',
  construtora: 'Ribeiro Engenharia',
  corretora: 'Amauri Assessoria Imobiliária',
  endereco: 'Av. Eng. Fernando Guilhon, 680',
  bairro: 'Maracanã',
  cidade: 'Santarém',
  uf: 'PA',
  lat: -2.4431,
  lng: -54.7083,
  entrega: 'Dezembro de 2028',
  descricao:
    'Duas torres de vinte pavimentos sobre um embasamento de lazer contínuo, na avenida que ' +
    'liga o Maracanã à orla do Tapajós. Arquitetura contemporânea, varandas profundas em todas ' +
    'as unidades e um pavimento inteiro dedicado ao convívio.',
}

const R = (n: number) => `/img/render/r${String(n).padStart(2, '0')}.jpeg`

export const AMENIDADES: Amenidade[] = [
  {
    id: 'portaria',
    nome: 'Portaria 24h',
    categoria: 'servico',
    nivel: 'terreo',
    posicao: [0, 1.5, 34],
    descricao: 'Guarita blindada com dupla eclusa, controle facial e recepção de encomendas.',
    imagens: ['/img/render/r11.png'],
  },
  {
    id: 'mercado',
    nome: 'Mercado 24 horas',
    categoria: 'servico',
    nivel: 'terreo',
    posicao: [-52, 1.5, 28],
    descricao: 'Loja autônoma de conveniência, aberta a qualquer hora, com acesso pelo hall.',
    imagens: [R(3)],
  },
  {
    id: 'lobby',
    nome: 'Lobby social',
    categoria: 'convivencia',
    nivel: 'terreo',
    posicao: [0, 1.5, 20],
    descricao: 'Pé-direito duplo, paginação em pedra natural e jardim de inverno.',
    imagens: [R(1)],
  },
  {
    id: 'piscina',
    nome: 'Piscina com raia',
    categoria: 'lazer',
    nivel: 'podium',
    posicao: [0, 10.8, 8],
    descricao: 'Raia de 25 metros, prainha e borda infinita voltada para o poente.',
    imagens: [R(5), R(6)],
  },
  {
    id: 'deck',
    nome: 'Deck molhado',
    categoria: 'lazer',
    nivel: 'podium',
    posicao: [14, 10.8, 10],
    descricao: 'Espreguiçadeiras sobre lâmina d água, sombreado por pergolado de madeira.',
    imagens: [R(7)],
  },
  {
    id: 'academia',
    nome: 'Academia',
    categoria: 'esporte',
    nivel: 'podium',
    posicao: [-54, 10.8, -29],
    descricao: 'Trezentos metros quadrados com sala de peso livre, cardio e estúdio de funcional.',
    imagens: [R(8)],
  },
  {
    id: 'salao',
    nome: 'Salão de festas',
    categoria: 'convivencia',
    nivel: 'podium',
    posicao: [54, 10.8, -29],
    descricao: 'Dois salões integráveis, copa de apoio e terraço com churrasqueira.',
    imagens: [R(9)],
  },
  {
    id: 'quadra',
    nome: 'Quadra poliesportiva',
    categoria: 'esporte',
    nivel: 'podium',
    posicao: [-18, 10.8, 22],
    descricao: 'Piso esportivo profissional, iluminação noturna e alambrado acústico.',
    imagens: [R(10)],
  },
  {
    id: 'playground',
    nome: 'Playground',
    categoria: 'lazer',
    nivel: 'podium',
    posicao: [20, 10.8, 22],
    descricao: 'Brinquedos em madeira certificada sobre piso amortecedor.',
    imagens: [R(7)],
  },
  {
    id: 'coworking',
    nome: 'Coworking',
    categoria: 'convivencia',
    nivel: 'podium',
    posicao: [-14, 10.8, -19.5],
    descricao: 'Oito estações, duas cabines de reunião e internet dedicada.',
    imagens: [R(4)],
  },
  {
    id: 'petplace',
    nome: 'Pet place',
    categoria: 'lazer',
    nivel: 'podium',
    posicao: [48, 10.8, 16],
    descricao: 'Área cercada com grama natural, bebedouro e banho de apoio.',
    imagens: [R(12)],
  },
  {
    id: 'churrasqueira',
    nome: 'Churrasqueiras',
    categoria: 'convivencia',
    nivel: 'podium',
    posicao: [16, 10.8, -16],
    descricao: 'Quatro módulos independentes com bancada em quartzo e forno de pizza.',
    imagens: [R(13)],
  },
]

export const PONTOS_URBANOS: PontoUrbano[] = [
  {
    id: 'orla',
    nome: 'Orla do Tapajós',
    categoria: 'Lazer',
    distanciaKm: 2.4,
    tempoMin: 7,
    rumo: 350,
  },
  {
    id: 'mercadao',
    nome: 'Mercadão 2000',
    categoria: 'Comércio',
    distanciaKm: 3.1,
    tempoMin: 10,
    rumo: 345,
  },
  {
    id: 'shopping',
    nome: 'Shopping Rio Tapajós',
    categoria: 'Comércio',
    distanciaKm: 3.6,
    tempoMin: 11,
    rumo: 95,
  },
  {
    id: 'aeroporto',
    nome: 'Aeroporto Maestro Wilson Fonseca',
    categoria: 'Mobilidade',
    distanciaKm: 8.2,
    tempoMin: 16,
    rumo: 285,
  },
  {
    id: 'ufopa',
    nome: 'UFOPA — Campus Tapajós',
    categoria: 'Ensino',
    distanciaKm: 4.1,
    tempoMin: 12,
    rumo: 300,
  },
  {
    id: 'hospital',
    nome: 'Hospital Municipal',
    categoria: 'Saúde',
    distanciaKm: 2.9,
    tempoMin: 9,
    rumo: 20,
  },
  {
    id: 'encontro',
    nome: 'Encontro das Águas',
    categoria: 'Lazer',
    distanciaKm: 4.6,
    tempoMin: 14,
    rumo: 10,
  },
  {
    id: 'alter',
    nome: 'Alter do Chão',
    categoria: 'Lazer',
    distanciaKm: 32.0,
    tempoMin: 42,
    rumo: 250,
  },
]

const amb = (ids: number[], nomes: string[], cats: string[]) =>
  ids.map((n, i) => ({
    id: `amb-${n}-${i}`,
    titulo: nomes[i],
    categoria: cats[i],
    src: n === 11 ? '/img/render/r11.png' : R(n),
  }))

export const TIPOLOGIAS: Tipologia[] = [
  {
    id: 'tipo-1',
    nome: 'Tipo 1',
    rotulo: '111 m² · 3 dormitórios',
    areaPrivativa: 111,
    areaTotal: 148,
    dormitorios: 3,
    suites: 1,
    banheiros: 2,
    vagas: 2,
    precoBase: 820000,
    descricao:
      'Living integrado à varanda gourmet em toda a extensão da fachada, suíte master com ' +
      'closet e duas semi-suítes. Cozinha com passagem direta para a área de serviço.',
    destaques: [
      'Varanda gourmet de 14 m²',
      'Suíte master com closet',
      'Living integrado',
      '2 vagas cobertas',
    ],
    ambientes: amb(
      [1, 2, 3, 4, 5, 6, 7, 11],
      [
        'Fachada',
        'Hall de entrada',
        'Living integrado',
        'Varanda gourmet',
        'Piscina',
        'Deck',
        'Playground',
        'Portaria',
      ],
      ['Externo', 'Social', 'Social', 'Social', 'Lazer', 'Lazer', 'Lazer', 'Externo'],
    ),
    plantas: [
      { id: 't1-p1', titulo: 'Planta humanizada', pavimento: 'Pavimento tipo', desenho: 'tipo-1' },
      {
        id: 't1-p2',
        titulo: 'Setorização',
        pavimento: 'Pavimento tipo',
        desenho: 'tipo-1-setores',
      },
    ],
  },
  {
    id: 'tipo-2',
    nome: 'Tipo 2',
    rotulo: '75 m² · 2 dormitórios',
    areaPrivativa: 75,
    areaTotal: 102,
    dormitorios: 2,
    suites: 1,
    banheiros: 2,
    vagas: 2,
    precoBase: 650000,
    descricao:
      'Planta compacta e sem corredor perdido: living e varanda formam um único salão, e os ' +
      'dois dormitórios ficam no lado silencioso da unidade.',
    destaques: [
      'Zero área de circulação morta',
      'Varanda com churrasqueira',
      'Suíte com armário embutido',
      '2 vagas cobertas',
    ],
    ambientes: amb(
      [2, 3, 8, 9, 10, 12, 13],
      ['Fachada', 'Living', 'Academia', 'Salão de festas', 'Quadra', 'Pet place', 'Churrasqueiras'],
      ['Externo', 'Social', 'Lazer', 'Lazer', 'Esporte', 'Lazer', 'Lazer'],
    ),
    plantas: [
      { id: 't2-p1', titulo: 'Planta humanizada', pavimento: 'Pavimento tipo', desenho: 'tipo-2' },
    ],
  },
  {
    id: 'cobertura',
    nome: 'Cobertura Duplex',
    rotulo: '222 m² · 4 dormitórios',
    areaPrivativa: 222,
    areaTotal: 296,
    dormitorios: 4,
    suites: 2,
    banheiros: 4,
    vagas: 3,
    precoBase: 1980000,
    descricao:
      'Dois pavimentos ligados por escada escultural. Piscina privativa e terraço descoberto ' +
      'de 60 m² no nível superior, com vista aberta para o Tapajós.',
    destaques: ['Piscina privativa', 'Terraço de 60 m²', 'Dois pavimentos', '3 vagas cobertas'],
    ambientes: amb(
      [4, 5, 6, 14, 15],
      ['Terraço', 'Piscina privativa', 'Living duplex', 'Suíte master', 'Vista do Tapajós'],
      ['Externo', 'Lazer', 'Social', 'Íntimo', 'Externo'],
    ),
    plantas: [
      {
        id: 'cob-p1',
        titulo: 'Pavimento inferior',
        pavimento: '1º nível',
        desenho: 'cobertura-inferior',
      },
      {
        id: 'cob-p2',
        titulo: 'Pavimento superior',
        pavimento: '2º nível',
        desenho: 'cobertura-superior',
      },
    ],
  },
]

export const tipologiaById = (id: string): Tipologia =>
  TIPOLOGIAS.find((t) => t.id === id) ?? TIPOLOGIAS[0]
