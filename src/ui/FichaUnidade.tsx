/**
 * Drawer da unidade: carrossel, métricas, preço, descrição,
 * distâncias até cada amenidade e pontos urbanos de Santarém.
 */
import { useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useTour } from '../core/store'
import { unidadeById } from '../data/inventory'
import { AMENIDADES, EMPREENDIMENTO, PONTOS_URBANOS, tipologiaById } from '../data/project'
import type { Ambiente, Modo, Unidade } from '../core/types'
import { area, km, metros, minutos, moeda } from './formato'
import { Linha, Rotulo } from './primitivos'
import { SimuladorDePagamento } from './SimuladorDePagamento'
import { FUNDO_STATUS, ROTULO_ORIENTACAO, ROTULO_STATUS } from './tokens'

const SUAVE = { duration: 0.22, ease: [0.22, 1, 0.36, 1] } as const
const RAPIDO = { duration: 0.16, ease: 'easeOut' } as const

const ATALHOS: { modo: Modo; rotulo: string; dica: string }[] = [
  {
    modo: 'vista',
    rotulo: 'Vista da janela',
    dica: 'Câmera na varanda desta unidade',
  },
  {
    modo: 'plantas',
    rotulo: 'Plantas',
    dica: 'Planta humanizada da tipologia',
  },
  { modo: 'galeria', rotulo: 'Galeria', dica: 'Renders dos ambientes' },
  { modo: 'mapa', rotulo: 'Mapa', dica: 'Distâncias até Santarém' },
]

