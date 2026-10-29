/**
 * Visualizador de plantas. Paginado, com zoom pela roda do mouse (ancorado no
 * cursor), pan por arrasto, ajuste à tela e teclado.
 *
 * A folha pode ser um desenho SVG do registro (`tipo-1`, `cobertura-inferior`…)
 * ou uma imagem do material comercial (`imagem:planta-flat`). Daqui para baixo
 * a diferença se resume a duas coisas: de onde vêm largura e altura da folha, e
 * o que é renderizado dentro dela. Zoom, pan, paginação, ajuste à tela e
 * atalhos são o mesmo código nos dois casos — o corretor não deve perceber
 * qual das duas está na tela.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { EMPREENDIMENTO } from '../data/project'
import { Moldura, BotaoRedondo, SUAVE } from './shared/Moldura'
import { IconeAjustar, IconeMais, IconeMenos, IconeSetaDir, IconeSetaEsq } from './shared/icones'
import { useFechar, useTeclas } from './shared/useFechar'
import { useTipologiaAtiva } from './shared/useTipologiaAtiva'
import { fmtContador } from './shared/formato'
import { desenhoById } from './plantas/registro'
import { preencherCache, srcDaPlantaEmImagem, useFolhaDeImagem } from './plantas/imagem'

export interface VisualizadorPlantasProps {
  tipologiaId?: string
  /** Página inicial (base 0). */
  pagina?: number
  onFechar?: () => void
}

