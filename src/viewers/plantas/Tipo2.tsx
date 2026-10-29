/**
 * Tipo 2 — 75 m², 2 dormitórios (1 suíte), 2 banheiros.
 * Sem corredor perdido: o hall de entrada distribui e o living é o eixo.
 * Envelope 1100 × 685 cm = 75,35 m² de área privativa.
 */
import { Bancada, Jardineira, Movel, Pergolado, Tapete } from './mobilia'
import { PlantaBase } from './PlantaBase'
import type { PlantaDef } from './PlantaBase'
import { Soleira, TINTA } from './kit'

export const defTipo2: PlantaDef = {
  id: 'tipo-2',
  largura: 1100,
  altura: 685,
  margem: { esq: 160, dir: 170, topo: 140, base: 320 },

  comodos: [
    { id: 'varanda', nome: 'Varanda gourmet', x: 12, y: 12, w: 568, h: 178, piso: 'piso-deck', setor: 'social', dy: 62, corpo: 17 },
    { id: 'living', nome: 'Living / Jantar', x: 20, y: 210, w: 560, h: 210, piso: 'piso-grande', setor: 'social', dx: -60, dy: 70 },
    { id: 'suite', nome: 'Suíte', x: 595, y: 20, w: 305, h: 290, piso: 'piso-madeira', setor: 'intimo', dy: 64 },
    { id: 'banho-suite', nome: 'Banho da suíte', x: 915, y: 20, w: 165, h: 290, piso: 'piso-pequeno', setor: 'intimo', linhas: ['Banho da', 'suíte'], corpo: 13, dy: -4 },
    { id: 'circulacao', nome: 'Circulação', x: 595, y: 325, w: 485, h: 95, piso: 'piso-grande', setor: 'intimo', dx: 160, corpo: 15 },
    { id: 'dorm2', nome: 'Dormitório 2', x: 20, y: 435, w: 300, h: 230, piso: 'piso-madeira', setor: 'intimo', dx: 30, dy: 72 },
    { id: 'hall', nome: 'Hall de entrada', x: 335, y: 435, w: 245, h: 230, piso: 'piso-pedra', setor: 'social', linhas: ['Hall de', 'entrada'], corpo: 15, dy: 44 },
    { id: 'banho-social', nome: 'Banho social', x: 595, y: 435, w: 145, h: 230, piso: 'piso-pequeno', setor: 'intimo', linhas: ['Banho', 'social'], corpo: 13, dy: -22 },
    { id: 'cozinha', nome: 'Cozinha', x: 755, y: 435, w: 190, h: 230, piso: 'piso-diagonal', setor: 'servico', corpo: 15, dy: 24 },
    { id: 'servico', nome: 'Área de serviço', x: 960, y: 435, w: 120, h: 230, piso: 'piso-cimento', setor: 'servico', linhas: ['Área de', 'serviço'], corpo: 12, dy: 10 },
  ],

  paredes: [
    { x: 0, y: 0, w: 20, h: 20 },
    // fachada Norte
    { x: 580, y: 0, w: 80, h: 20 },
    { x: 840, y: 0, w: 120, h: 20 },
    { x: 1040, y: 0, w: 60, h: 20 },
    // fachada Oeste
    { x: 0, y: 190, w: 20, h: 60 },
    { x: 0, y: 390, w: 20, h: 100 },
    { x: 0, y: 620, w: 20, h: 65 },
    // empena Leste
    { x: 1080, y: 0, w: 20, h: 520 },
    { x: 1080, y: 620, w: 20, h: 65 },
    // empena Sul, com vão da porta de entrada
    { x: 0, y: 665, w: 420, h: 20 },
    { x: 505, y: 665, w: 595, h: 20 },
    // divisória social / íntimo, aberta no trecho do living
    { x: 580, y: 20, w: 15, h: 170 },
    { x: 580, y: 190, w: 15, h: 135 },
    { x: 580, y: 420, w: 15, h: 245 },
    // suíte / circulação
    { x: 595, y: 310, w: 45, h: 15 },
    { x: 730, y: 310, w: 170, h: 15 },
    // suíte / banho da suíte
    { x: 900, y: 20, w: 15, h: 50 },
    { x: 900, y: 160, w: 15, h: 150 },
    // circulação / molhados e cozinha
    { x: 595, y: 420, w: 35, h: 15 },
    { x: 710, y: 420, w: 80, h: 15 },
    { x: 890, y: 420, w: 190, h: 15 },
    // living / faixa inferior
    { x: 20, y: 420, w: 300, h: 15 },
    { x: 335, y: 420, w: 65, h: 15 },
    { x: 490, y: 420, w: 90, h: 15 },
    // dormitório 2 / hall
    { x: 320, y: 435, w: 15, h: 65 },
    { x: 320, y: 590, w: 15, h: 75 },
    // banho social / cozinha / serviço
    { x: 740, y: 435, w: 15, h: 230 },
    { x: 945, y: 435, w: 15, h: 85 },
    { x: 945, y: 600, w: 15, h: 65 },
  ],

  guardaCorpos: [
    { x: 12, y: 0, w: 568, h: 12 },
    { x: 0, y: 12, w: 12, h: 178 },
  ],

  esquadrias: [
    { x: 20, y: 190, comprimento: 560, espessura: 20 },
    { x: 660, y: 0, comprimento: 180, espessura: 20 },
    { x: 0, y: 390, comprimento: 140, rot: -90, espessura: 20 },
    { x: 0, y: 620, comprimento: 130, rot: -90, espessura: 20 },
  ],

  basculantes: [
    { x: 960, y: 0, comprimento: 80, espessura: 20 },
    { x: 1080, y: 620, comprimento: 100, rot: -90, espessura: 20 },
  ],

  portas: [
    { x: 505, y: 675, largura: 85, rot: 180, espessura: 20 },
    { x: 490, y: 427, largura: 90, rot: 180 },
    { x: 327, y: 500, largura: 90, rot: 90, espelho: true },
    { x: 730, y: 317, largura: 90, rot: 180 },
    { x: 907, y: 70, largura: 90, rot: 90, espelho: true },
    { x: 630, y: 427, largura: 80 },
    { x: 790, y: 427, largura: 100 },
    { x: 952, y: 520, largura: 80, rot: 90 },
  ],

  cotasH: [
    { x1: 0, x2: 1100, y: -110 },
    { x1: 0, x2: 580, y: -58 },
    { x1: 595, x2: 900, y: -58 },
    { x1: 915, x2: 1100, y: -58 },
  ],
  cotasV: [
    { y1: 0, y2: 685, x: -112 },
    { y1: 0, y2: 190, x: -58 },
    { y1: 210, y2: 420, x: -58 },
    { y1: 435, y2: 665, x: -58 },
  ],

  norte: { x: 1190, y: -46, r: 44 },
  escala: { x: 700, y: 882, metros: 5 },
  selo: {
    x: 0,
    y: 760,
    titulo: 'Tipo 2 · Pavimento tipo',
    linhas: [
      'Área privativa 75 m²  ·  2 dormitórios, 1 suíte  ·  2 banheiros  ·  2 vagas',
      'Varanda gourmet de 10 m² integrada ao living por esquadria de correr em toda a frente',
      'Posições 3 e 4 do pavimento. Fachadas a Norte e a Oeste. Cotas em metros.',
      'Planta ilustrativa desta fase de demonstração — medidas sujeitas a projeto executivo.',
    ],
    largura: 640,
  },
}

