/**
 * Biblioteca de mobiliário em planta. Cada peça é um <symbol> com viewBox nas
 * dimensões reais em centímetros, instanciado por <Movel> com giro livre.
 */
import { TINTA, TRACO, url } from './kit'
import type { Ret } from './kit'

const F = { fill: TINTA.movelFundo, stroke: TINTA.movel, strokeWidth: TRACO.fino }
const V = { fill: 'none', stroke: TINTA.movel, strokeWidth: TRACO.fino }
const L = { fill: 'none', stroke: TINTA.movelLeve, strokeWidth: 0.9 }
const B = { fill: TINTA.louca, stroke: TINTA.movel, strokeWidth: TRACO.fino }

/** Dimensões naturais de cada peça: [largura, profundidade] em cm. */
export const DIM = {
  'sofa-3': [230, 95],
  'sofa-2': [165, 92],
  chaise: [100, 170],
  poltrona: [82, 84],
  'mesa-centro': [120, 65],
  rack: [230, 46],
  aparador: [150, 42],
  'mesa-jantar-8': [250, 215],
  'mesa-jantar-6': [210, 190],
  'mesa-jantar-4': [150, 150],
  'cama-casal': [250, 215],
  'cama-queen': [242, 212],
  'cama-solteiro': [148, 205],
  criado: [45, 42],
  comoda: [120, 50],
  armario: [200, 62],
  closet: [200, 62],
  'bancada-pia': [240, 62],
  ilha: [220, 95],
  geladeira: [82, 72],
  'torre-quente': [62, 62],
  cooktop: [72, 52],
  churrasqueira: [120, 72],
  vaso: [40, 64],
  bide: [38, 56],
  lavatorio: [90, 52],
  'lavatorio-duplo': [160, 55],
  chuveiro: [95, 95],
  banheira: [170, 80],
  'maquina-lavar': [66, 66],
  tanque: [58, 52],
  'planta-g': [95, 95],
  'planta-m': [62, 62],
  'planta-p': [42, 42],
  espreguicadeira: [72, 195],
  'mesa-apoio': [55, 55],
  escrivaninha: [150, 125],
  cadeira: [50, 52],
  piano: [150, 155],
  'home-office': [160, 130],
  bicicleta: [55, 175],
  'guarda-sol': [110, 110],
} as const satisfies Record<string, readonly [number, number]>

export type NomeMovel = keyof typeof DIM

/* ───────────────────── símbolos ───────────────────── */

