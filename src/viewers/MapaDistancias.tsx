/**
 * Mapa de distâncias. Diagrama radial em SVG — nada de mapa online: o
 * empreendimento no centro, cada ponto urbano no seu rumo e com raio
 * proporcional ao logaritmo da distância, anéis de 1, 5, 10 e 30 km,
 * rosa dos ventos, e a lista completa ordenada por distância abaixo.
 */
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { EMPREENDIMENTO, PONTOS_URBANOS } from '../data/project'
import type { PontoUrbano } from '../core/types'
import { Moldura } from './shared/Moldura'
import { useFechar, useTeclas } from './shared/useFechar'
import { fmtKm, fmtMin } from './shared/formato'

export interface MapaDistanciasProps {
  onFechar?: () => void
}

/* ─────────── escala logarítmica ─────────── */

const KM_MIN = 0.8
const KM_MAX = 36
const R0 = 58
const R_MAX = 330
const ANEIS = [1, 5, 10, 30]

const raio = (km: number): number => {
  const t = (Math.log(Math.max(km, KM_MIN)) - Math.log(KM_MIN)) / (Math.log(KM_MAX) - Math.log(KM_MIN))
  return R0 + Math.min(1, Math.max(0, t)) * (R_MAX - R0)
}

const pos = (km: number, rumo: number): [number, number] => {
  const a = (rumo * Math.PI) / 180
  const r = raio(km)
  return [r * Math.sin(a), -r * Math.cos(a)]
}

const ROSA = [
  { rotulo: 'N', rumo: 0 },
  { rotulo: 'NE', rumo: 45 },
  { rotulo: 'L', rumo: 90 },
  { rotulo: 'SE', rumo: 135 },
  { rotulo: 'S', rumo: 180 },
  { rotulo: 'SO', rumo: 225 },
  { rotulo: 'O', rumo: 270 },
  { rotulo: 'NO', rumo: 315 },
]

/* ─────────── quebra e desempilhamento dos rótulos ─────────── */

const CORPO = 13.5
const ALTURA_LINHA = 15

function quebrar(nome: string): string[] {
  if (nome.length <= 20) return [nome]
  const palavras = nome.split(' ')
  const linhas: string[] = []
  let atual = ''
  for (const p of palavras) {
    if ((atual + ' ' + p).trim().length > 20 && atual) {
      linhas.push(atual)
      atual = p
    } else {
      atual = (atual + ' ' + p).trim()
    }
  }
  if (atual) linhas.push(atual)
  return linhas.slice(0, 3)
}

interface Colocado {
  ponto: PontoUrbano
  px: number
  py: number
  lx: number
  ly: number
  ancora: 'start' | 'middle' | 'end'
  linhas: string[]
  caixa: { x: number; y: number; w: number; h: number }
}

/**
 * Empurra o rótulo para fora, em passos, até não colidir com nenhum já posto.
 * Resolve o adensamento dos pontos a Norte sem posições codificadas à mão.
 */
function colocar(pontos: PontoUrbano[]): Colocado[] {
  const postos: Colocado[] = []
  const emOrdem = [...pontos].sort((a, b) => a.rumo - b.rumo)

  for (const ponto of emOrdem) {
    const a = (ponto.rumo * Math.PI) / 180
    const sin = Math.sin(a)
    const cos = Math.cos(a)
    const [px, py] = pos(ponto.distanciaKm, ponto.rumo)
    const linhas = quebrar(ponto.nome)
    const ancora: 'start' | 'middle' | 'end' = sin > 0.28 ? 'start' : sin < -0.28 ? 'end' : 'middle'
    const largura = Math.max(...linhas.map((l) => l.length), 13) * CORPO * 0.55
    const altura = linhas.length * ALTURA_LINHA + 17

    let escolhido: Colocado | null = null
    for (let passo = 0; passo < 7; passo++) {
      const r = raio(ponto.distanciaKm) + 24 + passo * 24
      const lx = r * sin
      const ly = -r * cos
      const x = ancora === 'start' ? lx : ancora === 'end' ? lx - largura : lx - largura / 2
      const y = ly - (cos > 0.28 ? altura : 2)
      const caixa = { x, y, w: largura, h: altura }
      const colide = postos.some(
        (o) =>
          caixa.x < o.caixa.x + o.caixa.w + 6 &&
          caixa.x + caixa.w + 6 > o.caixa.x &&
          caixa.y < o.caixa.y + o.caixa.h + 4 &&
          caixa.y + caixa.h + 4 > o.caixa.y,
      )
      escolhido = { ponto, px, py, lx, ly, ancora, linhas, caixa }
      if (!colide) break
    }
    if (escolhido) postos.push(escolhido)
  }
  return postos
}

