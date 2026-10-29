/** Legenda discreta das três cores de status. */
import clsx from 'clsx'
import { FUNDO_STATUS, ROTULO_STATUS, STATUS_ORDEM } from './tokens'

export function Legenda({ className }: { className?: string }) {
  return (
    <aside
      aria-label="Legenda de status"
      className={clsx(
        'vidro pointer-events-auto flex items-center gap-3.5 rounded-full px-3.5 py-2',
        className,
      )}
    >
      {STATUS_ORDEM.map((s) => (
        <span key={s} className="flex items-center gap-1.5">
          <span aria-hidden className={clsx('size-2 rounded-[2px]', FUNDO_STATUS[s])} />
          <span className="text-[11px] whitespace-nowrap text-areia-200/65">
            {ROTULO_STATUS[s]}
          </span>
        </span>
      ))}
    </aside>
  )
}