/** Entra uma vez por SVG de planta, antes de qualquer <Movel>. */
export function DefsMobilia({ sufixo: s }: { sufixo: string }) {
  const id = (n: NomeMovel) => `mv-${n}-${s}`
  return (
    <defs>
      {/* ── estar ── */}
      <symbol id={id('sofa-3')} viewBox="0 0 230 95">
        <rect x={0} y={0} width={230} height={95} rx={9} {...F} />
        <rect x={14} y={24} width={66} height={62} rx={6} {...V} />
        <rect x={82} y={24} width={66} height={62} rx={6} {...V} />
        <rect x={150} y={24} width={66} height={62} rx={6} {...V} />
        <rect x={14} y={8} width={202} height={16} rx={5} {...V} />
        <path d="M0 24 H14 M216 24 H230" {...L} />
      </symbol>

      <symbol id={id('sofa-2')} viewBox="0 0 165 92">
        <rect x={0} y={0} width={165} height={92} rx={9} {...F} />
        <rect x={14} y={24} width={66} height={60} rx={6} {...V} />
        <rect x={84} y={24} width={66} height={60} rx={6} {...V} />
        <rect x={14} y={8} width={137} height={16} rx={5} {...V} />
      </symbol>

      <symbol id={id('chaise')} viewBox="0 0 100 170">
        <rect x={0} y={0} width={100} height={170} rx={9} {...F} />
        <rect x={16} y={10} width={70} height={16} rx={5} {...V} />
        <rect x={16} y={30} width={70} height={130} rx={7} {...V} />
      </symbol>

      <symbol id={id('poltrona')} viewBox="0 0 82 84">
        <rect x={0} y={0} width={82} height={84} rx={14} {...F} />
        <rect x={13} y={22} width={56} height={52} rx={8} {...V} />
        <path d="M6 22 Q41 10 76 22" {...V} />
      </symbol>

      <symbol id={id('mesa-centro')} viewBox="0 0 120 65">
        <rect x={0} y={0} width={120} height={65} rx={7} {...F} />
        <rect x={10} y={9} width={100} height={47} rx={4} {...L} />
        <circle cx={60} cy={32} r={9} {...L} />
      </symbol>

      <symbol id={id('rack')} viewBox="0 0 230 46">
        <rect x={0} y={16} width={230} height={30} {...F} />
        <path d="M58 16 V46 M115 16 V46 M172 16 V46" {...L} />
        {/* televisor */}
        <rect x={50} y={5} width={130} height={8} fill={TINTA.movel} stroke="none" />
        <path d="M100 13 H130" stroke={TINTA.movel} strokeWidth={TRACO.fino} />
      </symbol>

      <symbol id={id('aparador')} viewBox="0 0 150 42">
        <rect x={0} y={0} width={150} height={42} {...F} />
        <path d="M50 0 V42 M100 0 V42" {...L} />
      </symbol>

      {/* ── jantar ── */}
      <symbol id={id('mesa-jantar-8')} viewBox="0 0 250 215">
        <rect x={25} y={57} width={200} height={100} rx={6} {...F} />
        <rect x={37} y={67} width={176} height={80} rx={4} {...L} />
        {[45, 105, 165].map((x) => (
          <g key={`t${x}`}>
            <rect x={x} y={5} width={50} height={46} rx={7} {...F} />
            <path d={`M${x + 4} 7 H${x + 46}`} {...V} />
          </g>
        ))}
        {[45, 105, 165].map((x) => (
          <g key={`b${x}`}>
            <rect x={x} y={163} width={50} height={46} rx={7} {...F} />
            <path d={`M${x + 4} 207 H${x + 46}`} {...V} />
          </g>
        ))}
        <g>
          <rect x={-18} y={82} width={46} height={50} rx={7} {...F} />
          <path d="M-16 86 V128" {...V} />
        </g>
        <g>
          <rect x={222} y={82} width={46} height={50} rx={7} {...F} />
          <path d="M266 86 V128" {...V} />
        </g>
        <path d="M105 95 h40 v24 h-40 z" {...L} />
      </symbol>

      <symbol id={id('mesa-jantar-6')} viewBox="0 0 210 190">
        <rect x={25} y={50} width={160} height={90} rx={6} {...F} />
        <rect x={36} y={59} width={138} height={72} rx={4} {...L} />
        {[42, 102].map((x) => (
          <g key={`t${x}`}>
            <rect x={x} y={2} width={48} height={44} rx={7} {...F} />
            <path d={`M${x + 4} 4 H${x + 44}`} {...V} />
          </g>
        ))}
        {[42, 102].map((x) => (
          <g key={`b${x}`}>
            <rect x={x} y={144} width={48} height={44} rx={7} {...F} />
            <path d={`M${x + 4} 186 H${x + 44}`} {...V} />
          </g>
        ))}
        <rect x={-16} y={71} width={44} height={48} rx={7} {...F} />
        <rect x={182} y={71} width={44} height={48} rx={7} {...F} />
      </symbol>

      <symbol id={id('mesa-jantar-4')} viewBox="0 0 150 150">
        <circle cx={75} cy={75} r={55} {...F} />
        <circle cx={75} cy={75} r={44} {...L} />
        {[
          [52, 2, 0],
          [52, 104, 0],
          [2, 52, 1],
          [104, 52, 1],
        ].map(([x, y, g], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width={g ? 44 : 46}
            height={g ? 46 : 44}
            rx={7}
            {...F}
          />
        ))}
      </symbol>

      {/* ── dormir ── */}
      <symbol id={id('cama-casal')} viewBox="0 0 250 215">
        <rect x={46} y={8} width={158} height={200} rx={5} {...F} />
        {/* cabeceira */}
        <rect x={40} y={0} width={170} height={14} rx={4} fill={TINTA.movel} opacity={0.25} stroke={TINTA.movel} strokeWidth={TRACO.fino} />
        {/* travesseiros */}
        <rect x={56} y={20} width={66} height={38} rx={10} {...B} />
        <rect x={128} y={20} width={66} height={38} rx={10} {...B} />
        {/* edredom virado */}
        <path d="M46 72 H204" {...V} />
        <path d="M46 92 H204" {...L} />
        <path d="M46 150 H204" {...L} />
        {/* criados-mudos */}
        <rect x={0} y={8} width={42} height={40} {...F} />
        <path d="M0 28 H42" {...L} />
        <rect x={208} y={8} width={42} height={40} {...F} />
        <path d="M208 28 H250" {...L} />
      </symbol>

      <symbol id={id('cama-queen')} viewBox="0 0 242 212">
        <rect x={44} y={8} width={154} height={196} rx={5} {...F} />
        <rect x={38} y={0} width={166} height={13} rx={4} fill={TINTA.movel} opacity={0.25} stroke={TINTA.movel} strokeWidth={TRACO.fino} />
        <rect x={54} y={19} width={64} height={36} rx={10} {...B} />
        <rect x={124} y={19} width={64} height={36} rx={10} {...B} />
        <path d="M44 68 H198" {...V} />
        <path d="M44 88 H198" {...L} />
        <rect x={0} y={8} width={40} height={38} {...F} />
        <rect x={202} y={8} width={40} height={38} {...F} />
      </symbol>

      <symbol id={id('cama-solteiro')} viewBox="0 0 148 205">
        <rect x={0} y={8} width={100} height={196} rx={5} {...F} />
        <rect x={0} y={0} width={100} height={13} rx={4} fill={TINTA.movel} opacity={0.25} stroke={TINTA.movel} strokeWidth={TRACO.fino} />
        <rect x={16} y={19} width={68} height={36} rx={10} {...B} />
        <path d="M0 66 H100" {...V} />
        <path d="M0 86 H100" {...L} />
        <rect x={104} y={8} width={44} height={40} {...F} />
        <path d="M104 28 H148" {...L} />
      </symbol>

      <symbol id={id('criado')} viewBox="0 0 45 42">
        <rect x={0} y={0} width={45} height={42} {...F} />
        <path d="M0 21 H45" {...L} />
      </symbol>

      <symbol id={id('comoda')} viewBox="0 0 120 50">
        <rect x={0} y={0} width={120} height={50} {...F} />
        <path d="M40 0 V50 M80 0 V50" {...L} />
        <path d="M0 25 H120" {...L} />
      </symbol>

      {/* armário com porta de correr: duas folhas e cabideiro */}
      <symbol id={id('armario')} viewBox="0 0 200 62" preserveAspectRatio="none">
        <rect x={0} y={0} width={200} height={62} {...F} />
        <path d="M0 50 H200" {...V} />
        <path d="M100 0 V50" {...L} />
        <path d="M6 54 H96 M104 58 H194" stroke={TINTA.movel} strokeWidth={TRACO.fino} fill="none" />
        <path d="M0 25 H200" strokeDasharray="8 7" {...L} />
      </symbol>

      {/* closet aberto: módulos, prateleiras e cabideiro */}
      <symbol id={id('closet')} viewBox="0 0 200 62" preserveAspectRatio="none">
        <rect x={0} y={0} width={200} height={62} {...F} />
        <path d="M50 0 V62 M100 0 V62 M150 0 V62" {...V} />
        <path d="M0 40 H50 M100 40 H150" {...L} />
        <path d="M0 20 H50 M100 20 H150" {...L} />
        <path d="M56 31 H94 M156 31 H194" stroke={TINTA.movel} strokeWidth={TRACO.medio} fill="none" />
      </symbol>

      {/* ── cozinha e serviço ── */}
      <symbol id={id('bancada-pia')} viewBox="0 0 240 62" preserveAspectRatio="none">
        <rect x={0} y={0} width={240} height={62} {...F} />
        <path d="M0 8 H240" {...L} />
        <rect x={24} y={14} width={76} height={40} rx={4} {...B} />
        <circle cx={62} cy={34} r={4} {...V} />
        <path d="M62 14 v-6 q0 -6 8 -6" {...V} />
        <rect x={120} y={14} width={100} height={40} rx={3} {...V} />
        <path d="M140 14 V54 M160 14 V54 M180 14 V54 M200 14 V54" {...L} />
      </symbol>

      <symbol id={id('ilha')} viewBox="0 0 220 95">
        <rect x={0} y={0} width={220} height={95} rx={3} {...F} />
        <rect x={8} y={8} width={204} height={55} rx={2} {...L} />
        <rect x={24} y={18} width={62} height={36} rx={3} {...B} />
        <circle cx={55} cy={36} r={3.5} {...V} />
        <rect x={110} y={16} width={72} height={40} rx={3} {...V} />
        <circle cx={128} cy={27} r={7} {...L} />
        <circle cx={164} cy={27} r={7} {...L} />
        <circle cx={128} cy={45} r={7} {...L} />
        <circle cx={164} cy={45} r={7} {...L} />
        {[30, 80, 130, 180].map((x) => (
          <rect key={x} x={x} y={70} width={42} height={24} rx={11} {...F} />
        ))}
      </symbol>

      <symbol id={id('geladeira')} viewBox="0 0 82 72">
        <rect x={0} y={0} width={82} height={72} {...F} />
        <path d="M41 0 V72" {...V} />
        <path d="M34 20 V40 M48 20 V40" stroke={TINTA.movel} strokeWidth={TRACO.medio} fill="none" />
        <path d="M0 6 H82" {...L} />
      </symbol>

      <symbol id={id('torre-quente')} viewBox="0 0 62 62">
        <rect x={0} y={0} width={62} height={62} {...F} />
        <rect x={8} y={8} width={46} height={20} rx={2} {...V} />
        <rect x={8} y={34} width={46} height={20} rx={2} {...V} />
        <circle cx={31} cy={18} r={5} {...L} />
        <circle cx={31} cy={44} r={5} {...L} />
      </symbol>

      <symbol id={id('cooktop')} viewBox="0 0 72 52">
        <rect x={0} y={0} width={72} height={52} rx={3} {...B} />
        <circle cx={20} cy={16} r={8} {...V} />
        <circle cx={52} cy={16} r={8} {...V} />
        <circle cx={20} cy={38} r={6} {...V} />
        <circle cx={52} cy={38} r={6} {...V} />
      </symbol>

      <symbol id={id('churrasqueira')} viewBox="0 0 120 72">
        <rect x={0} y={0} width={120} height={72} {...F} />
        <rect x={10} y={12} width={62} height={48} {...V} />
        <path d="M10 22 H72 M10 32 H72 M10 42 H72 M10 52 H72" {...L} />
        <rect x={82} y={12} width={28} height={48} rx={3} {...V} />
        <path d="M82 36 H110" {...L} />
      </symbol>

      <symbol id={id('maquina-lavar')} viewBox="0 0 66 66">
        <rect x={0} y={0} width={66} height={66} {...F} />
        <circle cx={33} cy={38} r={19} {...V} />
        <circle cx={33} cy={38} r={12} {...L} />
        <path d="M0 14 H66" {...L} />
      </symbol>

      <symbol id={id('tanque')} viewBox="0 0 58 52">
        <rect x={0} y={0} width={58} height={52} rx={4} {...B} />
        <rect x={7} y={8} width={44} height={36} rx={3} {...V} />
        <circle cx={29} cy={26} r={3.5} {...V} />
      </symbol>

      {/* ── louças ── */}
      <symbol id={id('vaso')} viewBox="0 0 40 64">
        <rect x={7} y={0} width={26} height={17} rx={3} {...B} />
        <path d="M20 19 C6 19 2 30 2 40 C2 54 10 62 20 62 C30 62 38 54 38 40 C38 30 34 19 20 19 Z" {...B} />
        <ellipse cx={20} cy={41} rx={11} ry={15} {...L} />
      </symbol>

      <symbol id={id('bide')} viewBox="0 0 38 56">
        <path d="M19 2 C7 2 3 14 3 28 C3 44 10 54 19 54 C28 54 35 44 35 28 C35 14 31 2 19 2 Z" {...B} />
        <ellipse cx={19} cy={30} rx={10} ry={16} {...L} />
      </symbol>

      <symbol id={id('lavatorio')} viewBox="0 0 90 52" preserveAspectRatio="none">
        <rect x={0} y={0} width={90} height={52} rx={2} {...F} />
        <rect x={14} y={8} width={62} height={36} rx={6} {...B} />
        <ellipse cx={45} cy={26} rx={23} ry={13} {...L} />
        <circle cx={45} cy={26} r={3} {...V} />
        <path d="M45 8 V2" stroke={TINTA.movel} strokeWidth={TRACO.medio} fill="none" />
      </symbol>

      <symbol id={id('lavatorio-duplo')} viewBox="0 0 160 55" preserveAspectRatio="none">
        <rect x={0} y={0} width={160} height={55} rx={2} {...F} />
        <rect x={10} y={9} width={58} height={38} rx={6} {...B} />
        <rect x={92} y={9} width={58} height={38} rx={6} {...B} />
        <ellipse cx={39} cy={28} rx={21} ry={13} {...L} />
        <ellipse cx={121} cy={28} rx={21} ry={13} {...L} />
        <circle cx={39} cy={28} r={3} {...V} />
        <circle cx={121} cy={28} r={3} {...V} />
        <path d="M39 9 V2 M121 9 V2" stroke={TINTA.movel} strokeWidth={TRACO.medio} fill="none" />
      </symbol>

      {/* box: soleira, ralo linear e chuveiro */}
      <symbol id={id('chuveiro')} viewBox="0 0 95 95" preserveAspectRatio="none">
        <rect x={0} y={0} width={95} height={95} fill={TINTA.agua} opacity={0.08} />
        <rect x={0} y={0} width={95} height={95} {...V} />
        <path d="M0 0 L95 95 M95 0 L0 95" {...L} />
        <circle cx={22} cy={22} r={11} {...B} />
        <circle cx={22} cy={22} r={5} {...L} />
        <rect x={10} y={84} width={75} height={5} rx={2} fill={TINTA.movelLeve} />
      </symbol>

      <symbol id={id('banheira')} viewBox="0 0 170 80">
        <rect x={0} y={0} width={170} height={80} rx={14} {...B} />
        <rect x={10} y={9} width={150} height={62} rx={10} {...V} />
        <circle cx={140} cy={40} r={4} {...V} />
        <path d="M158 40 h8" stroke={TINTA.movel} strokeWidth={TRACO.medio} fill="none" />
      </symbol>

      {/* ── vegetação ── */}
      <symbol id={id('planta-g')} viewBox="0 0 95 95">
        <circle cx={47} cy={47} r={44} fill={TINTA.vegetacaoClara} opacity={0.18} />
        <circle cx={47} cy={47} r={44} fill="none" stroke={TINTA.vegetacao} strokeWidth={TRACO.fino} opacity={0.5} />
        {Array.from({ length: 11 }, (_, i) => {
          const a = (i / 11) * Math.PI * 2
          return (
            <path
              key={i}
              d={`M47 47 Q${47 + Math.cos(a) * 24} ${47 + Math.sin(a) * 24} ${47 + Math.cos(a + 0.3) * 42} ${47 + Math.sin(a + 0.3) * 42}`}
              fill="none"
              stroke={TINTA.vegetacao}
              strokeWidth={1.5}
              opacity={0.8}
            />
          )
        })}
        <circle cx={47} cy={47} r={13} fill="none" stroke={TINTA.vegetacao} strokeWidth={TRACO.medio} />
      </symbol>

      <symbol id={id('planta-m')} viewBox="0 0 62 62">
        <circle cx={31} cy={31} r={29} fill={TINTA.vegetacaoClara} opacity={0.16} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2
          return (
            <path
              key={i}
              d={`M31 31 L${31 + Math.cos(a) * 28} ${31 + Math.sin(a) * 28}`}
              stroke={TINTA.vegetacao}
              strokeWidth={1.5}
              opacity={0.8}
            />
          )
        })}
        <circle cx={31} cy={31} r={9} fill="none" stroke={TINTA.vegetacao} strokeWidth={TRACO.medio} />
      </symbol>

      <symbol id={id('planta-p')} viewBox="0 0 42 42">
        <circle cx={21} cy={21} r={19} fill={TINTA.vegetacaoClara} opacity={0.16} />
        <circle cx={21} cy={21} r={19} fill="none" stroke={TINTA.vegetacao} strokeWidth={1.2} opacity={0.6} />
        <circle cx={21} cy={21} r={7} fill="none" stroke={TINTA.vegetacao} strokeWidth={TRACO.medio} />
      </symbol>

      {/* ── externos ── */}
      <symbol id={id('espreguicadeira')} viewBox="0 0 72 195">
        <rect x={0} y={0} width={72} height={195} rx={10} {...F} />
        <path d="M0 62 H72 M0 74 H72 M0 110 H72 M0 148 H72" {...L} />
        <rect x={6} y={6} width={60} height={50} rx={8} {...V} />
      </symbol>

      <symbol id={id('guarda-sol')} viewBox="0 0 110 110">
        <circle cx={55} cy={55} r={52} fill="none" stroke={TINTA.movelLeve} strokeWidth={TRACO.fino} strokeDasharray="7 6" />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2
          return (
            <path key={i} d={`M55 55 L${55 + Math.cos(a) * 52} ${55 + Math.sin(a) * 52}`} {...L} />
          )
        })}
        <circle cx={55} cy={55} r={6} {...F} />
      </symbol>

      <symbol id={id('mesa-apoio')} viewBox="0 0 55 55">
        <circle cx={27.5} cy={27.5} r={26} {...F} />
        <circle cx={27.5} cy={27.5} r={17} {...L} />
      </symbol>

      <symbol id={id('escrivaninha')} viewBox="0 0 150 125">
        <rect x={0} y={0} width={150} height={70} {...F} />
        <path d="M100 0 V70 M100 35 H150" {...L} />
        <rect x={52} y={78} width={48} height={44} rx={16} {...F} />
        <path d="M56 118 H96" {...V} />
        <rect x={20} y={8} width={50} height={6} fill={TINTA.movel} stroke="none" />
      </symbol>

      <symbol id={id('home-office')} viewBox="0 0 160 130">
        <rect x={0} y={0} width={160} height={66} {...F} />
        <path d="M0 10 H160" {...L} />
        <rect x={56} y={74} width={50} height={46} rx={16} {...F} />
        <rect x={30} y={6} width={60} height={7} fill={TINTA.movel} stroke="none" />
        <rect x={110} y={16} width={40} height={40} rx={3} {...V} />
      </symbol>

      <symbol id={id('cadeira')} viewBox="0 0 50 52">
        <rect x={0} y={0} width={50} height={52} rx={8} {...F} />
        <path d="M4 3 H46" {...V} />
      </symbol>

      <symbol id={id('piano')} viewBox="0 0 150 155">
        <path d="M0 0 H150 V60 Q150 150 70 150 Q0 150 0 90 Z" {...F} />
        <rect x={6} y={0} width={138} height={18} {...B} />
        {Array.from({ length: 18 }, (_, i) => (
          <line key={i} x1={6 + i * 7.6} y1={0} x2={6 + i * 7.6} y2={18} {...L} />
        ))}
      </symbol>

      <symbol id={id('bicicleta')} viewBox="0 0 55 175">
        <circle cx={27} cy={32} r={28} {...L} />
        <circle cx={27} cy={142} r={28} {...L} />
        <path d="M27 32 V142" stroke={TINTA.movel} strokeWidth={TRACO.fino} fill="none" />
        <path d="M8 56 H46" {...L} />
      </symbol>
    </defs>
  )
}

