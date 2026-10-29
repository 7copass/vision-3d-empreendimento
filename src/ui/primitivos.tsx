/** Peças mínimas compartilhadas pelo chrome. Só apresentação. */
import type { ReactNode } from 'react'
import clsx from 'clsx'

interface ChipProps {
  ativo?: boolean
  onClick?: () => void
  children: ReactNode
  titulo?: string
  className?: string
}

/** Chip de estado. Usa as classes de src/index.css. */
export function Chip({ ativo = false, onClick, children, titulo, className }: ChipProps) {
  return (
    <button
      type="button"
      title={titulo}
      aria-pressed={ativo}
      onClick={onClick}
      className={clsx('chip', ativo ? 'chip-on' : 'chip-off', className)}
    >
      {children}
    </button>
  )
}

/** Separador vertical discreto entre grupos de chips. */
export function Divisor() {
  return <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-areia-200/18" />
}

/** Rótulo de seção: caixa alta, muito espaçada, bem discreta. */
export function Rotulo({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={clsx(
        'text-[10px] font-medium tracking-[0.18em] text-areia-200/45 uppercase',
        className,
      )}
    >
      {children}
    </p>
  )
}

/** Linha chave → valor. Com `onClick` vira botão e ganha estado ativo. */
export function Linha({
  rotulo,
  valor,
  sufixo,
  onClick,
  ativo = false,
  titulo,
}: {
  rotulo: string
  valor: ReactNode
  sufixo?: ReactNode
  onClick?: () => void
  ativo?: boolean
  titulo?: string
}) {
  const base =
    'flex w-full items-baseline gap-3 border-b border-areia-200/8 py-1.5 text-left last:border-b-0'

  const conteudo = (
    <>
      <span
        className={clsx(
          'min-w-0 flex-1 truncate text-[12.5px]',
          ativo ? 'text-areia-50' : 'text-areia-100/80',
        )}
      >
        {rotulo}
      </span>
      <span
        className={clsx(
          'shrink-0 text-[12.5px] tabular-nums',
          ativo ? 'text-rio-300' : 'text-areia-50',
        )}
      >
        {valor}
      </span>
      {sufixo ? <span className="shrink-0 text-[11px] text-areia-200/45">{sufixo}</span> : null}
    </>
  )

  if (!onClick) return <div className={base}>{conteudo}</div>

  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      aria-pressed={ativo}
      className={clsx(
        base,
        '-mx-1.5 rounded-[5px] px-1.5 transition-colors duration-150',
        ativo ? 'bg-areia-100/10' : 'hover:bg-white/6',
      )}
    >
      {conteudo}
    </button>
  )
}
