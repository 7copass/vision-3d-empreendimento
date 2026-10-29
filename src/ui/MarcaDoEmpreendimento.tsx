/** Assinatura do empreendimento e o resumo de estoque, no canto superior esquerdo. */
import { useMemo } from 'react'
import clsx from 'clsx'
import { EMPREENDIMENTO } from '../data/project'
import { resumoEstoque } from '../data/inventory'

export function MarcaDoEmpreendimento({ className }: { className?: string }) {
  const resumo = useMemo(() => resumoEstoque(), [])

  return (
    <header
      className={clsx(
        'vidro pointer-events-auto rounded-2xl px-4 py-3 shadow-2xl shadow-black/40',
        className,
      )}
    >
      <h1 className="font-display text-[30px] leading-[1.05] tracking-[0.01em] text-areia-50">
        {EMPREENDIMENTO.nome}
      </h1>
      <p className="mt-1 text-[11px] tracking-[0.16em] text-areia-200/60 uppercase">
        {EMPREENDIMENTO.subtitulo}
      </p>
      <p className="mt-2 truncate text-[12px] leading-snug text-areia-100/70">
        {EMPREENDIMENTO.construtora}
        <span className="mx-1.5 text-areia-200/30">·</span>
        {EMPREENDIMENTO.cidade}/{EMPREENDIMENTO.uf}
      </p>

      <div className="mt-2.5 flex items-center gap-2 border-t border-areia-200/10 pt-2">
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-disponivel" />
        <p className="text-[12px] text-areia-100/85">
          <strong className="font-medium tabular-nums text-areia-50">{resumo.disponivel}</strong>
          <span className="text-areia-200/55"> de </span>
          <strong className="font-medium tabular-nums text-areia-50">{resumo.total}</strong>
          <span className="text-areia-200/55"> disponíveis</span>
        </p>
      </div>
    </header>
  )
}