/* ───────────────────── instanciação ───────────────────── */

interface MovelProps {
  nome: NomeMovel
  /** Centro da peça, em cm. */
  x: number
  y: number
  /** Giro em graus, horário, em torno do centro. */
  rot?: number
  /** Sobrescreve a largura natural (peças esticáveis: armário, bancada, box). */
  w?: number
  h?: number
  sufixo: string
  opacidade?: number
}

export function Movel({ nome, x, y, rot = 0, w, h, sufixo, opacidade }: MovelProps) {
  const [dw, dh] = DIM[nome]
  const W = w ?? dw
  const H = h ?? dh
  return (
    <use
      href={`#mv-${nome}-${sufixo}`}
      x={-W / 2}
      y={-H / 2}
      width={W}
      height={H}
      opacity={opacidade}
      transform={`translate(${x} ${y}) rotate(${rot})`}
    />
  )
}

/* ───────────────────── peças de tamanho livre ───────────────────── */

/** Tapete: contorno pontilhado com franja. */
export function Tapete({ x, y, w, h }: Ret) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={TINTA.piso} opacity={0.14} />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke={TINTA.movelLeve}
        strokeWidth={TRACO.fino}
        strokeDasharray="12 8"
      />
      <rect
        x={x + 10}
        y={y + 10}
        width={w - 20}
        height={h - 20}
        fill="none"
        stroke={TINTA.movelLeve}
        strokeWidth={0.8}
        opacity={0.7}
      />
    </g>
  )
}