/* ─────────── componente ─────────── */

export function MapaDistancias({ onFechar }: MapaDistanciasProps) {
  const fechar = useFechar(onFechar)
  useTeclas({ Escape: fechar })

  const [ativo, setAtivo] = useState<string | null>(null)
  const colocados = useMemo(() => colocar(PONTOS_URBANOS), [])
  const ordenados = useMemo(
    () => [...PONTOS_URBANOS].sort((a, b) => a.distanciaKm - b.distanciaKm),
    [],
  )

  return (
    <Moldura
      sobretitulo={`${EMPREENDIMENTO.bairro} · ${EMPREENDIMENTO.cidade}/${EMPREENDIMENTO.uf}`}
      titulo="Mapa de distâncias"
      subtitulo={`${EMPREENDIMENTO.endereco} — raio proporcional ao logaritmo da distância`}
      onFechar={fechar}
    >
      <div className="absolute inset-0 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-[1180px] px-7 pb-12 md:px-12">
          {/* ── diagrama radial ── */}
          <div className="mx-auto w-full max-w-[940px]">
            <svg
              viewBox="-430 -400 860 800"
              className="h-auto w-full"
              role="img"
              aria-label="Diagrama radial de distâncias até pontos de Santarém"
            >
              {/* anéis */}
              {ANEIS.map((km) => (
                <g key={km}>
                  <circle
                    cx={0}
                    cy={0}
                    r={raio(km)}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={0.8}
                    className="text-areia-200/14"
                    strokeDasharray={km === 30 ? undefined : '3 6'}
                  />
                  <text
                    x={raio(km) * Math.SQRT1_2 + 4}
                    y={-raio(km) * Math.SQRT1_2 - 6}
                    fontSize={11}
                    letterSpacing={1.4}
                    className="fill-areia-200/35"
                  >
                    {fmtKm(km)}
                  </text>
                </g>
              ))}

              {/* rosa dos ventos */}
              {ROSA.map((d) => {
                const a = (d.rumo * Math.PI) / 180
                const r1 = R0 - 16
                const r2 = R_MAX + 14
                return (
                  <g key={d.rotulo}>
                    <line
                      x1={r1 * Math.sin(a)}
                      y1={-r1 * Math.cos(a)}
                      x2={r2 * Math.sin(a)}
                      y2={-r2 * Math.cos(a)}
                      stroke="currentColor"
                      strokeWidth={d.rumo % 90 === 0 ? 0.9 : 0.6}
                      className={d.rumo % 90 === 0 ? 'text-areia-200/18' : 'text-areia-200/9'}
                    />
                    <text
                      x={(R_MAX + 32) * Math.sin(a)}
                      y={-(R_MAX + 32) * Math.cos(a) + 4}
                      textAnchor="middle"
                      fontSize={d.rumo === 0 ? 15 : 12}
                      letterSpacing={2}
                      className={d.rumo === 0 ? 'fill-rio-300' : 'fill-areia-200/40'}
                    >
                      {d.rotulo}
                    </text>
                  </g>
                )
              })}

              {/* raios e pontos */}
              {colocados.map((c) => {
                const on = ativo === c.ponto.id
                const off = ativo !== null && !on
                return (
                  <g
                    key={c.ponto.id}
                    onMouseEnter={() => setAtivo(c.ponto.id)}
                    onMouseLeave={() => setAtivo(null)}
                    onFocus={() => setAtivo(c.ponto.id)}
                    onBlur={() => setAtivo(null)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${c.ponto.nome}, ${fmtKm(c.ponto.distanciaKm)}, ${fmtMin(c.ponto.tempoMin)}`}
                    className="cursor-default outline-none transition-opacity duration-200"
                    style={{ opacity: off ? 0.3 : 1 }}
                  >
                    {/* alvo generoso para o hover */}
                    <circle cx={c.px} cy={c.py} r={22} fill="transparent" />
                    <line
                      x1={0}
                      y1={0}
                      x2={c.px}
                      y2={c.py}
                      stroke="currentColor"
                      strokeWidth={on ? 1.6 : 0.8}
                      className={on ? 'text-rio-300' : 'text-areia-200/22'}
                    />
                    <line
                      x1={c.px}
                      y1={c.py}
                      x2={c.lx}
                      y2={c.ly}
                      stroke="currentColor"
                      strokeWidth={0.7}
                      className={on ? 'text-rio-300/70' : 'text-areia-200/14'}
                    />
                    <circle
                      cx={c.px}
                      cy={c.py}
                      r={on ? 7 : 4.5}
                      className={on ? 'fill-rio-300' : 'fill-areia-200/75'}
                      style={{ transition: 'r 160ms' }}
                    />
                    {on && (
                      <circle
                        cx={c.px}
                        cy={c.py}
                        r={13}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={0.9}
                        className="text-rio-300/60"
                      />
                    )}

                    <g textAnchor={c.ancora}>
                      {c.linhas.map((l, i) => (
                        <text
                          key={i}
                          x={c.lx}
                          y={c.ly + (c.caixa.y - c.ly) + 12 + i * ALTURA_LINHA}
                          fontSize={CORPO}
                          letterSpacing={0.3}
                          className={on ? 'fill-areia-50' : 'fill-areia-100/80'}
                        >
                          {l}
                        </text>
                      ))}
                      <text
                        x={c.lx}
                        y={c.ly + (c.caixa.y - c.ly) + 12 + c.linhas.length * ALTURA_LINHA}
                        fontSize={11.5}
                        letterSpacing={1}
                        className={on ? 'fill-rio-300' : 'fill-areia-300/55'}
                      >
                        {fmtKm(c.ponto.distanciaKm)} · {fmtMin(c.ponto.tempoMin)}
                      </text>
                    </g>
                  </g>
                )
              })}

              {/* empreendimento no centro */}
              <g>
                <circle cx={0} cy={0} r={R0 - 20} className="fill-rio-700/35" />
                <circle
                  cx={0}
                  cy={0}
                  r={R0 - 20}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.1}
                  className="text-rio-300/70"
                />
                <circle cx={0} cy={0} r={4} className="fill-rio-300" />
                <text
                  x={0}
                  y={-6}
                  textAnchor="middle"
                  fontSize={17}
                  letterSpacing={1.4}
                  className="fill-areia-50"
                  style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
                >
                  VILLAGE
                </text>
                <text
                  x={0}
                  y={13}
                  textAnchor="middle"
                  fontSize={17}
                  letterSpacing={1.4}
                  className="fill-areia-50"
                  style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
                >
                  ONE
                </text>
              </g>
            </svg>
          </div>

          {/* ── lista completa ── */}
          <div className="mt-2">
            <div className="mb-3 flex items-baseline justify-between border-b border-areia-200/12 pb-2.5">
              <h3 className="text-[10px] tracking-[0.3em] text-areia-300/60 uppercase">
                Todos os pontos, por distância
              </h3>
              <span className="text-[11px] tabular-nums text-areia-200/40">
                {ordenados.length} destinos
              </span>
            </div>

            <ul>
              {ordenados.map((p, i) => {
                const on = ativo === p.id
                return (
                  <motion.li
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: 0.02 * i, ease: [0.22, 0.61, 0.36, 1] }}
                    onMouseEnter={() => setAtivo(p.id)}
                    onMouseLeave={() => setAtivo(null)}
                    className={clsx(
                      'grid cursor-default grid-cols-[22px_1fr_auto_auto] items-baseline gap-x-4 border-b border-areia-200/7 py-2.5 transition-colors duration-200 md:grid-cols-[26px_1fr_130px_84px_72px]',
                      on ? 'bg-areia-100/5' : 'hover:bg-areia-100/3',
                    )}
                  >
                    <span className="text-[11px] tabular-nums text-areia-300/40">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={clsx(
                        'truncate text-[14px] font-light transition-colors duration-200',
                        on ? 'text-areia-50' : 'text-areia-100/85',
                      )}
                    >
                      {p.nome}
                    </span>
                    <span className="hidden text-[11.5px] text-areia-300/50 md:block">{p.categoria}</span>
                    <span
                      className={clsx(
                        'text-right text-[13.5px] tabular-nums transition-colors duration-200',
                        on ? 'text-rio-300' : 'text-areia-100/70',
                      )}
                    >
                      {fmtKm(p.distanciaKm)}
                    </span>
                    <span className="text-right text-[12.5px] tabular-nums text-areia-200/45">
                      {fmtMin(p.tempoMin)}
                    </span>
                  </motion.li>
                )
              })}
            </ul>

            <p className="mt-5 max-w-[640px] text-[11.5px] leading-relaxed text-areia-300/40">
              Distâncias e tempos por via, medidos a partir de {EMPREENDIMENTO.endereco}. O ângulo de
              cada ponto é o rumo real; o raio é logarítmico, para que a vizinhança imediata e Alter
              do Chão caibam no mesmo desenho.
            </p>
          </div>
        </div>
      </div>
    </Moldura>
  )
}
