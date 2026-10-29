/**
 * Espelho de vendas: 20 pavimentos empilhados, do 20º no topo ao 1º embaixo,
 * para a torre ativa. Cada pastilha é uma unidade, colorida pelo status.
 */
import { useMemo } from 'react'
import clsx from 'clsx'
import { passaNosFiltros, useTour } from '../core/store'
import { unidadesDoPavimento } from '../data/inventory'
import {
  ANDAR_COBERTURA,
  PAVIMENTOS as PAVIMENTOS_DO_MUNDO,
  POSICOES as POSICOES_DO_MUNDO,
  TORRES,
} from '../core/world'
import type { Posicao, TowerId, Unidade } from '../core/types'
import { Rotulo } from './primitivos'
import { FUNDO_STATUS, ROTULO_STATUS } from './tokens'
import { moedaCurta } from './formato'

// Quantas posições e quais pavimentos existem é do empreendimento, não daqui:
// Village One tem 4 por pavimento e numera de 1 a 20; o Flat Premium II tem
// 11 e numera de 2 a 7.
const POSICOES: Posicao[] = POSICOES_DO_MUNDO
const PAVIMENTOS = [...PAVIMENTOS_DO_MUNDO].reverse()

function mapaDoPavimento(torre: TowerId, andar: number): Map<Posicao, Unidade> {
  const m = new Map<Posicao, Unidade>()
  for (const u of unidadesDoPavimento(torre, andar)) m.set(u.posicao, u)
  return m
}

export function PainelPavimentos({ className }: { className?: string }) {
  const torreAtiva = useTour((s) => s.torreAtiva)
  const andarAtivo = useTour((s) => s.andarAtivo)
  const selecionada = useTour((s) => s.unidadeSelecionada)
  const hover = useTour((s) => s.unidadeHover)
  const filtros = useTour((s) => s.filtros)
  const setTorreAtiva = useTour((s) => s.setTorreAtiva)
  const setAndarAtivo = useTour((s) => s.setAndarAtivo)
  const selecionarUnidade = useTour((s) => s.selecionarUnidade)
  const hoverUnidade = useTour((s) => s.hoverUnidade)
  const stackAberto = useTour((s) => s.stackAberto)
  const setStackAberto = useTour((s) => s.setStackAberto)

  const torre: TowerId = torreAtiva ?? 'A'

  const pavimentos = useMemo(
    () =>
      PAVIMENTOS.map((andar) => ({
        andar,
        unidades: mapaDoPavimento(torre, andar),
      })),
    [torre],
  )

  const disponiveisNaTorre = useMemo(
    () =>
      pavimentos.reduce(
        (soma, p) =>
          soma + [...p.unidades.values()].filter((u) => u.status === 'disponivel').length,
        0,
      ),
    [pavimentos],
  )

  return (
    <section
      aria-label="Pavimentos e estoque"
      className={clsx(
        'vidro pointer-events-auto flex min-h-0 w-[228px] flex-col overflow-hidden rounded-2xl',
        'px-3 py-3 shadow-2xl shadow-black/40',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Rotulo>Pavimentos</Rotulo>
        <button
          type="button"
          onClick={() => setStackAberto(!stackAberto)}
          aria-expanded={stackAberto}
          title={stackAberto ? 'Recolher o espelho de vendas' : 'Expandir o espelho de vendas'}
          className="flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums text-areia-200/45 transition-colors duration-150 hover:bg-white/8 hover:text-areia-50"
        >
          {disponiveisNaTorre} livres
          <span
            aria-hidden
            className={clsx(
              'text-[9px] transition-transform duration-200',
              stackAberto ? 'rotate-0' : 'rotate-180',
            )}
          >
            ▴
          </span>
        </button>
      </div>

      <div
        role="group"
        aria-label="Torre"
        className="mt-2 flex gap-1 rounded-full bg-black/25 p-0.5"
      >
        {TORRES.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={torre === t.id}
            onClick={() => setTorreAtiva(t.id)}
            title={t.nome}
            className={clsx(
              'flex-1 rounded-full py-1 text-[11.5px] leading-none transition-colors duration-200',
              torre === t.id
                ? 'bg-areia-100 font-medium text-grafite-900'
                : 'text-areia-200/60 hover:bg-white/8 hover:text-areia-50',
            )}
          >
            Torre {t.id}
          </button>
        ))}
      </div>

      {stackAberto ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mt-2.5 min-h-0 flex-1 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
            {pavimentos.map(({ andar, unidades }) => {
              const ativo = andarAtivo === andar
              return (
                <div
                  key={andar}
                  className={clsx(
                    'flex items-center gap-2 rounded-[6px] px-1 py-[2px] transition-colors duration-150',
                    ativo && 'bg-areia-100/8',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setAndarAtivo(ativo ? null : andar)}
                    title={andar === ANDAR_COBERTURA ? 'Cobertura duplex' : `${andar}º pavimento`}
                    className={clsx(
                      'w-6 shrink-0 text-right text-[10.5px] tabular-nums transition-colors',
                      ativo ? 'text-areia-50' : 'text-areia-200/40 hover:text-areia-100',
                    )}
                  >
                    {andar}
                  </button>

                  <div className="grid flex-1 grid-cols-4 gap-1">
                    {POSICOES.map((pos) => {
                      const u = unidades.get(pos)
                      if (!u) {
                        return (
                          <span
                            key={pos}
                            aria-hidden
                            className="h-[17px] rounded-[3px] border border-dashed border-areia-200/8"
                          />
                        )
                      }
                      const dentro = passaNosFiltros(u, filtros)
                      const estaSelecionada = selecionada === u.id
                      const estaHover = hover === u.id
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onMouseEnter={() => hoverUnidade(u.id)}
                          onMouseLeave={() => hoverUnidade(null)}
                          onFocus={() => hoverUnidade(u.id)}
                          onBlur={() => hoverUnidade(null)}
                          onClick={() => selecionarUnidade(u.id)}
                          title={`Torre ${u.torre} · ${u.numero} — ${ROTULO_STATUS[u.status]} · ${moedaCurta(u.preco)}`}
                          aria-label={`Unidade ${u.numero}, torre ${u.torre}, ${ROTULO_STATUS[u.status]}`}
                          className={clsx(
                            'h-[17px] rounded-[3px] text-[9px] leading-[17px] font-medium text-grafite-900/70',
                            'transition-[opacity,transform,box-shadow] duration-150',
                            FUNDO_STATUS[u.status],
                            dentro ? 'opacity-100' : 'opacity-20',
                            estaHover && 'z-10 scale-[1.14]',
                            estaSelecionada &&
                              'ring-2 ring-areia-50 ring-offset-1 ring-offset-grafite-900 scale-[1.08] opacity-100',
                          )}
                        >
                          {pos}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-2 border-t border-areia-200/10 pt-2 text-[10px] leading-snug text-areia-200/35">
            Posições 1 e 2 — Tipo 1 · 3 e 4 — Tipo 2 · 20º pavimento, coberturas duplex.
          </p>
        </div>
      ) : null}
    </section>
  )
}