/** Bancada corrida (cozinha, lavabo, apoio da varanda). */
export function Bancada({ x, y, w, h, gavetas = true }: Ret & { gavetas?: boolean }) {
  const n = Math.max(1, Math.round(w / 55))
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} {...F} />
      <rect x={x} y={y} width={w} height={Math.min(8, h * 0.18)} fill="none" stroke={TINTA.movelLeve} strokeWidth={0.9} />
      {gavetas &&
        Array.from({ length: n - 1 }, (_, i) => (
          <line
            key={i}
            x1={x + ((i + 1) * w) / n}
            y1={y}
            x2={x + ((i + 1) * w) / n}
            y2={y + h}
            stroke={TINTA.movelLeve}
            strokeWidth={0.9}
          />
        ))}
    </g>
  )
}

/** Armário embutido de parede com extensão livre. */
export function ArmarioLinear({
  x,
  y,
  w,
  h,
  sufixo,
  rot = 0,
}: Ret & { sufixo: string; rot?: number }) {
  return (
    <g transform={rot ? `rotate(${rot} ${x + w / 2} ${y + h / 2})` : undefined}>
      <use href={`#mv-armario-${sufixo}`} x={x} y={y} width={w} height={h} />
    </g>
  )
}

/** Jardineira com grama e arbustos. */
export function Jardineira({ x, y, w, h, sufixo }: Ret & { sufixo: string }) {
  const n = Math.max(1, Math.floor(Math.min(w, h) > 60 ? w / 90 : w / 70))
  const vertical = h > w
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={TINTA.papel} stroke={TINTA.movel} strokeWidth={TRACO.fino} />
      <rect x={x} y={y} width={w} height={h} fill={url('grama', sufixo)} />
      {Array.from({ length: n }, (_, i) => {
        const cx = vertical ? x + w / 2 : x + (w * (i + 0.5)) / n
        const cy = vertical ? y + (h * (i + 0.5)) / n : y + h / 2
        return <Movel key={i} nome="planta-p" x={cx} y={cy} sufixo={sufixo} />
      })}
    </g>
  )
}

