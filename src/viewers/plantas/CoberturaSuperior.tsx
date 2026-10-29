/**
 * Cobertura Duplex — pavimento superior (2º nível).
 * Duas suítes e estar íntimo no bloco construído; terraço descoberto de 58 m²
 * com piscina privativa, pergolado e churrasqueira a Leste.
 * Envelope 1560 × 880 cm — 77,9 m² construídos + 58,1 m² de terraço.
 */
import { Bancada, Escada, Jardineira, Movel, Pergolado, Piscina, Tapete } from './mobilia'
import { PlantaBase } from './PlantaBase'
import type { PlantaDef } from './PlantaBase'
import { Rotulo, TINTA } from './kit'

export const defCoberturaSuperior: PlantaDef = {
  id: 'cobertura-superior',
  largura: 1560,
  altura: 880,
  margem: { esq: 170, dir: 180, topo: 140, base: 330 },

  comodos: [
    { id: 'suite-master', nome: 'Suíte master', x: 20, y: 20, w: 440, h: 320, piso: 'piso-madeira', setor: 'intimo', dy: 110 },
    { id: 'closet', nome: 'Closet', x: 475, y: 20, w: 410, h: 160, piso: 'piso-madeira', setor: 'intimo', corpo: 17, dy: -4 },
    { id: 'banho-master', nome: 'Banho da suíte master', x: 475, y: 195, w: 410, h: 145, piso: 'piso-pequeno', setor: 'intimo', linhas: ['Banho da', 'suíte master'], corpo: 15, dx: 96, dy: -16 },
    { id: 'estar', nome: 'Estar íntimo', x: 20, y: 355, w: 440, h: 265, piso: 'piso-madeira', setor: 'intimo', dx: -46, dy: -62 },
    { id: 'escada', nome: 'Escada', x: 475, y: 355, w: 225, h: 265, piso: 'piso-pedra', setor: 'intimo', corpo: 14, dy: -110 },
    { id: 'circulacao', nome: 'Circulação', x: 715, y: 355, w: 170, h: 265, piso: 'piso-grande', setor: 'intimo', corpo: 14, dy: -96 },
    { id: 'suite2', nome: 'Suíte 2', x: 20, y: 635, w: 380, h: 225, piso: 'piso-madeira', setor: 'intimo', dx: 70, dy: 66 },
    { id: 'banho-suite2', nome: 'Banho da suíte 2', x: 415, y: 635, w: 165, h: 225, piso: 'piso-pequeno', setor: 'intimo', linhas: ['Banho da', 'suíte 2'], corpo: 13, dy: -24 },
    { id: 'apoio', nome: 'Apoio da piscina', x: 595, y: 635, w: 290, h: 225, piso: 'piso-pequeno', setor: 'servico', linhas: ['Apoio da', 'piscina'], corpo: 15, dy: -28 },
    { id: 'terraco', nome: 'Terraço descoberto', x: 900, y: 0, w: 660, h: 880, piso: 'piso-deck', setor: 'externo', dy: -372 },
  ],

  paredes: [
    { x: 0, y: 0, w: 20, h: 20 },
    // fachada Norte
    { x: 0, y: 0, w: 120, h: 20 },
    { x: 360, y: 0, w: 525, h: 20 },
    // fachada Oeste
    { x: 0, y: 20, w: 20, h: 80 },
    { x: 0, y: 260, w: 20, h: 160 },
    { x: 0, y: 560, w: 20, h: 140 },
    { x: 0, y: 820, w: 20, h: 40 },
    // fachada Sul
    { x: 0, y: 860, w: 120, h: 20 },
    { x: 300, y: 860, w: 400, h: 20 },
    { x: 800, y: 860, w: 85, h: 20 },
    // parede do terraço
    { x: 885, y: 0, w: 15, h: 400 },
    { x: 885, y: 580, w: 15, h: 170 },
    { x: 885, y: 820, w: 15, h: 60 },
    // suíte master / closet
    { x: 460, y: 20, w: 15, h: 40 },
    { x: 460, y: 150, w: 15, h: 280 },
    { x: 460, y: 520, w: 15, h: 100 },
    { x: 475, y: 180, w: 85, h: 15 },
    { x: 640, y: 180, w: 245, h: 15 },
    // faixa dos quartos / estar
    { x: 20, y: 340, w: 130, h: 15 },
    { x: 240, y: 340, w: 220, h: 15 },
    { x: 475, y: 340, w: 410, h: 15 },
    // escada / circulação
    { x: 700, y: 355, w: 15, h: 65 },
    { x: 700, y: 540, w: 15, h: 80 },
    // faixa inferior
    { x: 20, y: 620, w: 100, h: 15 },
    { x: 210, y: 620, w: 190, h: 15 },
    { x: 415, y: 620, w: 165, h: 15 },
    { x: 595, y: 620, w: 65, h: 15 },
    { x: 740, y: 620, w: 145, h: 15 },
    { x: 400, y: 635, w: 15, h: 45 },
    { x: 400, y: 760, w: 15, h: 100 },
    { x: 580, y: 635, w: 15, h: 225 },
  ],

  guardaCorpos: [
    { x: 900, y: 0, w: 660, h: 12 },
    { x: 1548, y: 12, w: 12, h: 856 },
    { x: 900, y: 868, w: 660, h: 12 },
  ],

  esquadrias: [
    { x: 120, y: 0, comprimento: 240, espessura: 20 },
    { x: 0, y: 260, comprimento: 160, rot: -90, espessura: 20 },
    { x: 0, y: 560, comprimento: 140, rot: -90, espessura: 20 },
    { x: 120, y: 860, comprimento: 180, espessura: 20 },
    { x: 885, y: 580, comprimento: 180, rot: -90, espessura: 15 },
  ],

  basculantes: [{ x: 700, y: 860, comprimento: 100, espessura: 20 }],

  portas: [
    { x: 467, y: 60, largura: 90, rot: 90, espelho: true },
    { x: 560, y: 187, largura: 80 },
    { x: 150, y: 347, largura: 90 },
    { x: 467, y: 430, largura: 90, rot: 90, espelho: true },
    { x: 120, y: 627, largura: 90 },
    { x: 407, y: 680, largura: 80, rot: 90, espelho: true },
    { x: 660, y: 627, largura: 80 },
    { x: 892, y: 820, largura: 70, rot: -90, espelho: true },
  ],

  cotasH: [
    { x1: 0, x2: 1560, y: -110 },
    { x1: 0, x2: 885, y: -58 },
    { x1: 900, x2: 1560, y: -58 },
  ],
  cotasV: [
    { y1: 0, y2: 880, x: -112 },
    { y1: 0, y2: 340, x: -58 },
    { y1: 355, y2: 620, x: -58 },
    { y1: 635, y2: 860, x: -58 },
  ],

  norte: { x: 1655, y: -46, r: 44 },
  escala: { x: 1010, y: 1030, metros: 5 },
  selo: {
    x: 0,
    y: 955,
    titulo: 'Cobertura Duplex · 2º nível',
    linhas: [
      'Nível superior 77,9 m² construídos + terraço descoberto de 58,1 m²',
      '2 suítes  ·  estar íntimo  ·  piscina privativa de 13,2 m²  ·  apoio com banho',
      'Área privativa total do duplex 222 m², somados os dois níveis.',
      'Terraço voltado a Leste, com vista aberta para o Tapajós. Cotas em metros.',
    ],
    largura: 780,
  },
}

