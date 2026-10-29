import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { IconeFechar } from './icones'

export const ENTRADA = {
  initial: { opacity: 0, scale: 0.992 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.996 },
  transition: { duration: 0.26, ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number] },
}

/** Curva curta e sem balanço, reutilizada em todos os visualizadores. */
export const SUAVE = { duration: 0.24, ease: [0.22, 0.61, 0.36, 1] as [number, number, number, number] }

interface MolduraProps {
  titulo: string
  sobretitulo?: string
  subtitulo?: ReactNode
  /** Conteúdo alinhado à direita do cabeçalho (contadores, paginação). */
  canto?: ReactNode
  /** Faixa inferior fixa (chips, miniaturas, controles). */
  rodape?: ReactNode
  onFechar: () => void
  children: ReactNode
  claro?: boolean
  className?: string
}

/**
 * Casca em tela cheia de todo visualizador: cabeçalho sóbrio, botão de fechar
 * sempre visível, rodapé opcional e muito respiro no miolo.
 */
export function Moldura({
  titulo,
  sobretitulo,
  subtitulo,
  canto,
  rodape,
  onFechar,
  children,
  claro = false,
  className,
}: MolduraProps) {
  return (
    <motion.section
      {...ENTRADA}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className={clsx(
        'fixed inset-0 z-40 flex flex-col overflow-hidden',
        claro ? 'bg-areia-50 text-grafite-900' : 'bg-grafite-950 text-areia-100',
        className,
      )}
    >
      <header className="relative z-10 flex shrink-0 items-start justify-between gap-6 px-7 pt-6 pb-4 md:px-12 md:pt-9">
        <div className="min-w-0">
          {sobretitulo && (
            <p
              className={clsx(
                'mb-1.5 text-[10px] tracking-[0.3em] uppercase',
                claro ? 'text-grafite-500' : 'text-areia-300/60',
              )}
            >
              {sobretitulo}
            </p>
          )}
          <h2 className="font-display truncate text-[26px] leading-none font-light md:text-[34px]">
            {titulo}
          </h2>
          {subtitulo && (
            <div
              className={clsx(
                'mt-2 text-[12.5px] font-light',
                claro ? 'text-grafite-500' : 'text-areia-200/60',
              )}
            >
              {subtitulo}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-5">
          {canto}
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar (Esc)"
            title="Fechar · Esc"
            className={clsx(
              'group flex items-center gap-2 rounded-full border px-3.5 py-2 transition-colors duration-200',
              claro
                ? 'border-grafite-900/15 text-grafite-500 hover:border-grafite-900/35 hover:text-grafite-900'
                : 'border-areia-200/15 text-areia-200/70 hover:border-areia-200/40 hover:text-areia-50',
            )}
          >
            <span className="hidden text-[10px] tracking-[0.22em] uppercase sm:inline">Esc</span>
            <IconeFechar width={16} height={16} />
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">{children}</div>

      {rodape && <div className="relative z-10 shrink-0">{rodape}</div>}
    </motion.section>
  )
}

interface BotaoRedondoProps {
  onClick: () => void
  rotulo: string
  children: ReactNode
  desabilitado?: boolean
  grande?: boolean
  claro?: boolean
  className?: string
}

/** Botão circular de vidro — setas, zoom, play. */
export function BotaoRedondo({
  onClick,
  rotulo,
  children,
  desabilitado,
  grande,
  claro,
  className,
}: BotaoRedondoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      aria-label={rotulo}
      title={rotulo}
      className={clsx(
        'grid place-items-center rounded-full border transition-all duration-200',
        grande ? 'h-12 w-12' : 'h-9 w-9',
        desabilitado
          ? 'pointer-events-none opacity-25'
          : claro
            ? 'border-grafite-900/15 text-grafite-500 hover:border-grafite-900/35 hover:text-grafite-900'
            : 'vidro text-areia-200/75 hover:text-areia-50 hover:border-areia-200/35',
        className,
      )}
    >
      {children}
    </button>
  )
}
