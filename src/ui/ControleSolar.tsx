/** Estudo de sol: hora, mês e os quatro presets. Rodapé esquerdo. */
import clsx from 'clsx'
import { useTour } from '../core/store'
import type { PresetHora } from '../core/types'
import { horaLegivel, mesLegivel } from './formato'
import { Chip, Rotulo } from './primitivos'
import { CLASSE_SLIDER } from './tokens'

const PRESETS: { id: PresetHora; rotulo: string }[] = [
  { id: 'manha', rotulo: 'Manhã' },
  { id: 'meiodia', rotulo: 'Meio-dia' },
  { id: 'portaldosol', rotulo: 'Pôr do sol' },
  { id: 'noite', rotulo: 'Noite' },
]

/** 10 minutos em hora decimal. */
const PASSO = 1 / 6

export function ControleSolar({ className }: { className?: string }) {
  const hora = useTour((s) => s.hora)
  const mes = useTour((s) => s.mes)
  const preset = useTour((s) => s.preset)
  const presetExato = useTour((s) => s.presetExato)
  const setHora = useTour((s) => s.setHora)
  const setMes = useTour((s) => s.setMes)
  const setPreset = useTour((s) => s.setPreset)

  return (
    <section
      aria-label="Estudo de sol"
      className={clsx(
        'vidro pointer-events-auto w-full max-w-[calc(100vw-1.5rem)] rounded-2xl px-4 py-3',
        'shadow-2xl shadow-black/40',
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <Rotulo>Sol em Santarém</Rotulo>
        <span className="font-display text-[22px] leading-none tabular-nums text-areia-50">
          {horaLegivel(hora)}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={24}
        step={PASSO}
        value={hora}
        onChange={(e) => setHora(Number(e.target.value))}
        aria-label="Hora do dia"
        aria-valuetext={horaLegivel(hora)}
        className={clsx('mt-2', CLASSE_SLIDER)}
      />
      <div className="mt-0.5 flex justify-between text-[9.5px] tabular-nums text-areia-200/30">
        <span>00h</span>
        <span>06h</span>
        <span>12h</span>
        <span>18h</span>
        <span>24h</span>
      </div>

      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <Rotulo className="text-areia-200/35">Mês</Rotulo>
        <span className="text-[12px] text-areia-50">{mesLegivel(mes)}</span>
      </div>
      <input
        type="range"
        min={1}
        max={12}
        step={1}
        value={mes}
        onChange={(e) => setMes(Number(e.target.value))}
        aria-label="Mês do ano"
        aria-valuetext={mesLegivel(mes)}
        className={clsx('mt-1.5', CLASSE_SLIDER)}
      />

      <div className="mt-2.5 flex flex-wrap gap-1 border-t border-areia-200/10 pt-2.5">
        {PRESETS.map((p) => (
          <Chip
            key={p.id}
            ativo={presetExato && preset === p.id}
            onClick={() => setPreset(p.id)}
            className="px-2.5 text-[11.5px]"
          >
            {p.rotulo}
          </Chip>
        ))}
      </div>
    </section>
  )
}
