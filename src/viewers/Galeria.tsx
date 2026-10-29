/**
 * Galeria de ambientes em tela cheia. Chips por categoria, miniaturas,
 * contador, setas, teclado e transição cruzada entre imagens.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useTour } from '../core/store'
import type { Ambiente } from '../core/types'
import { Moldura, BotaoRedondo, SUAVE } from './shared/Moldura'
import { IconeSetaDir, IconeSetaEsq } from './shared/icones'
import { useFechar, useTeclas } from './shared/useFechar'
import { useTipologiaAtiva } from './shared/useTipologiaAtiva'
import { fmtContador } from './shared/formato'

export interface GaleriaProps {
  /** Força uma tipologia. Omitido, usa a da unidade selecionada. */
  tipologiaId?: string
  /** Substitui o fechamento padrão (Esc e botão). */
  onFechar?: () => void
}

const TODOS = '__todos__'

export function Galeria({ tipologiaId, onFechar }: GaleriaProps) {
  const fechar = useFechar(onFechar)
  const { tipologia, unidade } = useTipologiaAtiva(tipologiaId)
  const ambienteAtivo = useTour((s) => s.ambienteAtivo)
  const setAmbienteAtivo = useTour((s) => s.setAmbienteAtivo)

  const [categoria, setCategoria] = useState<string>(TODOS)
  const [indice, setIndice] = useState(0)
  const [sentido, setSentido] = useState(1)
  const faixaRef = useRef<HTMLDivElement>(null)

  const categorias = useMemo(() => {
    const vistas: string[] = []
    for (const a of tipologia.ambientes) if (!vistas.includes(a.categoria)) vistas.push(a.categoria)
    return vistas
  }, [tipologia])

  const lista = useMemo<Ambiente[]>(
    () =>
      categoria === TODOS
        ? tipologia.ambientes
        : tipologia.ambientes.filter((a) => a.categoria === categoria),
    [tipologia, categoria],
  )

  const total = lista.length
  const atual = lista[Math.min(indice, Math.max(0, total - 1))]

  // último id trocado com o store, nos dois sentidos — evita o laço entre os
  // dois efeitos de sincronismo (e que escolher uma miniatura limpe o filtro)
  const ultimoSincronizado = useRef<string | null>(null)

  // ficha → galeria: entra na imagem apontada de fora
  useEffect(() => {
    if (!ambienteAtivo || ambienteAtivo === ultimoSincronizado.current) return
    const alvo = tipologia.ambientes.findIndex((a) => a.id === ambienteAtivo)
    if (alvo < 0) return
    ultimoSincronizado.current = ambienteAtivo
    setCategoria(TODOS)
    setIndice(alvo)
  }, [ambienteAtivo, tipologia])

  // a troca de categoria preserva a imagem quando ela sobrevive ao filtro
  const trocarCategoria = useCallback(
    (nova: string) => {
      const atualId = atual?.id
      setCategoria(nova)
      const proxima =
        nova === TODOS ? tipologia.ambientes : tipologia.ambientes.filter((a) => a.categoria === nova)
      const mantido = atualId ? proxima.findIndex((a) => a.id === atualId) : -1
      setIndice(mantido >= 0 ? mantido : 0)
    },
    [atual, tipologia],
  )

  const ir = useCallback(
    (passo: number) => {
      if (total < 2) return
      setSentido(passo > 0 ? 1 : -1)
      setIndice((i) => (i + passo + total) % total)
    },
    [total],
  )

  const escolher = useCallback(
    (i: number) => {
      setSentido(i >= indice ? 1 : -1)
      setIndice(i)
    },
    [indice],
  )

  useTeclas({
    ArrowRight: () => ir(1),
    ArrowLeft: () => ir(-1),
    Escape: fechar,
  })

  // galeria → ficha: reflete a imagem corrente no estado compartilhado
  useEffect(() => {
    if (!atual || atual.id === ultimoSincronizado.current) return
    ultimoSincronizado.current = atual.id
    setAmbienteAtivo(atual.id)
  }, [atual, setAmbienteAtivo])

  // mantém a miniatura ativa visível
  useEffect(() => {
    const faixa = faixaRef.current
    if (!faixa) return
    const alvo = faixa.querySelector<HTMLElement>('[data-ativo="true"]')
    alvo?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [indice, categoria])

  // pré-carrega vizinhas
  useEffect(() => {
    if (total < 2) return
    for (const p of [1, -1]) {
      const v = lista[(indice + p + total) % total]
      if (v) {
        const img = new Image()
        img.src = v.src
      }
    }
  }, [indice, lista, total])

  if (!atual) {
    return (
      <Moldura titulo="Galeria" onFechar={fechar}>
        <div className="grid h-full place-items-center text-areia-200/50">Sem imagens nesta tipologia.</div>
      </Moldura>
    )
  }

  return (
    <Moldura
      sobretitulo={unidade ? `Torre ${unidade.torre} · Unidade ${unidade.numero}` : 'Village One'}
      titulo={atual.titulo}
      subtitulo={
        <span>
          {tipologia.nome} · {tipologia.rotulo}
          <span className="mx-2 text-areia-300/30">|</span>
          {atual.categoria}
        </span>
      }
      canto={
        <div className="flex items-center gap-4">
          <span className="font-display text-[22px] leading-none tabular-nums text-areia-200/80">
            {fmtContador(indice + 1, total)}
          </span>
          <div className="hidden items-center gap-2 md:flex">
            <BotaoRedondo onClick={() => ir(-1)} rotulo="Imagem anterior" desabilitado={total < 2}>
              <IconeSetaEsq />
            </BotaoRedondo>
            <BotaoRedondo onClick={() => ir(1)} rotulo="Próxima imagem" desabilitado={total < 2}>
              <IconeSetaDir />
            </BotaoRedondo>
          </div>
        </div>
      }
      onFechar={fechar}
      rodape={
        <div className="px-7 pb-7 md:px-12 md:pb-9">
          {categorias.length > 1 && (
            <div className="mb-5 flex flex-wrap items-center gap-1.5">
              <Chip ativo={categoria === TODOS} onClick={() => trocarCategoria(TODOS)}>
                Todos
                <span className="ml-1.5 opacity-50">{tipologia.ambientes.length}</span>
              </Chip>
              {categorias.map((c) => {
                const n = tipologia.ambientes.filter((a) => a.categoria === c).length
                return (
                  <Chip key={c} ativo={categoria === c} onClick={() => trocarCategoria(c)}>
                    {c}
                    <span className="ml-1.5 opacity-50">{n}</span>
                  </Chip>
                )
              })}
            </div>
          )}

          <div
            ref={faixaRef}
            className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {lista.map((a, i) => (
              <button
                key={a.id}
                type="button"
                data-ativo={i === indice}
                onClick={() => escolher(i)}
                aria-label={a.titulo}
                aria-current={i === indice}
                className={clsx(
                  'relative h-[52px] w-[92px] shrink-0 overflow-hidden rounded-[3px] transition-all duration-200 md:h-[62px] md:w-[110px]',
                  i === indice
                    ? 'ring-1 ring-areia-100/80 ring-offset-2 ring-offset-grafite-950'
                    : 'opacity-45 hover:opacity-80',
                )}
              >
                <img src={a.src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      }
    >
      {/* palco */}
      <div className="absolute inset-0 flex items-center justify-center px-4 md:px-16">
        <div className="relative h-full w-full max-w-[1500px]">
          <AnimatePresence initial={false}>
            <motion.div
              key={atual.id}
              initial={{ opacity: 0, x: sentido * 22 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: sentido * -22 }}
              transition={SUAVE}
              className="absolute inset-0 flex items-center justify-center"
            >
              <figure className="relative max-h-full">
                <img
                  src={atual.src}
                  alt={atual.titulo}
                  draggable={false}
                  className="max-h-[calc(100vh-290px)] max-w-full object-contain shadow-[0_30px_90px_-30px_rgba(0,0,0,0.9)] select-none"
                />
                <span className="pointer-events-none absolute inset-0 border border-areia-100/10" />
              </figure>
            </motion.div>
          </AnimatePresence>

          {/* setas sobre a imagem */}
          {total > 1 && (
            <>
              <div className="absolute top-1/2 left-0 -translate-y-1/2">
                <BotaoRedondo grande onClick={() => ir(-1)} rotulo="Imagem anterior">
                  <IconeSetaEsq width={22} height={22} />
                </BotaoRedondo>
              </div>
              <div className="absolute top-1/2 right-0 -translate-y-1/2">
                <BotaoRedondo grande onClick={() => ir(1)} rotulo="Próxima imagem">
                  <IconeSetaDir width={22} height={22} />
                </BotaoRedondo>
              </div>
            </>
          )}
        </div>
      </div>
    </Moldura>
  )
}

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={clsx('chip', ativo ? 'chip-on' : 'chip-off')}
    >
      {children}
    </button>
  )
}
