/**
 * Fileira central de chips: tipologia, modos de tela e horário.
 * Tudo escreve direto no store — nenhum estado local.
 */
import clsx from 'clsx'
import { useTour } from '../core/store'
import { TIPOLOGIAS } from '../data/project'
import type { PresetHora } from '../core/types'
import { Chip, Divisor } from './primitivos'

const HORARIOS: { id: PresetHora; rotulo: string }[] = [
  { id: 'manha', rotulo: 'Manhã' },
  { id: 'meiodia', rotulo: 'Meio-dia' },
  { id: 'portaldosol', rotulo: 'Pôr do sol' },
  { id: 'noite', rotulo: 'Noite' },
]

export function BarraSuperior({ className }: { className?: string }) {
  const modo = useTour((s) => s.modo)
  const preset = useTour((s) => s.preset)
  const presetExato = useTour((s) => s.presetExato)
  const tipologias = useTour((s) => s.filtros.tipologias)
  const setModo = useTour((s) => s.setModo)
  const setPreset = useTour((s) => s.setPreset)
  const setFiltros = useTour((s) => s.setFiltros)

  const alternarTipologia = (id: string) => {
    const dentro = tipologias.includes(id)
    setFiltros({
      tipologias: dentro ? tipologias.filter((t) => t !== id) : [...tipologias, id],
    })
  }

  return (
    <nav
      aria-label="Estados do tour"
      className={clsx(
        'vidro pointer-events-auto flex max-w-full shrink-0 flex-nowrap items-center gap-1',
        'overflow-x-auto rounded-full px-2.5 py-1.5 shadow-2xl shadow-black/40',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {TIPOLOGIAS.map((t) => (
        <Chip
          key={t.id}
          ativo={tipologias.includes(t.id)}
          onClick={() => alternarTipologia(t.id)}
          titulo={`${t.nome} — ${t.rotulo}`}
          className="px-2.5 text-[12px]"
        >
          {t.nome}
        </Chip>
      ))}

      <Divisor />

      <Chip
        ativo={modo === 'orbita'}
        onClick={() => setModo('orbita')}
        titulo="Girar o complexo inteiro"
        className="px-2.5 text-[12px]"
      >
        Rotação 3D
      </Chip>
      <Chip
        ativo={modo === 'filme'}
        onClick={() => setModo('filme')}
        titulo="Abrir o filme do empreendimento"
        className="px-2.5 text-[12px]"
      >
        <span aria-hidden>▶</span> Filme
      </Chip>
      <Chip
        ativo={modo === 'galeria'}
        onClick={() => setModo('galeria')}
        titulo="Galeria de ambientes e lazer"
        className="px-2.5 text-[12px]"
      >
        Experiências
      </Chip>

      <Divisor />

      {HORARIOS.map((h) => (
        <Chip
          key={h.id}
          ativo={presetExato && preset === h.id}
          onClick={() => setPreset(h.id)}
          titulo={`Estudo de sol — ${h.rotulo}`}
          className="px-2.5 text-[12px]"
        >
          {h.rotulo}
        </Chip>
      ))}
    </nav>
  )
}
