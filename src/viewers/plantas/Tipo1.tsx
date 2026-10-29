/**
 * Tipo 1 — 111 m², 3 dormitórios (1 suíte), 2 banheiros + lavabo.
 * Unidade de quadrante: fachadas ao Norte (topo) e Oeste (esquerda).
 * Envelope 1250 × 890 cm = 111,3 m² de área privativa.
 */
import { Bancada, Jardineira, Movel, Pergolado, Tapete } from './mobilia'
import { PlantaBase } from './PlantaBase'
import type { PlantaDef } from './PlantaBase'
import { Soleira, TINTA } from './kit'

export const defTipo1: PlantaDef = {
  id: 'tipo-1',
  largura: 1250,
  altura: 890,
  margem: { esq: 160, dir: 170, topo: 140, base: 310 },

  comodos: [
    { id: 'varanda', nome: 'Varanda gourmet', x: 12, y: 12, w: 588, h: 238, piso: 'piso-deck', setor: 'social', dy: 36 },
    { id: 'living', nome: 'Living / Jantar', x: 20, y: 265, w: 580, h: 295, piso: 'piso-grande', setor: 'social', dx: 90, dy: 100 },
    { id: 'dorm3', nome: 'Dormitório 3', x: 20, y: 575, w: 300, h: 295, piso: 'piso-madeira', setor: 'intimo', dx: 60, dy: 96 },
    { id: 'hall', nome: 'Hall de entrada', x: 335, y: 575, w: 265, h: 295, piso: 'piso-pedra', setor: 'social', dy: 40, linhas: ['Hall de', 'entrada'], corpo: 16 },
    { id: 'suite', nome: 'Suíte master', x: 615, y: 20, w: 325, h: 240, piso: 'piso-madeira', setor: 'intimo', somaArea: 1.67, dx: -28, dy: 78 },
    { id: 'suite-l', nome: 'Suíte master', x: 825, y: 275, w: 115, h: 145, piso: 'piso-madeira', setor: 'intimo', mudo: true },
    { id: 'banho-suite', nome: 'Banho da suíte', x: 615, y: 275, w: 195, h: 145, piso: 'piso-pequeno', setor: 'intimo', linhas: ['Banho da', 'suíte'], corpo: 14, dy: -12 },
    { id: 'dorm2', nome: 'Dormitório 2', x: 955, y: 20, w: 275, h: 400, piso: 'piso-madeira', setor: 'intimo', dy: 118 },
    { id: 'circulacao', nome: 'Circulação', x: 615, y: 435, w: 615, h: 95, piso: 'piso-grande', setor: 'intimo', dx: 190, corpo: 15 },
    { id: 'banho-social', nome: 'Banho social', x: 615, y: 545, w: 195, h: 175, piso: 'piso-pequeno', setor: 'intimo', linhas: ['Banho', 'social'], corpo: 14, dy: -24 },
    { id: 'lavabo', nome: 'Lavabo', x: 825, y: 545, w: 175, h: 115, piso: 'piso-pequeno', setor: 'social', corpo: 14, dy: 22 },
    { id: 'cozinha', nome: 'Cozinha', x: 1015, y: 545, w: 215, h: 325, piso: 'piso-diagonal', setor: 'servico', corpo: 16, dy: 24 },
    { id: 'servico', nome: 'Área de serviço', x: 825, y: 675, w: 175, h: 195, piso: 'piso-cimento', setor: 'servico', linhas: ['Área de', 'serviço'], corpo: 14, dy: -30 },
    { id: 'despensa', nome: 'Despensa', x: 615, y: 735, w: 195, h: 135, piso: 'piso-cimento', setor: 'servico', corpo: 14, dy: 8 },
  ],

  paredes: [
    // pilar e fachada Norte (recortada pelas esquadrias)
    { x: 0, y: 0, w: 20, h: 20 },
    { x: 600, y: 0, w: 80, h: 20 },
    { x: 880, y: 0, w: 140, h: 20 },
    { x: 1180, y: 0, w: 70, h: 20 },
    // fachada Oeste
    { x: 0, y: 250, w: 20, h: 70 },
    { x: 0, y: 520, w: 20, h: 130 },
    { x: 0, y: 810, w: 20, h: 80 },
    // empena Leste
    { x: 1230, y: 0, w: 20, h: 650 },
    { x: 1230, y: 790, w: 20, h: 100 },
    // empena Sul, com vão da porta de entrada e basculante do serviço
    { x: 0, y: 870, w: 400, h: 20 },
    { x: 490, y: 870, w: 370, h: 20 },
    { x: 980, y: 870, w: 270, h: 20 },
    // divisória social / íntimo
    { x: 600, y: 20, w: 15, h: 425 },
    { x: 600, y: 520, w: 15, h: 350 },
    // living / faixa de serviço
    { x: 20, y: 560, w: 410, h: 15 },
    { x: 520, y: 560, w: 80, h: 15 },
    // dormitório 3 / hall
    { x: 320, y: 575, w: 15, h: 85 },
    { x: 320, y: 750, w: 15, h: 120 },
    // suíte / banho da suíte
    { x: 615, y: 260, w: 35, h: 15 },
    { x: 730, y: 260, w: 80, h: 15 },
    { x: 810, y: 275, w: 15, h: 145 },
    // faixa dos dormitórios / circulação
    { x: 615, y: 420, w: 230, h: 15 },
    { x: 925, y: 420, w: 95, h: 15 },
    { x: 1100, y: 420, w: 130, h: 15 },
    { x: 940, y: 20, w: 15, h: 400 },
    // circulação / molhados
    { x: 615, y: 530, w: 45, h: 15 },
    { x: 730, y: 530, w: 140, h: 15 },
    { x: 940, y: 530, w: 150, h: 15 },
    { x: 1180, y: 530, w: 50, h: 15 },
    // molhados entre si
    { x: 810, y: 545, w: 15, h: 215 },
    { x: 810, y: 840, w: 15, h: 30 },
    { x: 1000, y: 545, w: 15, h: 195 },
    { x: 1000, y: 820, w: 15, h: 50 },
    { x: 825, y: 660, w: 175, h: 15 },
    { x: 615, y: 720, w: 195, h: 15 },
  ],

  guardaCorpos: [
    { x: 12, y: 0, w: 588, h: 12 },
    { x: 0, y: 12, w: 12, h: 238 },
  ],

  esquadrias: [
    { x: 20, y: 250, comprimento: 580, espessura: 15 },
    { x: 680, y: 0, comprimento: 200, espessura: 20 },
    { x: 1020, y: 0, comprimento: 160, espessura: 20 },
    { x: 0, y: 520, comprimento: 200, rot: -90, espessura: 20 },
    { x: 0, y: 810, comprimento: 160, rot: -90, espessura: 20 },
  ],

  basculantes: [
    { x: 1230, y: 790, comprimento: 140, rot: -90, espessura: 20 },
    { x: 860, y: 870, comprimento: 120, espessura: 20 },
  ],

  portas: [
    { x: 490, y: 880, largura: 90, rot: 180, espessura: 20 },
    { x: 430, y: 567, largura: 90 },
    { x: 327, y: 660, largura: 90, rot: 90, espelho: true },
    { x: 607, y: 520, largura: 75, rot: -90 },
    { x: 650, y: 267, largura: 80 },
    { x: 845, y: 427, largura: 80 },
    { x: 1100, y: 427, largura: 80, rot: 180 },
    { x: 660, y: 537, largura: 70 },
    { x: 870, y: 537, largura: 70 },
    { x: 1090, y: 537, largura: 90 },
    { x: 1007, y: 740, largura: 80, rot: 90 },
    { x: 817, y: 840, largura: 80, rot: -90 },
  ],

  cotasH: [
    { x1: 0, x2: 1250, y: -110 },
    { x1: 0, x2: 600, y: -58 },
    { x1: 615, x2: 940, y: -58 },
    { x1: 955, x2: 1250, y: -58 },
  ],
  cotasV: [
    { y1: 0, y2: 890, x: -112 },
    { y1: 0, y2: 250, x: -58 },
    { y1: 265, y2: 560, x: -58 },
    { y1: 575, y2: 870, x: -58 },
  ],

  norte: { x: 1340, y: -46, r: 44 },
  escala: { x: 790, y: 1030, metros: 5 },
  selo: {
    x: 0,
    y: 960,
    titulo: 'Tipo 1 · Pavimento tipo',
    linhas: [
      'Área privativa 111 m²  ·  3 dormitórios, 1 suíte  ·  2 banheiros e lavabo  ·  2 vagas',
      'Varanda gourmet de 14 m² em toda a extensão do living',
      'Posições 1 e 2 do pavimento. Fachadas a Norte e a Oeste. Cotas em metros.',
      'Planta ilustrativa desta fase de demonstração — medidas sujeitas a projeto executivo.',
    ],
    largura: 700,
  },
}