/** Espelho d'água / piscina com escada e borda. */
export function Piscina({
  x,
  y,
  w,
  h,
  sufixo,
  escada = true,
}: Ret & { sufixo: string; escada?: boolean }) {
  return (
    <g>
      <rect x={x - 12} y={y - 12} width={w + 24} height={h + 24} fill={TINTA.pisoLeve} stroke={TINTA.movel} strokeWidth={TRACO.fino} />
      <rect x={x} y={y} width={w} height={h} fill={url('agua', sufixo)} stroke={TINTA.agua} strokeWidth={TRACO.medio} />
      {escada &&
        [0, 1, 2].map((i) => (
          <line
            key={i}
            x1={x + 24}
            y1={y + 20 + i * 18}
            x2={x + 24 + Math.min(110, w * 0.3)}
            y2={y + 20 + i * 18}
            stroke={TINTA.agua}
            strokeWidth={TRACO.medio}
          />
        ))}
      <text
        x={x + w - 16}
        y={y + h - 14}
        textAnchor="end"
        fontSize={15}
        fill={TINTA.agua}
        fontFamily="Inter, sans-serif"
      >
        1,40 m
      </text>
    </g>
  )
}

/**
 * Escada em U ou reta: degraus cotados, seta de subida e corrimão.
 */
