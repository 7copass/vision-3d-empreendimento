/**
 * Cobertura Duplex — pavimento inferior (1º nível).
 * Social contínuo na esquina Norte–Oeste, dois dormitórios ao Sul,
 * serviço e molhados agrupados a Leste, junto à entrada e à escada.
 * Envelope 1560 × 920 cm = 143,5 m².
 */
import { Bancada, Escada, Jardineira, Movel, Pergolado, Tapete } from './mobilia'
import { PlantaBase } from './PlantaBase'
import type { PlantaDef } from './PlantaBase'
import { Soleira, TINTA } from './kit'

export const defCoberturaInferior: PlantaDef = {
  id: 'cobertura-inferior',
  largura: 1560,
  altura: 920,
  margem: { esq: 170, dir: 180, topo: 140, base: 340 },

  comodos: [
    { id: 'varanda', nome: 'Varanda gourmet', x: 12, y: 12, w: 988, h: 248, piso: 'piso-deck', setor: 'social', dx: -180, dy: 94 },
    { id: 'home-office', nome: 'Home office', x: 1015, y: 20, w: 285, h: 240, piso: 'piso-madeira', setor: 'social', corpo: 17, dy: 54 },
    { id: 'lavabo', nome: 'Lavabo', x: 1315, y: 20, w: 225, h: 120, piso: 'piso-pequeno', setor: 'social', corpo: 14, dy: 34 },
    { id: 'hall', nome: 'Hall de entrada', x: 1315, y: 155, w: 225, h: 265, piso: 'piso-pedra', setor: 'social', linhas: ['Hall de', 'entrada'], corpo: 15, dy: 58 },
    { id: 'living', nome: 'Living', x: 20, y: 280, w: 600, h: 300, piso: 'piso-grande', setor: 'social', dx: 180, dy: -10 },
    { id: 'jantar', nome: 'Sala de jantar', x: 635, y: 280, w: 365, h: 300, piso: 'piso-grande', setor: 'social', dy: -128 },
    { id: 'escada', nome: 'Escada', x: 1015, y: 280, w: 285, h: 300, piso: 'piso-pedra', setor: 'social', corpo: 14, dx: 0, dy: -132 },
    { id: 'circulacao', nome: 'Circulação', x: 1315, y: 435, w: 225, h: 145, piso: 'piso-grande', setor: 'social', corpo: 14, dy: 30 },
    { id: 'servico', nome: 'Área de serviço', x: 1315, y: 595, w: 225, h: 305, piso: 'piso-cimento', setor: 'servico', linhas: ['Área de', 'serviço'], corpo: 14, dy: -46 },
    { id: 'cozinha', nome: 'Cozinha', x: 635, y: 595, w: 365, h: 305, piso: 'piso-diagonal', setor: 'servico', dy: -56 },
    { id: 'despensa', nome: 'Despensa', x: 1015, y: 595, w: 285, h: 145, piso: 'piso-cimento', setor: 'servico', corpo: 14, dy: 10 },
    { id: 'banho-social', nome: 'Banho social', x: 1015, y: 755, w: 285, h: 145, piso: 'piso-pequeno', setor: 'intimo', linhas: ['Banho', 'social'], corpo: 14, dx: -62, dy: -16 },
    { id: 'dorm3', nome: 'Dormitório 3', x: 20, y: 595, w: 290, h: 305, piso: 'piso-madeira', setor: 'intimo', dy: 70 },
    { id: 'dorm4', nome: 'Dormitório 4', x: 325, y: 595, w: 295, h: 305, piso: 'piso-madeira', setor: 'intimo', dy: 70 },
  ],

  paredes: [
    { x: 0, y: 0, w: 20, h: 20 },
    // fachada Norte
    { x: 1000, y: 0, w: 80, h: 20 },
    { x: 1240, y: 0, w: 140, h: 20 },
    { x: 1480, y: 0, w: 80, h: 20 },
    // fachada Oeste
    { x: 0, y: 260, w: 20, h: 70 },
    { x: 0, y: 530, w: 20, h: 120 },
    { x: 0, y: 840, w: 20, h: 80 },
    // fachada Leste, com vão da porta de entrada
    { x: 1540, y: 0, w: 20, h: 230 },
    { x: 1540, y: 320, w: 20, h: 380 },
    { x: 1540, y: 820, w: 20, h: 100 },
    // fachada Sul
    { x: 0, y: 900, w: 400, h: 20 },
    { x: 560, y: 900, w: 200, h: 20 },
    { x: 920, y: 900, w: 200, h: 20 },
    { x: 1220, y: 900, w: 340, h: 20 },
    // núcleo de entrada
    { x: 1000, y: 20, w: 15, h: 240 },
    { x: 1300, y: 20, w: 15, h: 400 },
    { x: 1315, y: 140, w: 85, h: 15 },
    { x: 1480, y: 140, w: 60, h: 15 },
    { x: 1015, y: 260, w: 85, h: 20 },
    { x: 1190, y: 260, w: 110, h: 20 },
    { x: 1000, y: 280, w: 15, h: 100 },
    { x: 1000, y: 480, w: 15, h: 100 },
    { x: 1315, y: 420, w: 40, h: 15 },
    { x: 1480, y: 420, w: 60, h: 15 },
    { x: 1300, y: 435, w: 15, h: 205 },
    { x: 1300, y: 710, w: 15, h: 190 },
    // faixa social / faixa inferior
    { x: 20, y: 580, w: 130, h: 15 },
    { x: 240, y: 580, w: 70, h: 15 },
    { x: 325, y: 580, w: 105, h: 15 },
    { x: 520, y: 580, w: 100, h: 15 },
    { x: 635, y: 580, w: 125, h: 15 },
    { x: 860, y: 580, w: 140, h: 15 },
    { x: 1015, y: 580, w: 285, h: 15 },
    { x: 1315, y: 580, w: 65, h: 15 },
    { x: 1460, y: 580, w: 80, h: 15 },
    // divisórias da faixa inferior
    { x: 310, y: 595, w: 15, h: 305 },
    { x: 620, y: 580, w: 15, h: 320 },
    { x: 1000, y: 595, w: 15, h: 305 },
    { x: 1015, y: 740, w: 65, h: 15 },
    { x: 1160, y: 740, w: 140, h: 15 },
  ],

  guardaCorpos: [
    { x: 12, y: 0, w: 988, h: 12 },
    { x: 0, y: 12, w: 12, h: 248 },
  ],

  esquadrias: [
    { x: 20, y: 260, comprimento: 980, espessura: 20 },
    { x: 1080, y: 0, comprimento: 160, espessura: 20 },
    { x: 0, y: 530, comprimento: 200, rot: -90, espessura: 20 },
    { x: 0, y: 840, comprimento: 190, rot: -90, espessura: 20 },
    { x: 400, y: 900, comprimento: 160, espessura: 20 },
    { x: 760, y: 900, comprimento: 160, espessura: 20 },
  ],

  basculantes: [
    { x: 1380, y: 0, comprimento: 100, espessura: 20 },
    { x: 1540, y: 820, comprimento: 120, rot: -90, espessura: 20 },
    { x: 1120, y: 900, comprimento: 100, espessura: 20 },
  ],

  portas: [
    { x: 1550, y: 320, largura: 90, rot: -90, espelho: true, espessura: 20 },
    { x: 1480, y: 147, largura: 80, rot: 180 },
    { x: 1190, y: 270, largura: 90, rot: 180, espessura: 20 },
    { x: 150, y: 587, largura: 90 },
    { x: 430, y: 587, largura: 90 },
    { x: 760, y: 587, largura: 100 },
    { x: 1380, y: 587, largura: 80 },
    { x: 1307, y: 710, largura: 70, rot: -90, espelho: true },
    { x: 1080, y: 747, largura: 80 },
  ],

  cotasH: [
    { x1: 0, x2: 1560, y: -110 },
    { x1: 0, x2: 1000, y: -58 },
    { x1: 1015, x2: 1300, y: -58 },
    { x1: 1315, x2: 1560, y: -58 },
  ],
  cotasV: [
    { y1: 0, y2: 920, x: -112 },
    { y1: 0, y2: 260, x: -58 },
    { y1: 280, y2: 580, x: -58 },
    { y1: 595, y2: 900, x: -58 },
  ],

  norte: { x: 1655, y: -46, r: 44 },
  escala: { x: 1010, y: 1070, metros: 5 },
  selo: {
    x: 0,
    y: 995,
    titulo: 'Cobertura Duplex · 1º nível',
    linhas: [
      'Nível inferior 143,5 m²  ·  2 dormitórios  ·  banho social e lavabo  ·  3 vagas',
      'Área privativa total do duplex 222 m², somados os dois níveis.',
      'Varanda gourmet de 24,5 m² em toda a esquina Norte–Oeste, com churrasqueira.',
      'Pavimento 20 das torres, posições 1 e 3. Cotas em metros.',
    ],
    largura: 780,
  },
}