/** Mobiliário da planta Tipo 1. */
function MobiliaTipo1({ sufixo: s }: { sufixo: string }) {
  return (
    <g>
      {/* ── varanda gourmet ── */}
      <Jardineira x={30} y={16} w={300} h={34} sufixo={s} />
      <Pergolado x={372} y={96} w={220} h={148} />
      <Bancada x={424} y={28} w={168} h={58} />
      <Movel nome="churrasqueira" x={484} y={58} sufixo={s} />
      <Movel nome="mesa-jantar-6" x={200} y={148} sufixo={s} />
      <Movel nome="planta-g" x={556} y={196} sufixo={s} />
      <Movel nome="planta-m" x={46} y={212} sufixo={s} />
      <Soleira x={20} y={250} w={580} h={15} />

      {/* ── living / jantar ── */}
      <Tapete x={140} y={300} w={320} h={220} />
      <Movel nome="sofa-3" x={230} y={400} rot={-90} sufixo={s} />
      <Movel nome="mesa-centro" x={360} y={400} rot={90} sufixo={s} />
      <Movel nome="rack" x={570} y={410} rot={-90} sufixo={s} />
      <Movel nome="poltrona" x={300} y={518} rot={180} sufixo={s} />
      <Movel nome="mesa-apoio" x={176} y={332} sufixo={s} />
      <Movel nome="planta-m" x={62} y={300} sufixo={s} />
      <Movel nome="planta-p" x={64} y={534} sufixo={s} />

      {/* ── dormitório 3 ── */}
      <Movel nome="cama-solteiro" x={130} y={690} sufixo={s} />
      <Movel nome="armario" x={290} y={720} rot={90} w={230} h={58} sufixo={s} />
      <Movel nome="planta-p" x={58} y={838} sufixo={s} />

      {/* ── hall de entrada ── */}
      <Movel nome="aparador" x={467} y={600} sufixo={s} />
      <Movel nome="planta-m" x={562} y={832} sufixo={s} />
      <Movel nome="cadeira" x={366} y={830} sufixo={s} />

      {/* ── suíte master ── */}
      <Movel nome="cama-casal" x={760} y={142} sufixo={s} />
      <Movel nome="armario" x={915} y={140} rot={90} w={180} h={44} sufixo={s} />
      <Movel nome="closet" x={882} y={302} w={112} h={52} sufixo={s} />
      <Movel nome="closet" x={882} y={398} rot={180} w={112} h={52} sufixo={s} />
      <Movel nome="planta-p" x={632} y={44} sufixo={s} />

      {/* ── banho da suíte ── */}
      <Movel nome="chuveiro" x={664} y={374} w={94} h={84} sufixo={s} />
      <Movel nome="vaso" x={775} y={330} rot={90} sufixo={s} />
      <Movel nome="lavatorio" x={695} y={300} w={150} h={44} sufixo={s} />

      {/* ── dormitório 2 ── */}
      <Movel nome="cama-queen" x={1095} y={142} sufixo={s} />
      <Movel nome="armario" x={1204} y={330} rot={90} w={158} h={46} sufixo={s} />
      <Movel nome="escrivaninha" x={1030} y={340} sufixo={s} />
      <Movel nome="planta-p" x={1152} y={268} sufixo={s} />

      {/* ── circulação ── */}
      <Movel nome="aparador" x={700} y={480} sufixo={s} />

      {/* ── banho social ── */}
      <Movel nome="chuveiro" x={670} y={672} w={98} h={92} sufixo={s} />
      <Movel nome="vaso" x={775} y={690} rot={90} sufixo={s} />
      <Movel nome="lavatorio" x={690} y={568} w={138} h={40} sufixo={s} />

      {/* ── lavabo ── */}
      <Movel nome="lavatorio" x={890} y={568} w={118} h={40} sufixo={s} />
      <Movel nome="vaso" x={970} y={620} rot={180} sufixo={s} />

      {/* ── cozinha ── */}
      <Movel nome="bancada-pia" x={1196} y={700} rot={90} w={276} h={58} sufixo={s} />
      <Movel nome="cooktop" x={1194} y={640} rot={90} sufixo={s} />
      <Movel nome="geladeira" x={1060} y={586} sufixo={s} />
      <Movel nome="torre-quente" x={1050} y={830} sufixo={s} />
      <Bancada x={1017} y={662} w={58} h={140} />

      {/* ── área de serviço ── */}
      <Bancada x={827} y={690} w={168} h={52} />
      <Movel nome="maquina-lavar" x={870} y={820} sufixo={s} />
      <Movel nome="tanque" x={950} y={818} sufixo={s} />

      {/* ── despensa ── */}
      <Movel nome="closet" x={712} y={762} w={188} h={46} sufixo={s} />
      <Movel nome="closet" x={712} y={844} rot={180} w={188} h={46} sufixo={s} />

      {/* indicação de pé-direito */}
      <text x={1240} y={1012} textAnchor="end" fontSize={15} fill={TINTA.textoFraco} fontFamily="Inter, sans-serif">
        Pé-direito 2,70 m livre · laje a laje 3,15 m
      </text>
    </g>
  )
}

export function PlantaTipo1() {
  return (
    <PlantaBase def={defTipo1} sufixo="t1">
      <MobiliaTipo1 sufixo="t1" />
    </PlantaBase>
  )
}