interface Vista {
  k: number
  x: number
  y: number
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/**
 * Teto de zoom quando a folha é imagem. O fator de 9× sobre o ajuste basta
 * para as plantas retrato, mas numa folha que já cabe quase inteira ele pararia
 * antes do tamanho nativo — e estas são plantas cotadas: o zoom tem de passar
 * do pixel original para a cota ficar legível.
 */
const ZOOM_NATIVO_MIN = 2

export function VisualizadorPlantas({
  tipologiaId,
  pagina = 0,
  onFechar,
}: VisualizadorPlantasProps) {
  const fechar = useFechar(onFechar)
  const { tipologia, unidade } = useTipologiaAtiva(tipologiaId)

  const plantas = tipologia.plantas
  const total = plantas.length
  const [p, setP] = useState(() => clamp(pagina, 0, Math.max(0, total - 1)))
  const indice = Math.min(p, Math.max(0, total - 1))
  const planta = plantas[indice]

  const alvo = planta?.desenho ?? 'tipo-1'
  const imagemSrc = useMemo(() => srcDaPlantaEmImagem(alvo), [alvo])
  const desenho = useMemo(() => (imagemSrc ? null : desenhoById(alvo)), [imagemSrc, alvo])
  const imagem = useFolhaDeImagem(imagemSrc)

  // A folha, venha de onde vier. Primitivos, e não um objeto: `kAjuste` e
  // `ajustar` dependem deles, e um objeto novo a cada render faria o efeito de
  // ajuste disparar em loop.
  const largura = desenho ? desenho.largura : imagem.largura
  const altura = desenho ? desenho.altura : imagem.altura
  const medida = largura > 0 && altura > 0

  const palcoRef = useRef<HTMLDivElement>(null)
  const [caixa, setCaixa] = useState({ w: 0, h: 0 })
  const [vista, setVista] = useState<Vista>({ k: 1, x: 0, y: 0 })
  const [arrastando, setArrastando] = useState(false)

  /** Escala que faz a folha caber inteira, com respiro. */
  const kAjuste = useMemo(() => {
    if (!caixa.w || !caixa.h || !medida) return 1
    return Math.min(caixa.w / largura, caixa.h / altura) * 0.94
  }, [caixa.w, caixa.h, largura, altura, medida])

  const kMax = useMemo(
    () => (imagemSrc ? Math.max(kAjuste * 9, ZOOM_NATIVO_MIN) : kAjuste * 9),
    [imagemSrc, kAjuste],
  )

  const ajustar = useCallback(() => {
    if (!caixa.w || !caixa.h || !medida) return
    setVista({
      k: kAjuste,
      x: (caixa.w - largura * kAjuste) / 2,
      y: (caixa.h - altura * kAjuste) / 2,
    })
  }, [caixa.w, caixa.h, largura, altura, medida, kAjuste])

  // mede o palco
  useLayoutEffect(() => {
    const el = palcoRef.current
    if (!el) return
    const medir = () => setCaixa({ w: el.clientWidth, h: el.clientHeight })
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Ajusta ao abrir, ao trocar de página, ao redimensionar e — no caso da
  // imagem — assim que a folha é medida, porque antes disso não havia proporção.
  useEffect(() => {
    ajustar()
  }, [ajustar, indice])

  // Paginar não pode esperar download: as outras folhas entram no cache depois
  // que a atual está na tela.
  const prontaParaPreCarregar = !imagemSrc || imagem.estado !== 'carregando'
  useEffect(() => {
    if (!prontaParaPreCarregar) return
    const outras = plantas
      .map((pl) => srcDaPlantaEmImagem(pl.desenho))
      .filter((src): src is string => !!src && src !== imagemSrc)
    if (outras.length) preencherCache(outras)
  }, [plantas, imagemSrc, prontaParaPreCarregar])

  const zoomEm = useCallback(
    (fator: number, cx?: number, cy?: number) => {
      setVista((v) => {
        const k = clamp(v.k * fator, kAjuste * 0.5, kMax)
        if (k === v.k) return v
        const ax = cx ?? caixa.w / 2
        const ay = cy ?? caixa.h / 2
        // mantém o ponto âncora fixo na tela
        return { k, x: ax - ((ax - v.x) / v.k) * k, y: ay - ((ay - v.y) / v.k) * k }
      })
    },
    [caixa.w, caixa.h, kAjuste, kMax],
  )

  // roda do mouse: listener nativo para poder cancelar o scroll da página
  useEffect(() => {
    const el = palcoRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomEm(Math.exp(-e.deltaY * 0.0016), e.clientX - r.left, e.clientY - r.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomEm])

  // arrasto
  const inicio = useRef<{ px: number; py: number; x: number; y: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    inicio.current = { px: e.clientX, py: e.clientY, x: vista.x, y: vista.y }
    setArrastando(true)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const i = inicio.current
    if (!i) return
    setVista((v) => ({ ...v, x: i.x + (e.clientX - i.px), y: i.y + (e.clientY - i.py) }))
  }
  const onPointerUp = (e: React.PointerEvent) => {
    inicio.current = null
    setArrastando(false)
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
  }

  const irPara = useCallback(
    (passo: number) => {
      if (total < 2) return
      setP((i) => (i + passo + total) % total)
    },
    [total],
  )

  useTeclas({
    Escape: fechar,
    ArrowRight: () => irPara(1),
    ArrowLeft: () => irPara(-1),
    '+': () => zoomEm(1.25),
    '=': () => zoomEm(1.25),
    '-': () => zoomEm(0.8),
    '0': ajustar,
  })

  if (!planta) {
    return (
      <Moldura titulo="Plantas" onFechar={fechar} claro>
        <div className="grid h-full place-items-center text-grafite-500">
          Sem plantas nesta tipologia.
        </div>
      </Moldura>
    )
  }

  const Desenho = desenho?.Componente
  const percentual = Math.round((vista.k / (kAjuste || 1)) * 100)

  return (
    <Moldura
      claro
      sobretitulo={
        unidade ? `Torre ${unidade.torre} · Unidade ${unidade.numero}` : EMPREENDIMENTO.nome
      }
      titulo={planta.titulo}
      subtitulo={
        <span>
          {tipologia.nome} · {tipologia.rotulo}
          <span className="mx-2 text-grafite-900/20">|</span>
          {planta.pavimento}
        </span>
      }
      canto={
        <div className="flex items-center gap-4">
          <span className="font-display text-[22px] leading-none tabular-nums text-grafite-500">
            {fmtContador(indice + 1, total)}
          </span>
          <div className="hidden items-center gap-2 md:flex">
            <BotaoRedondo
              claro
              onClick={() => irPara(-1)}
              rotulo="Planta anterior"
              desabilitado={total < 2}
            >
              <IconeSetaEsq />
            </BotaoRedondo>
            <BotaoRedondo
              claro
              onClick={() => irPara(1)}
              rotulo="Próxima planta"
              desabilitado={total < 2}
            >
              <IconeSetaDir />
            </BotaoRedondo>
          </div>
        </div>
      }
      onFechar={fechar}
      rodape={
        <div className="flex items-center justify-between gap-6 px-7 pb-6 md:px-12 md:pb-8">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {plantas.map((pl, i) => (
              <button
                key={pl.id}
                type="button"
                onClick={() => setP(i)}
                aria-pressed={i === indice}
                className={clsx(
                  'chip border',
                  i === indice
                    ? 'border-grafite-900 bg-grafite-900 font-medium text-areia-50'
                    : 'border-grafite-900/15 text-grafite-500 hover:border-grafite-900/35 hover:text-grafite-900',
                )}
              >
                {pl.titulo}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="mr-1 w-12 text-right text-[11px] tracking-[0.14em] tabular-nums text-grafite-500">
              {percentual}%
            </span>
            <BotaoRedondo claro onClick={() => zoomEm(0.8)} rotulo="Reduzir">
              <IconeMenos />
            </BotaoRedondo>
            <BotaoRedondo claro onClick={() => zoomEm(1.25)} rotulo="Ampliar">
              <IconeMais />
            </BotaoRedondo>
            <BotaoRedondo claro onClick={ajustar} rotulo="Ajustar à tela">
              <IconeAjustar />
            </BotaoRedondo>
          </div>
        </div>
      }
    >
      <div
        ref={palcoRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
          zoomEm(1.6, e.clientX - r.left, e.clientY - r.top)
        }}
        className={clsx(
          'absolute inset-0 touch-none overflow-hidden',
          arrastando ? 'cursor-grabbing' : 'cursor-grab',
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={planta.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SUAVE}
            className="absolute top-0 left-0 origin-top-left"
            style={{
              width: largura,
              height: altura,
              transform: `translate3d(${vista.x}px, ${vista.y}px, 0) scale(${vista.k})`,
            }}
          >
            {Desenho ? (
              <Desenho />
            ) : imagemSrc && imagem.estado === 'pronta' ? (
              <img
                src={imagemSrc}
                alt={`Planta — ${planta.titulo}`}
                draggable={false}
                className="pointer-events-none block h-full w-full select-none"
              />
            ) : null}
          </motion.div>
        </AnimatePresence>

        {imagemSrc && imagem.estado !== 'pronta' && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center text-[12.5px] text-grafite-500">
            {imagem.estado === 'erro'
              ? 'Não foi possível carregar a imagem desta planta.'
              : 'Carregando a planta…'}
          </p>
        )}

        <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10.5px] tracking-[0.2em] text-grafite-500/50 uppercase">
          Arraste para mover · roda do mouse para o zoom · 0 ajusta à tela
        </p>
      </div>
    </Moldura>
  )
}
