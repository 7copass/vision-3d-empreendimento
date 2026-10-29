/**
 * Filme do empreendimento. Não há arquivo de vídeo: o filme é montado dos
 * renders com Ken Burns contínuo, legendas de venda, barra de capítulos e
 * play/pause. O avanço é cronometrado em rAF e escreve direto no DOM, para
 * não re-renderizar a árvore sessenta vezes por segundo durante a call.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { AMENIDADES, EMPREENDIMENTO } from '../data/project'
import { Moldura, BotaoRedondo } from './shared/Moldura'
import { IconePausa, IconePlay, IconeSetaDir, IconeSetaEsq } from './shared/icones'
import { useFechar, useTeclas } from './shared/useFechar'
import { fmtTempo } from './shared/formato'

export interface FilmeProps {
  onFechar?: () => void
}

interface Cena {
  id: string
  src: string
  rotulo: string
  titulo: string
  legenda: string
  /** Duração em segundos. */
  dur: number
  /** Ken Burns: início e fim do enquadramento. */
  de: [number, number, number]
  para: [number, number, number]
}

/** Seis trajetos de câmera alternados, para o passe-passe não ficar mecânico. */
const TRAJETOS: [[number, number, number], [number, number, number]][] = [
  [[1.04, -1.5, -1], [1.17, 2, 1.5]],
  [[1.18, 2.5, 1], [1.04, -2, -1.5]],
  [[1.06, 2, -1.5], [1.18, -2.5, 1]],
  [[1.16, -2, 1.5], [1.05, 2, -1]],
  [[1.05, 0, -2], [1.19, 0, 2]],
  [[1.19, -2.5, 0], [1.06, 2.5, 0]],
]

function montarCenas(): Cena[] {
  const cenas: Cena[] = [
    {
      id: 'abertura',
      src: '/img/render/r01.jpeg',
      rotulo: 'Abertura',
      titulo: EMPREENDIMENTO.nome,
      legenda: `${EMPREENDIMENTO.subtitulo} · ${EMPREENDIMENTO.endereco}, ${EMPREENDIMENTO.bairro} — ${EMPREENDIMENTO.cidade}/${EMPREENDIMENTO.uf}`,
      dur: 7,
      de: TRAJETOS[0][0],
      para: TRAJETOS[0][1],
    },
    {
      id: 'conceito',
      src: '/img/render/r02.jpeg',
      rotulo: 'O conceito',
      titulo: 'Duas torres, um pavimento inteiro de convívio',
      legenda: EMPREENDIMENTO.descricao,
      dur: 11,
      de: TRAJETOS[1][0],
      para: TRAJETOS[1][1],
    },
  ]

  AMENIDADES.forEach((a, i) => {
    const t = TRAJETOS[(i + 2) % TRAJETOS.length]
    cenas.push({
      id: `am-${a.id}`,
      src: a.imagens[0] ?? '/img/render/r05.jpeg',
      rotulo: a.nome,
      titulo: a.nome,
      legenda: a.descricao,
      dur: 6.5,
      de: t[0],
      para: t[1],
    })
  })

  cenas.push({
    id: 'fechamento',
    src: '/img/render/r15.jpeg',
    rotulo: 'Entrega',
    titulo: `Entrega em ${EMPREENDIMENTO.entrega.toLowerCase()}`,
    legenda: `${EMPREENDIMENTO.construtora} · comercialização ${EMPREENDIMENTO.corretora}`,
    dur: 8,
    de: TRAJETOS[4][0],
    para: TRAJETOS[4][1],
  })

  return cenas
}

const mistura = (a: number, b: number, t: number) => a + (b - a) * t
/** Suaviza as pontas do movimento sem dar a sensação de balanço. */
const suave = (t: number) => t * t * (3 - 2 * t)