function MobiliaCoberturaInferior({ sufixo: s }: { sufixo: string }) {
  return (
    <g>
      {/* ── varanda gourmet ── */}
      <Jardineira x={30} y={16} w={420} h={34} sufixo={s} />
      <Pergolado x={600} y={96} w={392} h={150} />
      <Bancada x={700} y={24} w={282} h={58} />
      <Movel nome="churrasqueira" x={782} y={52} sufixo={s} />
      <Movel nome="mesa-jantar-8" x={300} y={140} sufixo={s} />
      <Movel nome="espreguicadeira" x={610} y={180} rot={90} sufixo={s} />
      <Movel nome="planta-g" x={932} y={198} sufixo={s} />
      <Movel nome="planta-m" x={58} y={214} sufixo={s} />
      <Soleira x={20} y={260} w={980} h={20} />

      {/* ── living ── */}
      <Tapete x={100} y={320} w={420} h={230} />
      <Movel nome="sofa-3" x={300} y={528} rot={180} sufixo={s} />
      <Movel nome="chaise" x={130} y={420} sufixo={s} />
      <Movel nome="mesa-centro" x={330} y={430} sufixo={s} />
      <Movel nome="rack" x={565} y={430} rot={-90} w={240} h={46} sufixo={s} />
      <Movel nome="poltrona" x={436} y={330} rot={200} sufixo={s} />
      <Movel nome="planta-m" x={58} y={556} sufixo={s} />

      {/* ── sala de jantar ── */}
      <Movel nome="mesa-jantar-8" x={817} y={436} sufixo={s} />
      <Movel nome="aparador" x={700} y={300} sufixo={s} />

      {/* ── escada escultural ── */}
      <Escada x={1040} y={332} w={235} h={226} degraus={14} sentido="cima" />

      {/* ── home office ── */}
      <Movel nome="home-office" x={1157} y={110} sufixo={s} />
      <Movel nome="armario" x={1157} y={230} rot={180} w={250} h={44} sufixo={s} />

      {/* ── lavabo ── */}
      <Movel nome="lavatorio" x={1380} y={46} w={118} h={42} sufixo={s} />
      <Movel nome="vaso" x={1500} y={82} rot={90} sufixo={s} />

      {/* ── hall ── */}
      <Movel nome="aparador" x={1427} y={180} sufixo={s} />
      <Movel nome="planta-m" x={1340} y={392} sufixo={s} />
      <Movel nome="cadeira" x={1502} y={392} sufixo={s} />

      {/* ── cozinha ── */}
      <Movel nome="bancada-pia" x={817} y={625} w={358} h={56} sufixo={s} />
      <Movel nome="ilha" x={817} y={790} sufixo={s} />
      <Movel nome="geladeira" x={680} y={860} sufixo={s} />
      <Movel nome="torre-quente" x={960} y={860} sufixo={s} />

      {/* ── despensa ── */}
      <Movel nome="closet" x={1157} y={620} w={278} h={44} sufixo={s} />
      <Movel nome="closet" x={1157} y={712} rot={180} w={278} h={44} sufixo={s} />

      {/* ── banho social ── */}
      <Movel nome="lavatorio" x={1080} y={782} w={118} h={42} sufixo={s} />
      <Movel nome="vaso" x={1190} y={792} sufixo={s} />
      <Movel nome="chuveiro" x={1250} y={845} w={94} h={98} sufixo={s} />

      {/* ── área de serviço ── */}
      <Bancada x={1320} y={610} w={214} h={54} />
      <Movel nome="maquina-lavar" x={1360} y={858} sufixo={s} />
      <Movel nome="tanque" x={1472} y={858} sufixo={s} />
      <Movel nome="bicicleta" x={1500} y={744} sufixo={s} />

      {/* ── dormitórios 3 e 4 ── */}
      <Movel nome="cama-queen" x={165} y={730} sufixo={s} />
      <Movel nome="armario" x={165} y={874} rot={180} w={258} h={42} sufixo={s} />
      <Movel nome="cama-queen" x={472} y={730} sufixo={s} />
      <Movel nome="armario" x={472} y={874} rot={180} w={262} h={42} sufixo={s} />

      <text x={1550} y={1048} textAnchor="end" fontSize={15} fill={TINTA.textoFraco} fontFamily="Inter, sans-serif">
        Pé-direito 2,70 m livre · escada de 14 degraus para o 2º nível
      </text>
    </g>
  )
}

export function PlantaCoberturaInferior() {
  return (
    <PlantaBase def={defCoberturaInferior} sufixo="ci">
      <MobiliaCoberturaInferior sufixo="ci" />
    </PlantaBase>
  )
}