export function Escada({
  x,
  y,
  w,
  h,
  degraus = 9,
  sentido = 'baixo',
}: Ret & { degraus?: number; sentido?: 'baixo' | 'cima' | 'direita' | 'esquerda' }) {
  const horizontal = sentido === 'direita' || sentido === 'esquerda'
  const passo = (horizontal ? w : h) / degraus
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={TINTA.papel} stroke={TINTA.movel} strokeWidth={TRACO.fino} />
      {Array.from({ length: degraus - 1 }, (_, i) =>
        horizontal ? (
          <line
            key={i}
            x1={x + (i + 1) * passo}
            y1={y}
            x2={x + (i + 1) * passo}
            y2={y + h}
            stroke={TINTA.movel}
            strokeWidth={TRACO.fino}
          />
        ) : (
          <line
            key={i}
            x1={x}
            y1={y + (i + 1) * passo}
            x2={x + w}
            y2={y + (i + 1) * passo}
            stroke={TINTA.movel}
            strokeWidth={TRACO.fino}
          />
        ),
      )}
      {/* linha de subida com seta */}
      {horizontal ? (
        <>
          <line x1={x + 10} y1={y + h / 2} x2={x + w - 14} y2={y + h / 2} stroke={TINTA.cota} strokeWidth={TRACO.medio} />
          <path d={`M${x + w - 14} ${y + h / 2} l-14 -7 v14 z`} fill={TINTA.cota} />
        </>
      ) : (
        <>
          <line x1={x + w / 2} y1={y + h - 10} x2={x + w / 2} y2={y + 14} stroke={TINTA.cota} strokeWidth={TRACO.medio} />
          <path d={`M${x + w / 2} ${y + 14} l-7 14 h14 z`} fill={TINTA.cota} />
        </>
      )}
      <text
        x={x + w / 2}
        y={y + h + 20}
        textAnchor="middle"
        fontSize={14}
        fill={TINTA.textoFraco}
        fontFamily="Inter, sans-serif"
      >
        {degraus} degraus
      </text>
    </g>
  )
}

/** Pergolado: vigas de madeira sobrepostas em sombra. */
export function Pergolado({ x, y, w, h, passo = 40 }: Ret & { passo?: number }) {
  const n = Math.floor(w / passo)
  return (
    <g opacity={0.55}>
      {Array.from({ length: n }, (_, i) => (
        <line
          key={i}
          x1={x + i * passo}
          y1={y}
          x2={x + i * passo}
          y2={y + h}
          stroke={TINTA.movelLeve}
          strokeWidth={2.4}
          strokeDasharray="14 9"
        />
      ))}
    </g>
  )
}