export function Filme({ onFechar }: FilmeProps) {
  const fechar = useFechar(onFechar)
  const cenas = useMemo(montarCenas, [])
  const duracaoTotal = useMemo(() => cenas.reduce((s, c) => s + c.dur, 0), [cenas])
  const acumulado = useMemo(() => {
    const out: number[] = []
    let s = 0
    for (const c of cenas) {
      out.push(s)
      s += c.dur
    }
    return out
  }, [cenas])

  const [indice, setIndice] = useState(0)
  const [tocando, setTocando] = useState(true)
  const [terminou, setTerminou] = useState(false)

  const palcoRef = useRef<HTMLDivElement>(null)
  const barraRef = useRef<HTMLDivElement>(null)
  const relogioRef = useRef<HTMLSpanElement>(null)
  const decorridoRef = useRef(0)
  const cena = cenas[indice]

  const irPara = useCallback((i: number) => {
    decorridoRef.current = 0
    setTerminou(false)
    setIndice(i)
  }, [])

  const avancar = useCallback(
    (passo: number) => {
      const i = indice + passo
      if (i < 0) return irPara(0)
      if (i >= cenas.length) {
        setTerminou(true)
        setTocando(false)
        return
      }
      irPara(i)
    },
    [indice, cenas.length, irPara],
  )

  // cronômetro: escreve Ken Burns, barra e relógio sem passar por estado
  useEffect(() => {
    let id = 0
    let anterior = performance.now()

    const quadro = (agora: number) => {
      const dt = (agora - anterior) / 1000
      anterior = agora
      if (tocando && !terminou) decorridoRef.current += dt

      const t = Math.min(1, decorridoRef.current / cena.dur)
      const e = suave(t)
      const k = mistura(cena.de[0], cena.para[0], e)
      const px = mistura(cena.de[1], cena.para[1], e)
      const py = mistura(cena.de[2], cena.para[2], e)

      const img = palcoRef.current?.querySelector<HTMLElement>(`[data-cena="${cena.id}"] img`)
      if (img) img.style.transform = `scale(${k.toFixed(4)}) translate(${px.toFixed(3)}%, ${py.toFixed(3)}%)`
      if (barraRef.current) barraRef.current.style.width = `${(t * 100).toFixed(2)}%`
      if (relogioRef.current) {
        relogioRef.current.textContent = `${fmtTempo(acumulado[indice] + t * cena.dur)} / ${fmtTempo(duracaoTotal)}`
      }

      if (t >= 1 && tocando && !terminou) {
        if (indice + 1 < cenas.length) {
          decorridoRef.current = 0
          setIndice(indice + 1)
        } else {
          setTerminou(true)
          setTocando(false)
        }
      }
      id = requestAnimationFrame(quadro)
    }

    id = requestAnimationFrame(quadro)
    return () => cancelAnimationFrame(id)
  }, [cena, indice, tocando, terminou, cenas.length, acumulado, duracaoTotal])

  // pré-carrega a cena seguinte
  useEffect(() => {
    const prox = cenas[indice + 1]
    if (prox) {
      const img = new Image()
      img.src = prox.src
    }
  }, [indice, cenas])

  useTeclas({
    Escape: fechar,
    ' ': () => (terminou ? irPara(0) : setTocando((v) => !v)),
    ArrowRight: () => avancar(1),
    ArrowLeft: () => avancar(-1),
  })

  const reiniciar = useCallback(() => {
    irPara(0)
    setTocando(true)
  }, [irPara])

  return (
    <Moldura
      sobretitulo="Filme do empreendimento"
      titulo={EMPREENDIMENTO.nome}
      subtitulo={`${cenas.length} cenas · ${fmtTempo(duracaoTotal)}`}
      canto={
        <span ref={relogioRef} className="font-display text-[19px] leading-none tabular-nums text-areia-200/70">
          {fmtTempo(0)} / {fmtTempo(duracaoTotal)}
        </span>
      }
      onFechar={fechar}
      rodape={
        <div className="px-7 pb-7 md:px-12 md:pb-9">
          {/* barra de capítulos */}
          <div className="mb-5 flex items-end gap-[3px]">
            {cenas.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => irPara(i)}
                title={c.rotulo}
                aria-label={`Ir para ${c.rotulo}`}
                style={{ flexGrow: c.dur }}
                className="group relative h-6 shrink-0 basis-0 pt-[18px]"
              >
                <span
                  className={clsx(
                    'block h-[3px] w-full overflow-hidden rounded-full transition-colors duration-200',
                    i < indice ? 'bg-areia-100/70' : 'bg-areia-100/15 group-hover:bg-areia-100/30',
                  )}
                >
                  {i === indice && <span ref={barraRef} className="block h-full bg-areia-100" style={{ width: 0 }} />}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <BotaoRedondo onClick={() => avancar(-1)} rotulo="Cena anterior" desabilitado={indice === 0}>
                <IconeSetaEsq />
              </BotaoRedondo>
              <BotaoRedondo
                grande
                onClick={() => (terminou ? reiniciar() : setTocando((v) => !v))}
                rotulo={terminou ? 'Assistir de novo' : tocando ? 'Pausar' : 'Reproduzir'}
              >
                {tocando && !terminou ? <IconePausa width={20} height={20} /> : <IconePlay width={20} height={20} />}
              </BotaoRedondo>
              <BotaoRedondo
                onClick={() => avancar(1)}
                rotulo="Próxima cena"
                desabilitado={indice >= cenas.length - 1}
              >
                <IconeSetaDir />
              </BotaoRedondo>
            </div>

            <p className="hidden text-[10.5px] tracking-[0.2em] text-areia-200/35 uppercase sm:block">
              Espaço pausa · setas mudam de cena · Esc fecha
            </p>
          </div>
        </div>
      }
    >
      {/* palco do filme */}
      <div ref={palcoRef} className="absolute inset-0 overflow-hidden bg-black">
        <AnimatePresence initial={false}>
          <motion.div
            key={cena.id}
            data-cena={cena.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'linear' }}
            className="absolute inset-0"
          >
            <img
              src={cena.src}
              alt={cena.titulo}
              draggable={false}
              className="h-full w-full object-cover select-none will-change-transform"
              style={{ transform: `scale(${cena.de[0]})` }}
            />
            {/* vinheta e gradiente de leitura */}
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_30%,rgba(0,0,0,0.55)_100%)]" />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* legenda */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-7 pb-10 md:px-16 md:pb-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={cena.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
              className="max-w-[760px]"
            >
              <p className="mb-2.5 text-[10px] tracking-[0.34em] text-areia-300/70 uppercase">{cena.rotulo}</p>
              <h3 className="font-display text-[30px] leading-[1.1] font-light text-areia-50 md:text-[42px]">
                {cena.titulo}
              </h3>
              <p className="mt-3 max-w-[620px] text-[13.5px] leading-relaxed font-light text-areia-100/75">
                {cena.legenda}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* véu de pausa / fim */}
        <AnimatePresence>
          {(!tocando || terminou) && (
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => (terminou ? reiniciar() : setTocando(true))}
              aria-label={terminou ? 'Assistir de novo' : 'Retomar'}
              className="absolute inset-0 grid place-items-center bg-grafite-950/45"
            >
              <span className="vidro grid h-20 w-20 place-items-center rounded-full text-areia-50">
                <IconePlay width={26} height={26} />
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </Moldura>
  )
}