function MobiliaCoberturaSuperior({ sufixo: s }: { sufixo: string }) {
  return (
    <g>
      {/* ── suíte master ── */}
      <Tapete x={80} y={240} w={320} h={90} />
      <Movel nome="cama-casal" x={240} y={150} sufixo={s} />
      <Movel nome="poltrona" x={390} y={290} rot={200} sufixo={s} />
      <Movel nome="planta-m" x={58} y={300} sufixo={s} />

      {/* ── closet ── */}
      <Movel nome="closet" x={680} y={46} w={400} h={46} sufixo={s} />
      <Movel nome="closet" x={620} y={152} rot={180} w={280} h={46} sufixo={s} />
      <Movel nome="comoda" x={830} y={120} sufixo={s} />

      {/* ── banho da suíte master ── */}
      <Movel nome="banheira" x={580} y={260} sufixo={s} />
      <Movel nome="chuveiro" x={840} y={262} w={82} h={128} sufixo={s} />
      <Movel nome="lavatorio-duplo" x={710} y={218} w={158} h={44} sufixo={s} />
      <Movel nome="vaso" x={742} y={306} sufixo={s} />

      {/* ── estar íntimo ── */}
      <Movel nome="sofa-2" x={240} y={570} rot={180} sufixo={s} />
      <Movel nome="mesa-centro" x={240} y={480} sufixo={s} />
      <Movel nome="rack" x={60} y={470} rot={90} w={200} h={44} sufixo={s} />
      <Movel nome="planta-p" x={420} y={600} sufixo={s} />

      {/* ── escada e circulação ── */}
      <Escada x={500} y={402} w={180} h={193} degraus={14} sentido="baixo" />
      <Movel nome="aparador" x={860} y={500} rot={90} w={120} h={36} sufixo={s} />

      {/* ── suíte 2 ── */}
      <Movel nome="cama-queen" x={180} y={740} sufixo={s} />
      <Movel nome="armario" x={330} y={746} rot={90} w={200} h={46} sufixo={s} />

      {/* ── banho da suíte 2 ── */}
      <Movel nome="lavatorio" x={497} y={662} w={158} h={44} sufixo={s} />
      <Movel nome="vaso" x={540} y={736} sufixo={s} />
      <Movel nome="chuveiro" x={497} y={818} w={158} h={76} sufixo={s} />

      {/* ── apoio da piscina ── */}
      <Movel nome="chuveiro" x={840} y={700} w={82} h={120} sufixo={s} />
      <Movel nome="vaso" x={640} y={700} sufixo={s} />
      <Movel nome="lavatorio" x={720} y={662} w={120} h={42} sufixo={s} />
      <Movel nome="closet" x={700} y={830} rot={180} w={190} h={44} sufixo={s} />

      {/* ── terraço descoberto ── */}
      <Jardineira x={1494} y={34} w={34} h={466} sufixo={s} />
      <Piscina x={1060} y={120} w={400} h={330} sufixo={s} />
      <Rotulo x={1260} y={300} nome="Piscina privativa" area={13.2} corpo={18} />
      <Movel nome="espreguicadeira" x={958} y={200} sufixo={s} />
      <Movel nome="espreguicadeira" x={958} y={404} sufixo={s} />
      <Movel nome="guarda-sol" x={958} y={306} sufixo={s} opacidade={0.8} />
      <Movel nome="mesa-apoio" x={1012} y={548} sufixo={s} />
      <Pergolado x={1040} y={606} w={430} h={120} />
      <Bancada x={1040} y={606} w={420} h={56} />
      <Movel nome="churrasqueira" x={1120} y={634} sufixo={s} />
      <Movel nome="mesa-jantar-4" x={1250} y={780} sufixo={s} />
      <Movel nome="planta-g" x={968} y={800} sufixo={s} />
      <Movel nome="planta-m" x={1472} y={580} sufixo={s} />
      <Movel nome="planta-m" x={1472} y={760} sufixo={s} />

      <text x={1550} y={1008} textAnchor="end" fontSize={15} fill={TINTA.textoFraco} fontFamily="Inter, sans-serif">
        Guarda-corpo em vidro laminado em todo o perímetro do terraço
      </text>
    </g>
  )
}

export function PlantaCoberturaSuperior() {
  return (
    <PlantaBase def={defCoberturaSuperior} sufixo="cs">
      <MobiliaCoberturaSuperior sufixo="cs" />
    </PlantaBase>
  )
}
