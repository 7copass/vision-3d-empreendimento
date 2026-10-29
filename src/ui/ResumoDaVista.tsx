/**
 * Etiqueta da varanda em que se está, no modo 'vista'.
 *
 * Não é a ficha encolhida: ali a tela inteira é o produto e o espelho de
 * vendas logo abaixo virou o jeito de pular de varanda em varanda ("e do
 * 15º?"). Então este cartão carrega só o que identifica a unidade sob os pés
 * — número, status, tipologia e preço — e o caminho de volta. Orientação e
 * vista saíram de propósito: estão na janela, escritas seria redundância
 * ocupando altura que o espelho usa melhor.
 *
 * Mora na coluna direita do `<Chrome />`, acima do `<PainelPavimentos />`,
 * como irmão flex — é o que garante que os dois nunca se cubram.
 */
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useTour } from '../core/store'
import { unidadeById } from '../data/inventory'
import { tipologiaById } from '../data/project'
import { moeda } from './formato'
import { FUNDO_STATUS, ROTULO_STATUS } from './tokens'

const RAPIDO = { duration: 0.16, ease: 'easeOut' } as const

export function ResumoDaVista({ className }: { className?: string }) {
  const modo = useTour((s) => s.modo)
  const drawerAberto = useTour((s) => s.drawerAberto)
  const id = useTour((s) => s.unidadeSelecionada)
  const setModo = useTour((s) => s.setModo)
  const selecionarUnidade = useTour((s) => s.selecionarUnidade)

  const unidade = id ? unidadeById(id) : undefined
  const visivel = modo === 'vista' && drawerAberto && unidade

  return (
    <AnimatePresence>
      {visivel ? (
        <motion.aside
          key="resumo-vista"
          aria-label={`Unidade em vista: ${unidade.numero}`}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={RAPIDO}
          className={clsx(
            'vidro pointer-events-auto w-full shrink-0 overflow-hidden rounded-2xl',
            'px-3.5 py-3 shadow-2xl shadow-black/50',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-display text-[23px] leading-[1.05] text-areia-50">
              Torre {unidade.torre} <span className="text-areia-200/35">·</span> {unidade.numero}
            </h2>
            <button
              type="button"
              onClick={() => selecionarUnidade(null)}
              aria-label="Fechar e voltar para a órbita"
              title="Fechar (Esc)"
              className="-mt-0.5 -mr-1 grid size-6 shrink-0 place-items-center rounded-full text-areia-200/60 transition-colors hover:bg-white/8 hover:text-areia-50"
            >
              <span aria-hidden className="text-[14px] leading-none">
                ×
              </span>
            </button>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className={clsx(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium text-grafite-900',
                FUNDO_STATUS[unidade.status],
              )}
            >
              {ROTULO_STATUS[unidade.status]}
            </span>
            <span className="text-[11.5px] text-areia-100/70">
              {tipologiaById(unidade.tipologiaId).nome}
            </span>
            <span className="font-display ml-auto text-[17px] leading-none tabular-nums text-areia-50">
              {moeda(unidade.preco)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setModo('unidade')}
            className="mt-2.5 w-full rounded-lg border border-areia-200/14 px-3 py-1.5 text-[11.5px] text-areia-100/85 transition-colors duration-150 hover:border-areia-200/35 hover:bg-white/6 hover:text-areia-50"
          >
            Ver ficha completa
          </button>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