function Carrossel({ ambientes }: { ambientes: Ambiente[] }) {
  const ambienteAtivo = useTour((s) => s.ambienteAtivo)
  const setAmbienteAtivo = useTour((s) => s.setAmbienteAtivo)

  const total = ambientes.length
  // `ambienteAtivo` nulo (ou de outra tipologia) cai na primeira imagem.
  const i = Math.max(
    0,
    ambientes.findIndex((a) => a.id === ambienteAtivo),
  )
  const atual = ambientes[i]

  const ir = (delta: number) => {
    if (!total) return
    setAmbienteAtivo(ambientes[(i + delta + total) % total].id)
  }

  if (!atual) {
    return <div className="aspect-[16/9] w-full shrink-0 bg-grafite-800" />
  }

  return (
    <div className="shrink-0">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-grafite-800">
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={atual.id}
            src={atual.src}
            alt={atual.titulo}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={RAPIDO}
            className="absolute inset-0 size-full object-cover"
          />
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-grafite-950/85 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-3 pb-2.5">
          <div className="min-w-0">
            <p className="truncate text-[12.5px] text-areia-50">{atual.titulo}</p>
            <p className="text-[10px] tracking-[0.14em] text-areia-200/55 uppercase">
              {atual.categoria}
            </p>
          </div>
          <span className="shrink-0 text-[11px] tabular-nums text-areia-200/60">
            {i + 1}/{total}
          </span>
        </div>

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => ir(-1)}
              aria-label="Imagem anterior"
              className="absolute top-1/2 left-2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-grafite-950/55 text-areia-100 backdrop-blur-sm transition-colors hover:bg-grafite-950/80"
            >
              <span aria-hidden>‹</span>
            </button>
            <button
              type="button"
              onClick={() => ir(1)}
              aria-label="Próxima imagem"
              className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-grafite-950/55 text-areia-100 backdrop-blur-sm transition-colors hover:bg-grafite-950/80"
            >
              <span aria-hidden>›</span>
            </button>
          </>
        ) : null}
      </div>

      {total > 1 ? (
        <div className="flex gap-1.5 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ambientes.map((a, idx) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAmbienteAtivo(a.id)}
              aria-label={a.titulo}
              aria-current={idx === i}
              className={clsx(
                'h-10 w-16 shrink-0 overflow-hidden rounded-[4px] border transition-all duration-150',
                idx === i
                  ? 'border-areia-100 opacity-100'
                  : 'border-transparent opacity-45 hover:opacity-80',
              )}
            >
              <img src={a.src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Metrica({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <div className="rounded-lg bg-white/4 px-2.5 py-2">
      <p className="text-[14px] tabular-nums text-areia-50">{valor}</p>
      <p className="mt-0.5 text-[10px] tracking-[0.1em] text-areia-200/45 uppercase">{rotulo}</p>
    </div>
  )
}

function Conteudo({ unidade, onFechar }: { unidade: Unidade; onFechar: () => void }) {
  const setModo = useTour((s) => s.setModo)
  const tipologia = useMemo(() => tipologiaById(unidade.tipologiaId), [unidade.tipologiaId])

  const amenidadeAtiva = useTour((s) => s.amenidadeAtiva)
  const setAmenidadeAtiva = useTour((s) => s.setAmenidadeAtiva)

  const distancias = useMemo(
    () =>
      AMENIDADES.map((a) => ({
        amenidade: a,
        m: unidade.distancias[a.id] ?? 0,
      })).sort((x, y) => x.m - y.m),
    [unidade],
  )

  const urbanos = useMemo(
    () => [...PONTOS_URBANOS].sort((a, b) => a.distanciaKm - b.distanciaKm),
    [],
  )

  // Pavimento sem situação comercial no material recebido: "R$ 0" lê como erro
  // de sistema na reunião. A unidade fica sob consulta, e o dado segue intacto.
  const semPreco = unidade.preco <= 0

  return (
    <>
      <div className="relative shrink-0">
        <Carrossel ambientes={tipologia.ambientes} />
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar ficha da unidade"
          title="Fechar (Esc)"
          className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full bg-grafite-950/55 text-areia-100 backdrop-blur-sm transition-colors hover:bg-grafite-950/85"
        >
          <span aria-hidden className="text-[15px] leading-none">
            ×
          </span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-5 [scrollbar-width:thin]">
        <Rotulo>Unidade</Rotulo>
        <h2 className="font-display mt-1 text-[38px] leading-[1.02] text-areia-50">
          Torre {unidade.torre} <span className="text-areia-200/35">·</span> {unidade.numero}
        </h2>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-grafite-900',
              FUNDO_STATUS[unidade.status],
            )}
          >
            {ROTULO_STATUS[unidade.status]}
          </span>
          <span className="text-[12px] text-areia-100/70">
            {tipologia.nome}
            <span className="mx-1.5 text-areia-200/30">·</span>
            {tipologia.rotulo}
          </span>
        </div>

        <p className="font-display mt-4 text-[27px] leading-none tabular-nums text-areia-50">
          {semPreco ? 'Sob consulta' : moeda(unidade.preco)}
        </p>
        <p className="mt-1 text-[10.5px] leading-snug tracking-[0.12em] text-areia-200/40 uppercase">
          {semPreco ? 'Sem situação comercial no material recebido' : 'Valor de tabela'} ·{' '}
          {unidade.andar}º pavimento
        </p>

        <SimuladorDePagamento key={unidade.id} unidade={unidade} className="mt-4" />

        <div className="mt-4 grid grid-cols-2 gap-1.5">
          <Metrica valor={area(tipologia.areaPrivativa)} rotulo="Área privativa" />
          <Metrica valor={area(tipologia.areaTotal)} rotulo="Área total" />
          <Metrica valor={String(tipologia.dormitorios)} rotulo="Dormitórios" />
          <Metrica valor={String(tipologia.suites)} rotulo="Suítes" />
          <Metrica valor={String(tipologia.vagas)} rotulo="Vagas" />
          <Metrica valor={String(tipologia.banheiros)} rotulo="Banheiros" />
        </div>

        <div className="mt-4">
          <Linha rotulo="Orientação" valor={ROTULO_ORIENTACAO[unidade.orientacao]} />
          <Linha rotulo="Vista" valor={unidade.vista} />
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-areia-100/80">{tipologia.descricao}</p>

        <ul className="mt-3 space-y-1">
          {tipologia.destaques.map((d) => (
            <li key={d} className="flex gap-2 text-[12.5px] text-areia-100/75">
              <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-rio-300" />
              {d}
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-areia-200/12 pt-4">
          <Rotulo>Distâncias desta unidade</Rotulo>
          <p className="mt-1 text-[11px] text-areia-200/40">
            Do centro da unidade até cada item do condomínio. Clique para acender no 3D.
          </p>
          <div className="mt-2">
            {distancias.map(({ amenidade, m }) => (
              <Linha
                key={amenidade.id}
                rotulo={amenidade.nome}
                valor={metros(m)}
                sufixo={amenidade.nivel === 'podium' ? 'pódio' : 'térreo'}
                ativo={amenidadeAtiva === amenidade.id}
                titulo={amenidade.descricao}
                onClick={() =>
                  setAmenidadeAtiva(amenidadeAtiva === amenidade.id ? null : amenidade.id)
                }
              />
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-areia-200/12 pt-4">
          <Rotulo>Santarém a partir daqui</Rotulo>
          <div className="mt-2">
            {urbanos.map((p) => (
              <Linha
                key={p.id}
                rotulo={p.nome}
                valor={km(p.distanciaKm)}
                sufixo={minutos(p.tempoMin)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-areia-200/12 bg-grafite-950/35 px-5 pt-3 pb-3.5">
        <div className="mb-3 flex items-baseline justify-between gap-3 text-[11px]">
          <span className="text-areia-200/50">
            Entrega
            <span className="ml-1.5 text-areia-100/85">{EMPREENDIMENTO.entrega}</span>
          </span>
          <span className="min-w-0 truncate text-right text-areia-200/45">
            {EMPREENDIMENTO.corretora}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {ATALHOS.map((a) => (
            <button
              key={a.modo}
              type="button"
              title={a.dica}
              onClick={() => setModo(a.modo)}
              className="rounded-lg border border-areia-200/14 px-3 py-2 text-[12.5px] text-areia-100/85 transition-colors duration-150 hover:border-areia-200/35 hover:bg-white/6 hover:text-areia-50"
            >
              {a.rotulo}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export function FichaUnidade({ className }: { className?: string }) {
  const drawerAberto = useTour((s) => s.drawerAberto)
  const modo = useTour((s) => s.modo)
  const id = useTour((s) => s.unidadeSelecionada)
  const selecionarUnidade = useTour((s) => s.selecionarUnidade)
  const setModo = useTour((s) => s.setModo)

  const unidade = id ? unidadeById(id) : undefined

  const fechar = useCallback(() => {
    selecionarUnidade(null)
    setModo('orbita')
  }, [selecionarUnidade, setModo])

  // No modo 'vista' quem fica na tela é o <ResumoDaVista />, na coluna direita.
  const visivel = drawerAberto && unidade && modo !== 'vista'

  return (
    <div className={clsx('pointer-events-none absolute inset-0 z-20 overflow-hidden', className)}>
      <AnimatePresence>
        {visivel ? (
          <motion.aside
            key="ficha-completa"
            aria-label={`Ficha da unidade ${unidade.numero}`}
            initial={{ x: 28, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 28, opacity: 0 }}
            transition={SUAVE}
            className={clsx(
              'vidro pointer-events-auto absolute top-3 right-3 bottom-3 flex w-[420px]',
              'max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl',
              'shadow-2xl shadow-black/60',
            )}
          >
            <Conteudo unidade={unidade} onFechar={fechar} />
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