function MobiliaTipo2({ sufixo: s }: { sufixo: string }) {
  return (
    <g>
      {/* ── varanda gourmet ── */}
      <Jardineira x={28} y={16} w={230} h={30} sufixo={s} />
      <Pergolado x={372} y={88} w={200} h={98} />
      <Bancada x={400} y={24} w={170} h={52} />
      <Movel nome="churrasqueira" x={470} y={50} sufixo={s} />
      <Movel nome="mesa-jantar-4" x={170} y={110} sufixo={s} />
      <Movel nome="planta-m" x={540} y={150} sufixo={s} />
      <Soleira x={20} y={190} w={560} h={20} />

      {/* ── living / jantar ── */}
      <Tapete x={205} y={248} w={300} h={160} />
      <Movel nome="sofa-3" x={280} y={368} rot={180} sufixo={s} />
      <Movel nome="mesa-centro" x={420} y={320} rot={90} sufixo={s} />
      <Movel nome="rack" x={545} y={315} rot={-90} w={200} h={46} sufixo={s} />
      <Movel nome="poltrona" x={158} y={258} rot={35} sufixo={s} />
      <Movel nome="planta-p" x={48} y={252} sufixo={s} />
      <Movel nome="mesa-apoio" x={60} y={392} sufixo={s} />

      {/* ── suíte ── */}
      <Movel nome="cama-casal" x={745} y={145} sufixo={s} />
      <Movel nome="armario" x={745} y={285} rot={180} w={258} h={46} sufixo={s} />

      {/* ── banho da suíte ── */}
      <Movel nome="lavatorio" x={997} y={46} w={158} h={46} sufixo={s} />
      <Movel nome="vaso" x={997} y={120} sufixo={s} />
      <Movel nome="chuveiro" x={997} y={250} w={158} h={108} sufixo={s} />

      {/* ── circulação ── */}
      <Movel nome="aparador" x={680} y={372} sufixo={s} />

      {/* ── dormitório 2 ── */}
      <Movel nome="cama-solteiro" x={120} y={545} sufixo={s} />
      <Movel nome="armario" x={290} y={550} rot={90} w={198} h={54} sufixo={s} />
      <Movel nome="planta-p" x={232} y={468} sufixo={s} />

      {/* ── hall de entrada ── */}
      <Movel nome="aparador" x={457} y={460} sufixo={s} />
      <Movel nome="armario" x={362} y={550} rot={-90} w={178} h={48} sufixo={s} />
      <Movel nome="planta-m" x={548} y={630} sufixo={s} />

      {/* ── banho social ── */}
      <Movel nome="lavatorio" x={667} y={462} w={134} h={40} sufixo={s} />
      <Movel nome="vaso" x={705} y={530} sufixo={s} />
      <Movel nome="chuveiro" x={667} y={615} w={136} h={88} sufixo={s} />

      {/* ── cozinha ── */}
      <Movel nome="bancada-pia" x={850} y={465} w={184} h={56} sufixo={s} />
      <Movel nome="geladeira" x={800} y={625} sufixo={s} />
      <Movel nome="torre-quente" x={910} y={625} sufixo={s} />

      {/* ── área de serviço ── */}
      <Movel nome="tanque" x={1020} y={470} sufixo={s} />
      <Movel nome="maquina-lavar" x={1020} y={620} sufixo={s} />

      <text x={1090} y={820} textAnchor="end" fontSize={15} fill={TINTA.textoFraco} fontFamily="Inter, sans-serif">
        Pé-direito 2,70 m livre · laje a laje 3,15 m
      </text>
    </g>
  )
}

export function PlantaTipo2() {
  return (
    <PlantaBase def={defTipo2} sufixo="t2">
      <MobiliaTipo2 sufixo="t2" />
    </PlantaBase>
  )
}
